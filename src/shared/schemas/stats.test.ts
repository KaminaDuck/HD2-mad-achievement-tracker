import { describe, expect, it } from "bun:test";
import {
  createPlayerStatsSchema,
  playerStatsSchema,
  statKeys,
} from "./stats.ts";
import { buildCreatePlayerStats } from "../../../tests/helpers/factories.ts";

describe("playerStatsSchema", () => {
  it("accepts a valid full PlayerStats object", () => {
    const input = {
      id: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
      ...buildCreatePlayerStats({ enemyKills: 100, totalXp: 5000 }),
    };
    const result = playerStatsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("rejects non-UUID id", () => {
    const input = {
      id: "abc",
      recordedAt: new Date().toISOString(),
      ...buildCreatePlayerStats(),
    };
    const result = playerStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-datetime recordedAt", () => {
    const input = {
      id: crypto.randomUUID(),
      recordedAt: "yesterday",
      ...buildCreatePlayerStats(),
    };
    const result = playerStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects negative stat values", () => {
    const input = {
      id: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
      ...buildCreatePlayerStats({ enemyKills: -1 }),
    };
    const result = playerStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects non-integer stat values", () => {
    const input = {
      id: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
      ...buildCreatePlayerStats({ enemyKills: 1.5 }),
    };
    const result = playerStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = playerStatsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("createPlayerStatsSchema", () => {
  it("accepts valid data without id and recordedAt", () => {
    const input = buildCreatePlayerStats({ playerName: "Valid", enemyKills: 42 });
    const result = createPlayerStatsSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it("strips id and recordedAt from output", () => {
    const input = {
      id: crypto.randomUUID(),
      recordedAt: new Date().toISOString(),
      ...buildCreatePlayerStats(),
    };
    const result = createPlayerStatsSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect("id" in result.data).toBe(false);
      expect("recordedAt" in result.data).toBe(false);
    }
  });

  it("rejects empty playerName", () => {
    const input = buildCreatePlayerStats({ playerName: "" });
    const result = createPlayerStatsSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("statKeys", () => {
  it("enumerates exactly 23 stat keys", () => {
    expect(statKeys.options).toHaveLength(23);
  });

  it("includes known keys", () => {
    const keys = statKeys.options;
    expect(keys).toContain("enemyKills");
    expect(keys).toContain("totalXp");
    expect(keys).toContain("inMissionTimeSeconds");
  });

  it("excludes id, playerName, recordedAt", () => {
    const keys = statKeys.options as readonly string[];
    expect(keys).not.toContain("id");
    expect(keys).not.toContain("playerName");
    expect(keys).not.toContain("recordedAt");
  });
});
