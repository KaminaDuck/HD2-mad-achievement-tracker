import { describe, expect, it } from "bun:test";
import { achievementSchema } from "./achievements.ts";

describe("achievementSchema", () => {
  it("accepts a valid achievement", () => {
    const result = achievementSchema.safeParse({
      id: "death-from-above",
      name: "Death From Above",
      description: "Use 5,000 Orbital Stratagems",
      category: "stratagems",
      statKey: "orbitalsUsed",
      threshold: 5000,
      icon: "deathfromabove",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid statKey", () => {
    const result = achievementSchema.safeParse({
      id: "test",
      name: "Test",
      description: "desc",
      category: "kills",
      statKey: "notARealStat",
      threshold: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid category", () => {
    const result = achievementSchema.safeParse({
      id: "test",
      name: "Test",
      description: "desc",
      category: "banana",
      statKey: "enemyKills",
      threshold: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = achievementSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects non-positive threshold", () => {
    const base = {
      id: "test",
      name: "Test",
      description: "desc",
      category: "kills",
      statKey: "enemyKills",
    };
    expect(achievementSchema.safeParse({ ...base, threshold: 0 }).success).toBe(false);
    expect(achievementSchema.safeParse({ ...base, threshold: -1 }).success).toBe(false);
  });

  it("accepts optional icon field", () => {
    const withIcon = achievementSchema.safeParse({
      id: "test",
      name: "Test",
      description: "desc",
      category: "kills",
      statKey: "enemyKills",
      threshold: 100,
      icon: "test-icon",
    });
    const withoutIcon = achievementSchema.safeParse({
      id: "test",
      name: "Test",
      description: "desc",
      category: "kills",
      statKey: "enemyKills",
      threshold: 100,
    });
    expect(withIcon.success).toBe(true);
    expect(withoutIcon.success).toBe(true);
  });
});
