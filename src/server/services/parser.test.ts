import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractNumber,
  extractTime,
  parseOcrText,
  preprocessLine,
} from "./parser.ts";
import { mergeParseResults } from "./merger.ts";

const FIXTURES = join(import.meta.dir, "../../../tests/fixtures");

function loadFixture(name: string): string {
  return readFileSync(join(FIXTURES, name), "utf-8");
}

function loadJson(name: string): Record<string, number> {
  return JSON.parse(readFileSync(join(FIXTURES, name), "utf-8"));
}

// --- Unit tests ---

describe("preprocessLine", () => {
  it("strips trailing pipe", () => {
    expect(preprocessLine("TOTAL XP 5,073,982 al v3 |")).toBe(
      "TOTAL XP 5,073,982 al v3",
    );
  });

  it("strips character model noise before pipe", () => {
    expect(preprocessLine("2 Sa— | MELEE KILLS 37,014 oS")).toBe(
      "MELEE KILLS 37,014 oS",
    );
  });

  it("handles bracket instead of pipe", () => {
    expect(preprocessLine("[SHotsEReD 2,764,314 #4 #44")).toBe(
      "SHotsEReD 2,764,314 #4 #44",
    );
  });

  it("handles multiple pipes (takes after last)", () => {
    expect(preprocessLine("| 0 | | SUPPLY STRATS ~~ 13,547 al #7")).toBe(
      "SUPPLY STRATS ~~ 13,547 al #7",
    );
  });
});

describe("extractNumber", () => {
  it("parses comma-separated numbers", () => {
    expect(extractNumber("761,798 #l #22")).toBe(761798);
  });

  it("handles tilde noise", () => {
    expect(extractNumber("~~ 349,050 #2 #32")).toBe(349050);
  });

  it("handles numbers without commas", () => {
    expect(extractNumber("22351 #4 #33")).toBe(22351);
  });

  it("returns null for no number", () => {
    expect(extractNumber("no numbers here")).toBeNull();
  });
});

describe("extractTime", () => {
  it("parses short time", () => {
    expect(extractTime("0:06:02 #58 #912")).toBe(362);
  });

  it("parses long time", () => {
    expect(extractTime("1093:15:44 #2 wd?")).toBe(3935744);
  });

  it("returns null for no time", () => {
    expect(extractTime("12345 #1")).toBeNull();
  });
});

// --- Integration tests against real OCR fixtures ---

describe("parseOcrText — card 1 (THUPER)", () => {
  const ocrText = loadFixture("sample-ocr-output.txt");
  const expected = loadJson("sample-extracted-stats.json");
  const result = parseOcrText(ocrText);

  it("extracts all 21 stats", () => {
    expect(Object.keys(result.stats).length).toBe(21);
  });

  it("matches every expected value", () => {
    for (const [key, value] of Object.entries(expected)) {
      expect(result.stats[key as keyof typeof result.stats]).toBe(value);
    }
  });

  it("extracts player name", () => {
    expect(result.playerName).toBe("THUPER");
  });

  it("uses label confidence for most stats", () => {
    const labelCount = Object.values(result.confidence).filter(
      (c) => c === "label",
    ).length;
    expect(labelCount).toBeGreaterThanOrEqual(20);
  });
});

describe("parseOcrText — card 2 (GAMBLE)", () => {
  const ocrText = loadFixture("sample-ocr-output-2.txt");
  const expected = loadJson("sample-extracted-stats-2.json");
  const result = parseOcrText(ocrText);

  it("extracts all 21 stats", () => {
    expect(Object.keys(result.stats).length).toBe(21);
  });

  it("matches every expected value", () => {
    for (const [key, value] of Object.entries(expected)) {
      expect(result.stats[key as keyof typeof result.stats]).toBe(value);
    }
  });

  it("extracts player name", () => {
    expect(result.playerName).toBe("GAMBLE");
  });

  it("uses positional fallback for destroyed labels", () => {
    // Card 2 has SHOTS HIT label destroyed: "[ORY TY (She 2,190,546"
    expect(result.confidence.shotsHit).toBe("position");
  });
});

// --- Career page tests ---

describe("parseOcrText — career page 1", () => {
  const ocrText = loadFixture("career-page-ocr-1.txt");
  const result = parseOcrText(ocrText);

  it("extracts player name from career page header", () => {
    expect(result.playerName).toBe("Ducky");
  });

  it("extracts kill stats with label confidence", () => {
    expect(result.stats.enemyKills).toBe(94242);
    expect(result.confidence.enemyKills).toBe("label");
    expect(result.stats.terminidKills).toBe(39835);
    expect(result.stats.automatonKills).toBe(46049);
    expect(result.stats.illuminateKills).toBe(8358);
    expect(result.stats.friendlyKills).toBe(50);
    expect(result.stats.meleeKills).toBe(130);
    expect(result.stats.eagleKills).toBe(5285);
  });

  it("extracts shots and orbitals from career page", () => {
    expect(result.stats.shotsFired).toBe(440540);
    expect(result.stats.shotsHit).toBe(217187);
    expect(result.stats.orbitalsUsed).toBe(1763);
    expect(result.stats.defensiveStratagems).toBe(2244);
  });
});

describe("parseOcrText — career page 2", () => {
  const ocrText = loadFixture("career-page-ocr-2.txt");
  const result = parseOcrText(ocrText);

  it("extracts player name from career page header", () => {
    expect(result.playerName).toBe("Ducky");
  });

  it("captures reinforceStratagems (missing from player card)", () => {
    expect(result.stats.reinforceStratagems).toBe(2065);
    expect(result.confidence.reinforceStratagems).toBe("label");
  });

  it("captures totalStratagems (missing from player card)", () => {
    expect(result.stats.totalStratagems).toBe(9969);
    expect(result.confidence.totalStratagems).toBe("label");
  });

  it("extracts supply stratagems despite pipe noise in OCR line", () => {
    expect(result.stats.supplyStratagems).toBe(1007);
    expect(result.confidence.supplyStratagems).toBe("label");
  });

  it("extracts mission stats", () => {
    expect(result.stats.missionsPlayed).toBe(707);
    expect(result.stats.missionsWon).toBe(640);
    expect(result.stats.inMissionTimeSeconds).toBe(873381);
  });

  it("extracts objectives, samples, and XP", () => {
    expect(result.stats.objectivesCompleted).toBe(2000);
    expect(result.stats.samplesCollected).toBe(5024);
    expect(result.stats.totalXp).toBe(243367);
  });
});

describe("mergeParseResults — career page fixtures", () => {
  const text1 = loadFixture("career-page-ocr-1.txt");
  const text2 = loadFixture("career-page-ocr-2.txt");
  const r1 = parseOcrText(text1);
  const r2 = parseOcrText(text2);
  const expected = loadJson("career-page-expected-stats.json");

  it("merging both career pages captures all 22 expected stats", () => {
    const merged = mergeParseResults([r1, r2]);
    expect(Object.keys(merged.stats).length).toBeGreaterThanOrEqual(22);
  });

  it("matches expected values for key stats", () => {
    const merged = mergeParseResults([r1, r2]);
    for (const [key, value] of Object.entries(expected)) {
      expect(merged.stats[key as keyof typeof merged.stats]).toBe(value);
    }
  });

  it("merging player card + career pages captures all 23 stat keys", () => {
    const cardText = loadFixture("sample-ocr-output.txt");
    const cardResult = parseOcrText(cardText);
    const merged = mergeParseResults([cardResult, r1, r2]);
    expect(Object.keys(merged.stats).length).toBe(23);
    // Player card name takes priority
    expect(merged.playerName).toBe("THUPER");
    // Career-page-only stats are present
    expect(merged.stats.reinforceStratagems).toBe(2065);
    expect(merged.stats.totalStratagems).toBe(9969);
  });
});
