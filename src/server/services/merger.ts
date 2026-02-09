import type { StatKey } from "@/shared/schemas/stats.ts";
import type { Confidence, ParseResult } from "@/shared/schemas/ocr.ts";
import { statKeys } from "@/shared/schemas/stats.ts";

const ALL_STAT_KEYS = statKeys.options as readonly StatKey[];

const CONFIDENCE_RANK: Record<Confidence, number> = {
  label: 2,
  position: 1,
};

/** Merge multiple ParseResult objects into one, preferring higher-confidence values.
 *  For same confidence level, the earlier result wins. */
export function mergeParseResults(results: ParseResult[]): ParseResult {
  if (results.length === 0) {
    return { stats: {}, confidence: {}, playerName: null };
  }

  if (results.length === 1) {
    return results[0]!;
  }

  const stats: Partial<Record<StatKey, number>> = {};
  const confidence: Partial<Record<StatKey, Confidence>> = {};

  for (const key of ALL_STAT_KEYS) {
    let bestRank = 0;

    for (const result of results) {
      const value = result.stats[key];
      const conf = result.confidence[key];

      if (value === undefined || conf === undefined) continue;

      const rank = CONFIDENCE_RANK[conf];
      if (rank > bestRank) {
        stats[key] = value;
        confidence[key] = conf;
        bestRank = rank;
      }
    }
  }

  // Player name: take from first result that has one
  let playerName: string | null = null;
  for (const result of results) {
    if (result.playerName) {
      playerName = result.playerName;
      break;
    }
  }

  return { stats, confidence, playerName };
}
