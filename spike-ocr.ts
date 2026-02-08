/**
 * Phase 0: OCR Feasibility Spike
 *
 * Tests tesseract.js against hd2clans.com player card images to determine
 * whether OCR is viable for extracting stats.
 *
 * Usage: bun run spike-ocr.ts [path-to-image]
 */
import Tesseract from "tesseract.js";
import { join } from "path";

const imagePath =
  process.argv[2] ||
  join(import.meta.dir, "tests/fixtures/sample-player-card.png");

console.log(`\n=== Phase 0: OCR Feasibility Spike ===`);
console.log(`Image: ${imagePath}\n`);

// Run OCR with word-level confidence data
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

// --- Raw text output ---
console.log("=== RAW OCR TEXT ===");
console.log(result.data.text);
console.log("=== END RAW TEXT ===\n");

console.log("=== STAT EXTRACTION ATTEMPT ===");

// Known stat labels from hd2clans.com cards
// The card has noise from the character render on the left, so lines look like:
//   "noise | STAT_LABEL   VALUE   #RANK   #RANK"
// Strategy: find the stat label, then extract the FIRST number AFTER the label position
const statPatterns: Array<{
  label: RegExp;
  key: string;
  isTime?: boolean;
}> = [
  { label: /ENEMY\s*KILLS/i, key: "enemyKills" },
  { label: /TERMINID\s*KILLS/i, key: "terminidKills" },
  { label: /AUTOMATON\s*KILLS/i, key: "automatonKills" },
  { label: /ILLUMINATE\s*KILLS/i, key: "illuminateKills" },
  { label: /FRIENDLY\s*KILLS/i, key: "friendlyKills" },
  { label: /GRENADE?\s*KI?LLS?/i, key: "grenadeKills" },
  { label: /MELEE\s*KILLS/i, key: "meleeKills" },
  { label: /EAGLE\s*KILLS/i, key: "eagleKills" },
  { label: /\bDEATHS\b/i, key: "deaths" },
  { label: /SHOTS?\s*FIRED/i, key: "shotsFired" },
  { label: /SHOTS?\s*HIT/i, key: "shotsHit" },
  { label: /ORBITALS?\s*USED/i, key: "orbitalsUsed" },
  { label: /DEFEN\w*\s*STRATS?/i, key: "defensiveStratagems" },
  { label: /EAGLE\s*STRATS?/i, key: "eagleStratagems" },
  { label: /SUPPLY\s*STRATS?/i, key: "supplyStratagems" },
  { label: /OBJECTIVES?\s*DONE/i, key: "objectivesCompleted" },
  { label: /MISSIONS?\s*PLAYED/i, key: "missionsPlayed" },
  { label: /MISSIONS?\s*WON/i, key: "missionsWon" },
  { label: /TIME\s*PLAYED/i, key: "inMissionTimeSeconds", isTime: true },
  { label: /\bSAMPLES\b/i, key: "samplesCollected" },
  { label: /TOTAL\s*XP/i, key: "totalXp" },
];

const lines = result.data.text.split("\n").filter((l) => l.trim().length > 0);

console.log(`\nParseable lines (${lines.length}):`);
for (const line of lines) {
  console.log(`  "${line.trim()}"`);
}

console.log("\n--- Extracted Stats ---");
const extracted: Record<string, number | string> = {};
const issues: string[] = [];

for (const { label, key, isTime } of statPatterns) {
  // Find the line matching this stat label
  const matchingLine = lines.find((l) => label.test(l));

  if (!matchingLine) {
    // Try fuzzy matching - some OCR garbling like SHotsEReD
    console.log(`  ${key}: NOT FOUND ❌`);
    issues.push(`${key}: label not found in OCR text`);
    continue;
  }

  // Find where the label match ends in the line
  const labelMatch = matchingLine.match(label);
  if (!labelMatch || labelMatch.index === undefined) {
    console.log(`  ${key}: LABEL MATCH FAILED ❌`);
    issues.push(`${key}: label regex matched line but couldn't get position`);
    continue;
  }

  // Only look at text AFTER the label
  const afterLabel = matchingLine.slice(
    labelMatch.index + labelMatch[0].length
  );

  if (isTime) {
    // Time format: H:MM:SS or HH:MM:SS
    const timeMatch = afterLabel.match(/(\d+:\d{2}:\d{2})/);
    if (timeMatch) {
      const parts = timeMatch[1].split(":").map(Number);
      const seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      extracted[key] = seconds;
      console.log(
        `  ${key}: "${timeMatch[1]}" -> ${seconds}s (${(seconds / 3600).toFixed(1)}h)`
      );
    } else {
      console.log(
        `  ${key}: TIME NOT FOUND in afterLabel="${afterLabel.trim()}" ❌`
      );
      issues.push(`${key}: time pattern not found after label`);
    }
  } else {
    // Extract first number with commas after the label
    // Match: optional ~~ noise, then digits with optional commas
    const numMatch = afterLabel.match(/~*\s*([\d,]+)/);
    if (numMatch) {
      const raw = numMatch[1];
      const value = parseInt(raw.replace(/,/g, ""), 10);
      extracted[key] = value;
      console.log(`  ${key}: "${raw}" -> ${value} ✅`);
    } else {
      console.log(
        `  ${key}: NUMBER NOT FOUND in afterLabel="${afterLabel.trim()}" ❌`
      );
      issues.push(`${key}: number not found after label`);
    }
  }
}

// Known values from visual inspection of the THUPER card
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
  inMissionTimeSeconds: 362, // 0:06:02
  samplesCollected: 58673,
  totalXp: 5073982,
};

// Verify against expected values (only for card 1)
if (imagePath.includes("sample-player-card.png") && !imagePath.includes("-2")) {
  console.log("\n--- Accuracy Check (vs visual inspection) ---");
  let correct = 0;
  let total = 0;
  for (const [key, expected] of Object.entries(expectedValues)) {
    total++;
    const actual = extracted[key];
    if (actual === expected) {
      correct++;
      console.log(`  ${key}: ${actual} === ${expected} ✅`);
    } else if (actual !== undefined) {
      console.log(`  ${key}: ${actual} !== ${expected} ❌ (MISMATCH)`);
      issues.push(`${key}: extracted ${actual}, expected ${expected}`);
    } else {
      console.log(`  ${key}: MISSING, expected ${expected} ❌`);
    }
  }
  console.log(`\nAccuracy: ${correct}/${total} (${((correct / total) * 100).toFixed(0)}%)`);
}

// Player name extraction
console.log(`\n--- Player Name ---`);
// Look for the first line that has a name-like word (all caps, no pipes)
const nameCandidate = lines[0]?.replace(/[|]/g, "").trim().split(/\s+/)[0];
console.log(`  Detected: "${nameCandidate}"`);

// Summary
const totalStats = statPatterns.length;
const foundStats = Object.keys(extracted).length;
console.log(`\n=== SUMMARY ===`);
console.log(`Stats found: ${foundStats}/${totalStats}`);
console.log(
  `Extraction rate: ${((foundStats / totalStats) * 100).toFixed(0)}%`
);
console.log(`OCR time: ${elapsed}s`);

if (issues.length > 0) {
  console.log(`\nIssues (${issues.length}):`);
  for (const issue of issues) {
    console.log(`  - ${issue}`);
  }
}

if (foundStats >= totalStats * 0.8) {
  console.log(
    `\n✅ DECISION: OCR is VIABLE — ${foundStats}/${totalStats} stats extracted`
  );
} else if (foundStats >= totalStats * 0.5) {
  console.log(
    `\n⚠️  DECISION: OCR is MARGINAL — ${foundStats}/${totalStats} stats extracted. May need preprocessing.`
  );
} else {
  console.log(
    `\n❌ DECISION: OCR is NOT VIABLE — only ${foundStats}/${totalStats} stats extracted. Defer to v2.`
  );
}

// Save raw output to fixture
const outputPath = join(
  import.meta.dir,
  "tests/fixtures/sample-ocr-output.txt"
);
await Bun.write(outputPath, result.data.text);
console.log(`\nRaw OCR output saved to: ${outputPath}`);

// Save extracted data as JSON for reference
const extractedPath = join(
  import.meta.dir,
  "tests/fixtures/sample-extracted-stats.json"
);
await Bun.write(extractedPath, JSON.stringify(extracted, null, 2));
console.log(`Extracted stats saved to: ${extractedPath}`);
