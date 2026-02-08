import type { StatKey } from "./stats.ts";

export type Confidence = "label" | "position";

export interface ParseResult {
  stats: Partial<Record<StatKey, number>>;
  confidence: Partial<Record<StatKey, Confidence>>;
  playerName: string | null;
}
