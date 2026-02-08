import { z } from "zod";
import { statKeys } from "./stats.ts";

const achievementCategorySchema = z.enum([
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

export interface AchievementProgress {
  achievementId: string;
  name: string;
  currentValue: number;
  threshold: number;
  percent: number;
  earned: boolean;
}
