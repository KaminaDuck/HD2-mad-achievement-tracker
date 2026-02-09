import { describe, expect, it } from "bun:test";
import type { ParseResult } from "@/shared/schemas/ocr.ts";
import { mergeParseResults } from "./merger.ts";

describe("mergeParseResults", () => {
  it("returns empty result for empty array", () => {
    const result = mergeParseResults([]);
    expect(result.stats).toEqual({});
    expect(result.confidence).toEqual({});
    expect(result.playerName).toBeNull();
  });

  it("returns single result unchanged", () => {
    const single: ParseResult = {
      stats: { enemyKills: 100, deaths: 5 },
      confidence: { enemyKills: "label", deaths: "position" },
      playerName: "THUPER",
    };
    const result = mergeParseResults([single]);
    expect(result).toBe(single);
  });

  it("label confidence wins over position for same stat", () => {
    const a: ParseResult = {
      stats: { enemyKills: 100 },
      confidence: { enemyKills: "position" },
      playerName: null,
    };
    const b: ParseResult = {
      stats: { enemyKills: 200 },
      confidence: { enemyKills: "label" },
      playerName: null,
    };
    const result = mergeParseResults([a, b]);
    expect(result.stats.enemyKills).toBe(200);
    expect(result.confidence.enemyKills).toBe("label");
  });

  it("earlier result wins at same confidence level", () => {
    const a: ParseResult = {
      stats: { shotsFired: 1000 },
      confidence: { shotsFired: "label" },
      playerName: null,
    };
    const b: ParseResult = {
      stats: { shotsFired: 2000 },
      confidence: { shotsFired: "label" },
      playerName: null,
    };
    const result = mergeParseResults([a, b]);
    expect(result.stats.shotsFired).toBe(1000);
  });

  it("combines stats from different images with no overlap", () => {
    const a: ParseResult = {
      stats: { enemyKills: 100, deaths: 5 },
      confidence: { enemyKills: "label", deaths: "label" },
      playerName: null,
    };
    const b: ParseResult = {
      stats: { reinforceStratagems: 50, totalStratagems: 200 },
      confidence: { reinforceStratagems: "label", totalStratagems: "label" },
      playerName: null,
    };
    const result = mergeParseResults([a, b]);
    expect(result.stats.enemyKills).toBe(100);
    expect(result.stats.deaths).toBe(5);
    expect(result.stats.reinforceStratagems).toBe(50);
    expect(result.stats.totalStratagems).toBe(200);
  });

  it("uses player name from first image when both have names", () => {
    const a: ParseResult = {
      stats: {},
      confidence: {},
      playerName: "THUPER",
    };
    const b: ParseResult = {
      stats: {},
      confidence: {},
      playerName: "Ducky",
    };
    const result = mergeParseResults([a, b]);
    expect(result.playerName).toBe("THUPER");
  });

  it("uses player name from second image when first is null", () => {
    const a: ParseResult = {
      stats: {},
      confidence: {},
      playerName: null,
    };
    const b: ParseResult = {
      stats: {},
      confidence: {},
      playerName: "Ducky",
    };
    const result = mergeParseResults([a, b]);
    expect(result.playerName).toBe("Ducky");
  });

  it("merges three results with mixed confidence levels", () => {
    const a: ParseResult = {
      stats: { enemyKills: 100, shotsFired: 500 },
      confidence: { enemyKills: "position", shotsFired: "label" },
      playerName: "THUPER",
    };
    const b: ParseResult = {
      stats: { enemyKills: 200, reinforceStratagems: 50 },
      confidence: { enemyKills: "label", reinforceStratagems: "label" },
      playerName: null,
    };
    const c: ParseResult = {
      stats: { enemyKills: 300, totalStratagems: 999 },
      confidence: { enemyKills: "label", totalStratagems: "position" },
      playerName: "Ducky",
    };
    const result = mergeParseResults([a, b, c]);
    // enemyKills: b wins (first label match)
    expect(result.stats.enemyKills).toBe(200);
    expect(result.confidence.enemyKills).toBe("label");
    // shotsFired: only in a
    expect(result.stats.shotsFired).toBe(500);
    // reinforceStratagems: only in b
    expect(result.stats.reinforceStratagems).toBe(50);
    // totalStratagems: only in c
    expect(result.stats.totalStratagems).toBe(999);
    // playerName: first non-null (a)
    expect(result.playerName).toBe("THUPER");
  });
});
