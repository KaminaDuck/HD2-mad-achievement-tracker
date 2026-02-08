import { Hono } from "hono";
import { recognizeImage } from "../services/ocr.ts";
import { parseOcrText } from "../services/parser.ts";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/png", "image/jpeg"];

export const upload = new Hono().post("/", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!(file instanceof File)) {
    return c.json({ error: "No file provided" }, 400);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return c.json({ error: "File must be PNG or JPEG" }, 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return c.json({ error: "File exceeds 5MB limit" }, 413);
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let ocrText: string;
  try {
    ocrText = await recognizeImage(buffer);
  } catch {
    return c.json({ error: "Could not extract text from image" }, 422);
  }

  if (!ocrText.trim()) {
    return c.json({ error: "Could not extract text from image" }, 422);
  }

  const parsed = parseOcrText(ocrText);

  return c.json({
    stats: parsed.stats,
    confidence: parsed.confidence,
    playerName: parsed.playerName,
    rawText: ocrText,
  });
});
