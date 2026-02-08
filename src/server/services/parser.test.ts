import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractNumber,
  extractTime,
  parseOcrText,
  preprocessLine,
} from "./parser.ts";

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
