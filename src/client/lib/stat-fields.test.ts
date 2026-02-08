import { describe, expect, it } from "bun:test";
import { STAT_GROUPS } from "./stat-fields.ts";
import { statKeys } from "@/shared/schemas/stats.ts";

describe("STAT_GROUPS", () => {
  it("covers all StatKey values", () => {
    const groupKeys = STAT_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    const schemaKeys = [...statKeys.options];
    expect(groupKeys.sort()).toEqual(schemaKeys.sort());
  });

  it("has no duplicate keys", () => {
    const keys = STAT_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has non-empty labels for all groups", () => {
    for (const group of STAT_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
    }
  });

  it("has non-empty labels for all fields", () => {
    for (const group of STAT_GROUPS) {
      for (const field of group.fields) {
        expect(field.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("formatTime (via inMissionTimeSeconds field format)", () => {
  const field = STAT_GROUPS.flatMap((g) => g.fields).find(
    (f) => f.key === "inMissionTimeSeconds",
  );

  it("formats zero seconds", () => {
    expect(field?.format?.(0)).toBe("0h 0m 0s");
  });

  it("formats hours, minutes, seconds", () => {
    expect(field?.format?.(3661)).toBe("1h 1m 1s");
  });

  it("formats large values", () => {
    expect(field?.format?.(3935744)).toBe("1,093h 15m 44s");
  });
});
