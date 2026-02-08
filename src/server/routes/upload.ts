import { Hono } from "hono";
import { recognizeImage } from "../services/ocr.ts";
import { parseOcrText } from "../services/parser.ts";
import { mergeParseResults } from "../services/merger.ts";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 3;
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

export const upload = new Hono().post("/", async (c) => {
  const body = await c.req.parseBody({ all: true });

  // Normalize: single file or array of files under the "file" key
  const raw = body["file"];
  const entries = Array.isArray(raw) ? raw : [raw];
  const files = entries.filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (files.length > MAX_FILES) {
    return c.json({ error: `Maximum ${MAX_FILES} files allowed` }, 400);
  }

  // Validate all files before processing
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return c.json({ error: "All files must be PNG or JPEG" }, 400);
    }
    if (file.size > MAX_FILE_SIZE) {
      return c.json({ error: "Each file must be under 5MB" }, 413);
    }
  }

  // Process each file through OCR + parser in parallel
  const ocrTexts: string[] = [];
  let parseResults;
  try {
    parseResults = await Promise.all(
      files.map(async (file) => {
        const buffer = Buffer.from(await file.arrayBuffer());
        const ocrText = await recognizeImage(buffer);
        ocrTexts.push(ocrText);

        if (!ocrText.trim()) {
          throw new Error("Could not extract text from image");
        }

        return parseOcrText(ocrText);
      }),
    );
  } catch {
    return c.json({ error: "Could not extract text from image" }, 422);
  }

  const merged = mergeParseResults(parseResults);

  return c.json({
    stats: merged.stats,
    confidence: merged.confidence,
    playerName: merged.playerName,
    rawText: ocrTexts.join("\n---\n"),
  });
});
