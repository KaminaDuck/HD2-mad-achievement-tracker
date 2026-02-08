/**
 * Phase 0: OCR Feasibility Spike v2
 *
 * Improved parsing with:
 * 1. Line preprocessing: strip noise before | separator
 * 2. Fuzzy label matching for garbled OCR text
 * 3. Positional fallback: if label not found, try matching by line position
 *
 * Usage: bun run spike-ocr-v2.ts [path-to-image]
 */
import Tesseract from "tesseract.js";
import { join } from "path";

const imagePath =
  process.argv[2] ||
  join(import.meta.dir, "tests/fixtures/sample-player-card.png");

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
const statPatterns: Array<{
  labels: RegExp[];
  key: string;
  isTime?: boolean;
  expectedPosition?: number; // line index in the stat table (0-based from first stat)
}> = [
  {
    labels: [/ENEMY\s*KILLS/i],
    key: "enemyKills",
    expectedPosition: 0,
  },
  {
    labels: [/TERMINID\s*KILLS/i],
    key: "terminidKills",
    expectedPosition: 1,
  },
  {
    labels: [/AUTOMATON\s*KILLS/i],
    key: "automatonKills",
    expectedPosition: 2,
  },
  {
    labels: [/ILLUMINATE\s*KILLS/i, /ILLUMIN\w+\s*KILLS/i],
    key: "illuminateKills",
    expectedPosition: 3,
  },
  {
    labels: [/FRIENDLY\s*KILLS/i],
    key: "friendlyKills",
    expectedPosition: 4,
  },
  {
    labels: [/GRENAD\w*\s*KIL\w*/i],
    key: "grenadeKills",
    expectedPosition: 5,
  },
  {
    labels: [/MELEE\s*KILLS/i],
    key: "meleeKills",
    expectedPosition: 6,
  },
  {
    labels: [/EAGLE\s*KILLS/i],
    key: "eagleKills",
    expectedPosition: 7,
  },
  {
    labels: [/\bDEATHS\b/i],
    key: "deaths",
    expectedPosition: 8,
  },
  {
    labels: [/SHOTS?\s*FIRED/i, /SH\w*TS?\s*\w*I?R\w*D/i],
    key: "shotsFired",
    expectedPosition: 9,
  },
  {
    labels: [/SHOTS?\s*HIT/i, /SH\w*TS?\s*HIT/i],
    key: "shotsHit",
    expectedPosition: 10,
  },
  {
    labels: [/ORBITALS?\s*USED/i],
    key: "orbitalsUsed",
    expectedPosition: 11,
  },
  {
    labels: [/DEFEN\w*\s*STRATS?/i],
    key: "defensiveStratagems",
    expectedPosition: 12,
  },
  {
    labels: [/EAGLE\s*STRATS?/i],
    key: "eagleStratagems",
    expectedPosition: 13,
  },
  {
    labels: [/SUPPLY\s*STRATS?/i],
    key: "supplyStratagems",
    expectedPosition: 14,
  },
  {
    labels: [/OBJECTIVES?\s*DONE/i],
    key: "objectivesCompleted",
    expectedPosition: 15,
  },
  {
    labels: [/MISSIONS?\s*PLAYED/i],
    key: "missionsPlayed",
    expectedPosition: 16,
  },
  {
    labels: [/MISSIONS?\s*WON/i],
    key: "missionsWon",
    expectedPosition: 17,
  },
  {
    labels: [/TIME\s*PLAYED/i],
    key: "inMissionTimeSeconds",
    isTime: true,
    expectedPosition: 18,
  },
  {
    labels: [/\bSAMPLES\b/i],
    key: "samplesCollected",
    expectedPosition: 19,
  },
  {
    labels: [/TOTAL\s*XP/i],
    key: "totalXp",
    expectedPosition: 20,
  },
];

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

for (const { labels, key, isTime, expectedPosition } of statPatterns) {
  let found = false;

  // Strategy 1: Match by label (primary)
  for (const label of labels) {
    const matchingLine = cleanLines.find((l) => label.test(l));
    if (!matchingLine) continue;

    const labelMatch = matchingLine.match(label);
    if (!labelMatch || labelMatch.index === undefined) continue;

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
        break;
      }
    } else {
      const value = extractNumber(afterLabel);
      if (value !== null) {
        extracted[key] = value;
        confidence[key] = "label";
        console.log(`  ${key}: ${value} [label match] ✅`);
        found = true;
        break;
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
