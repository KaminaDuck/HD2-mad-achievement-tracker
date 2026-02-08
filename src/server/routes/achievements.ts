import { Hono } from "hono";
import { z } from "zod";
import type { Database } from "bun:sqlite";
import {
  achievementSchema,
  type Achievement,
  type AchievementProgress,
} from "@/shared/schemas/achievements.ts";
import type { PlayerStats, StatKey } from "@/shared/schemas/stats.ts";
import { getLatestStats } from "../services/db.ts";

function loadAchievements(): Achievement[] {
  const raw = JSON.parse(
    require("fs").readFileSync("data/achievements.json", "utf-8"),
  );
  const parsed = z.array(achievementSchema).parse(raw);
  return parsed;
}

let cachedAchievements: Achievement[] | null = null;

function getAchievements(): Achievement[] {
  if (!cachedAchievements) {
    cachedAchievements = loadAchievements();
  }
  return cachedAchievements;
}

function computeProgress(
  achievements: Achievement[],
  stats: PlayerStats | null,
): AchievementProgress[] {
  return achievements.map((a) => {
    const currentValue = stats ? (stats[a.statKey as StatKey] as number) : 0;
    const percent = Math.min(
      100,
      Math.round((currentValue / a.threshold) * 100),
    );
    return {
      achievementId: a.id,
      name: a.name,
      currentValue,
      threshold: a.threshold,
      percent,
      earned: currentValue >= a.threshold,
    };
  });
}

export function createAchievementRoutes(db: Database) {
  // Validate achievements.json at startup
  const achievements = getAchievements();
  console.log(`Loaded ${achievements.length} achievements from data/achievements.json`);

  return new Hono().get("/", (c) => {
    const stats = getLatestStats(db);
    const progress = computeProgress(achievements, stats);
    return c.json({ achievements, progress });
  });
}
