import { z } from "zod";
import { statKeys } from "./stats.ts";

export const achievementCategorySchema = z.enum([
  "kills",
  "missions",
  "stratagems",
  "accuracy",
  "survival",
  "misc",
]);

export type AchievementCategory = z.infer<typeof achievementCategorySchema>;

export const achievementSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string(),
  category: achievementCategorySchema,
  statKey: statKeys,
  threshold: z.number().int().positive(),
  icon: z.string().optional(),
});

export type Achievement = z.infer<typeof achievementSchema>;

export const achievementProgressSchema = z.object({
  achievementId: z.string(),
  name: z.string(),
  currentValue: z.number().int().nonnegative(),
  threshold: z.number().int().positive(),
  percent: z.number().min(0).max(100),
  earned: z.boolean(),
});

export type AchievementProgress = z.infer<typeof achievementProgressSchema>;
