/**
 * Phase 0: OCR Feasibility Spike v2
 *
 * Reads stat labels from data/stat_names.txt (source of truth) and builds
 * OCR-tolerant regex patterns dynamically. Parsing uses:
 * 1. Line preprocessing: strip noise before | separator
 * 2. Label match with OCR tolerance (truncated words, missing spaces)
 * 3. Positional fallback: if label garbled, use known line position
 *
 * Usage: bun run spike-ocr-v2.ts [path-to-image]
 */
import Tesseract from "tesseract.js";
import { join } from "path";

const imagePath =
  process.argv[2] ||
  join(import.meta.dir, "tests/fixtures/sample-player-card.png");

// --- LOAD STAT NAMES FROM SOURCE OF TRUTH ---
const statNamesFile = await Bun.file(
  join(import.meta.dir, "data/stat_names.txt")
).text();
const statLabels = statNamesFile
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l.length > 0);

// Map stat label → camelCase key (non-obvious mappings explicit)
const labelToKey: Record<string, string> = {
  "ENEMY KILLS": "enemyKills",
  "TERMINID KILLS": "terminidKills",
  "AUTOMATON KILLS": "automatonKills",
  "ILLUMINATE KILLS": "illuminateKills",
  "FRIENDLY KILLS": "friendlyKills",
  "GRENADE KILLS": "grenadeKills",
  "MELEE KILLS": "meleeKills",
  "EAGLE KILLS": "eagleKills",
  DEATHS: "deaths",
  "SHOTS FIRED": "shotsFired",
  "SHOTS HIT": "shotsHit",
  "ORBITALS USED": "orbitalsUsed",
  "DEFENSIVE STRATS": "defensiveStratagems",
  "EAGLE STRATS": "eagleStratagems",
  "SUPPLY STRATS": "supplyStratagems",
  "OBJECTIVES DONE": "objectivesCompleted",
  "MISSIONS PLAYED": "missionsPlayed",
  "MISSIONS WON": "missionsWon",
  "TIME PLAYED": "inMissionTimeSeconds",
  SAMPLES: "samplesCollected",
  "TOTAL XP": "totalXp",
};

// Build an OCR-tolerant regex from an exact stat label.
// Each word truncated to 3-4 char stem with lazy \w*? suffix, spaces become \s*.
// Lazy matching prevents first word from consuming the second in merged OCR text.
// "GRENADE KILLS" -> GREN\w*?\s*KIL\w* (matches GRENADEKILS)
// "DEATHS" -> \bDEATH\w*
function buildOcrRegex(label: string): RegExp {
  const words = label.split(/\s+/);
  if (words.length === 1) {
    const stem = words[0].slice(0, Math.max(4, words[0].length - 1));
    return new RegExp(`\\b${stem}\\w*`, "i");
  }
  const pattern = words
    .map((w, i) => {
      // Shorter stem (min 3) for better OCR tolerance with dropped letters
      const stem = w.slice(0, Math.max(3, Math.min(4, w.length - 1)));
      // Lazy on non-final words so they don't consume the next word in merged text
      return i < words.length - 1 ? `${stem}\\w*?` : `${stem}\\w*`;
    })
    .join("\\s*");
  return new RegExp(pattern, "i");
}

console.log("--- Stat labels loaded from data/stat_names.txt ---");
console.log(`  ${statLabels.length} labels\n`);

console.log(`\n=== Phase 0: OCR Feasibility Spike v2 ===`);
console.log(`Image: ${imagePath}\n`);

const startTime = performance.now();

const result = await Tesseract.recognize(imagePath, "eng", {
  logger: (info) => {
    if (info.status === "recognizing text") {
      process.stdout.write(
        `\rRecognizing... ${Math.round((info.progress ?? 0) * 100)}%`
      );
    }
  },
});

const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
console.log(`\rOCR completed in ${elapsed}s\n`);

console.log("=== RAW OCR TEXT ===");
console.log(result.data.text);
console.log("=== END RAW TEXT ===\n");

// --- PREPROCESSING ---
// The card has a character model on the left that creates noise.
// Most stat lines have a | separator between noise and stat data.
// Strip everything before the LAST | on each line.
const rawLines = result.data.text
  .split("\n")
  .filter((l) => l.trim().length > 0);

const cleanLines = rawLines.map((line) => {
  // Strip trailing | first (some lines end with |)
  const stripped = line.replace(/\|\s*$/, "").trim();
  // Find the last | and take everything after it
  const lastPipe = stripped.lastIndexOf("|");
  if (lastPipe >= 0) {
    return stripped.slice(lastPipe + 1).trim();
  }
  // Some garbled lines may use [ instead of | (OCR misread)
  const lastBracket = stripped.lastIndexOf("[");
  if (lastBracket >= 0 && lastBracket < stripped.length / 2) {
    return stripped.slice(lastBracket + 1).trim();
  }
  return stripped;
});

console.log("=== PREPROCESSED LINES ===");
for (let i = 0; i < cleanLines.length; i++) {
  const changed = cleanLines[i] !== rawLines[i].trim();
  console.log(`  ${changed ? "→" : " "} "${cleanLines[i]}"`);
}
console.log();

// --- STAT EXTRACTION ---
// Build patterns dynamically from stat_names.txt
const statPatterns = statLabels.map((label, index) => {
  const key = labelToKey[label];
  if (!key) throw new Error(`No key mapping for stat label: "${label}"`);
  const regex = buildOcrRegex(label);
  console.log(`  ${label} → /${regex.source}/i → ${key}`);
  return {
    label: regex,
    key,
    isTime: key === "inMissionTimeSeconds",
    expectedPosition: index,
  };
});
console.log();

// Find where the stat table starts (first line with "ENEMY KILLS" or similar)
const statTableStart = cleanLines.findIndex((l) =>
  /ENEMY\s*KILLS/i.test(l)
);
console.log(`Stat table starts at line ${statTableStart}`);

function extractNumber(text: string): number | null {
  const match = text.match(/~*\s*([\d,]+)/);
  if (!match) return null;
  return parseInt(match[1].replace(/,/g, ""), 10);
}

function extractTime(text: string): number | null {
  const match = text.match(/(\d+:\d{2}:\d{2})/);
  if (!match) return null;
  const parts = match[1].split(":").map(Number);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

console.log("\n--- Extracted Stats ---");
const extracted: Record<string, number> = {};
const confidence: Record<string, "label" | "position"> = {};
const issues: string[] = [];

for (const { label, key, isTime, expectedPosition } of statPatterns) {
  let found = false;

  // Strategy 1: Match by label (primary)
  const matchingLine = cleanLines.find((l) => label.test(l));
  if (matchingLine) {
    const labelMatch = matchingLine.match(label);
    if (labelMatch && labelMatch.index !== undefined) {
      const afterLabel = matchingLine.slice(
        labelMatch.index + labelMatch[0].length
      );

      if (isTime) {
        const seconds = extractTime(afterLabel);
        if (seconds !== null) {
          extracted[key] = seconds;
          confidence[key] = "label";
          console.log(
            `  ${key}: ${seconds}s (${(seconds / 3600).toFixed(1)}h) [label match] ✅`
          );
          found = true;
        }
      } else {
        const value = extractNumber(afterLabel);
        if (value !== null) {
          extracted[key] = value;
          confidence[key] = "label";
          console.log(`  ${key}: ${value} [label match] ✅`);
          found = true;
        }
      }
    }
  }

  // Strategy 2: Positional fallback — use expected line position in stat table
  if (!found && expectedPosition !== undefined && statTableStart >= 0) {
    const lineIndex = statTableStart + expectedPosition;
    if (lineIndex < cleanLines.length) {
      const line = cleanLines[lineIndex];
      if (isTime) {
        const seconds = extractTime(line);
        if (seconds !== null) {
          extracted[key] = seconds;
          confidence[key] = "position";
          console.log(
            `  ${key}: ${seconds}s (${(seconds / 3600).toFixed(1)}h) [positional fallback, line ${lineIndex}] ⚠️`
          );
          found = true;
        }
      } else {
        const value = extractNumber(line);
        if (value !== null) {
          extracted[key] = value;
          confidence[key] = "position";
          console.log(
            `  ${key}: ${value} [positional fallback, line ${lineIndex}] ⚠️`
          );
          found = true;
        }
      }
    }
  }

  if (!found) {
    console.log(`  ${key}: NOT FOUND ❌`);
    issues.push(`${key}: not found by label or position`);
  }
}

// Known values for card 1 (THUPER)
const expectedValues: Record<string, number> = {
  enemyKills: 761798,
  terminidKills: 349050,
  automatonKills: 232041,
  illuminateKills: 180707,
  friendlyKills: 2394,
  grenadeKills: 22351,
  meleeKills: 37014,
  eagleKills: 43778,
  deaths: 21073,
  shotsFired: 2764314,
  shotsHit: 1505806,
  orbitalsUsed: 15440,
  defensiveStratagems: 10010,
  eagleStratagems: 13824,
  supplyStratagems: 13547,
  objectivesCompleted: 20592,
  missionsPlayed: 4549,
  missionsWon: 4169,
  inMissionTimeSeconds: 362,
  samplesCollected: 58673,
  totalXp: 5073982,
};

if (
  imagePath.includes("sample-player-card.png") &&
  !imagePath.includes("-2")
) {
  console.log("\n--- Accuracy Check (vs visual inspection) ---");
  let correct = 0;
  let total = 0;
  for (const [key, expected] of Object.entries(expectedValues)) {
    total++;
    const actual = extracted[key];
    const method = confidence[key] || "missing";
    if (actual === expected) {
      correct++;
      console.log(`  ${key}: ${actual} === ${expected} [${method}] ✅`);
    } else if (actual !== undefined) {
      console.log(
        `  ${key}: ${actual} !== ${expected} [${method}] ❌ (MISMATCH)`
      );
      issues.push(`${key}: extracted ${actual}, expected ${expected}`);
    } else {
      console.log(`  ${key}: MISSING, expected ${expected} ❌`);
    }
  }
  console.log(
    `\nAccuracy: ${correct}/${total} (${((correct / total) * 100).toFixed(0)}%)`
  );
}

// Player name
console.log(`\n--- Player Name ---`);
const nameCandidate = cleanLines[0]?.split(/\s+/)[0];
console.log(`  Detected: "${nameCandidate}"`);

// Summary
const totalStats = statPatterns.length;
const foundStats = Object.keys(extracted).length;
const labelMatches = Object.values(confidence).filter(
  (c) => c === "label"
).length;
const positionalMatches = Object.values(confidence).filter(
  (c) => c === "position"
).length;

console.log(`\n=== SUMMARY ===`);
console.log(`Stats found: ${foundStats}/${totalStats}`);
console.log(
  `  By label: ${labelMatches} | By position: ${positionalMatches} | Missing: ${totalStats - foundStats}`
);
console.log(`OCR time: ${elapsed}s`);

if (issues.length > 0) {
  console.log(`\nIssues (${issues.length}):`);
  for (const issue of issues) {
    console.log(`  - ${issue}`);
  }
}

const status =
  foundStats >= totalStats * 0.95
    ? "✅ EXCELLENT"
    : foundStats >= totalStats * 0.8
      ? "✅ VIABLE"
      : foundStats >= totalStats * 0.5
        ? "⚠️  MARGINAL"
        : "❌ NOT VIABLE";

console.log(
  `\n${status}: ${foundStats}/${totalStats} stats extracted (${((foundStats / totalStats) * 100).toFixed(0)}%)`
);

// Save outputs
const fixturesDir = join(import.meta.dir, "tests/fixtures");
const baseName = imagePath.includes("-2")
  ? "sample-ocr-output-2.txt"
  : "sample-ocr-output.txt";
await Bun.write(join(fixturesDir, baseName), result.data.text);

const jsonName = imagePath.includes("-2")
  ? "sample-extracted-stats-2.json"
  : "sample-extracted-stats.json";
await Bun.write(join(fixturesDir, jsonName), JSON.stringify(extracted, null, 2));

console.log(`\nSaved: ${baseName}, ${jsonName}`);
