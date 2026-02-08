import { z } from "zod";

const stat = z.number().int().nonnegative();

export const playerStatsSchema = z.object({
  id: z.string().uuid(),
  playerName: z.string().min(1),
  recordedAt: z.string().datetime(),

  // Kills
  enemyKills: stat,
  terminidKills: stat,
  automatonKills: stat,
  illuminateKills: stat,
  friendlyKills: stat,
  grenadeKills: stat,
  meleeKills: stat,
  eagleKills: stat,

  // Missions
  missionsPlayed: stat,
  missionsWon: stat,

  // Time (HH:MM:SS converted to seconds before storage)
  inMissionTimeSeconds: stat,

  // Accuracy
  shotsFired: stat,
  shotsHit: stat,

  // Stratagems
  orbitalsUsed: stat,
  eagleStratagems: stat,
  supplyStratagems: stat,
  defensiveStratagems: stat,
  reinforceStratagems: stat,
  totalStratagems: stat,

  // Other
  deaths: stat,
  objectivesCompleted: stat,
  samplesCollected: stat,
  totalXp: stat,
});

export type PlayerStats = z.infer<typeof playerStatsSchema>;

export const createPlayerStatsSchema = playerStatsSchema.omit({
  id: true,
  recordedAt: true,
});

export type CreatePlayerStats = z.infer<typeof createPlayerStatsSchema>;

/** All numeric stat keys (excludes id, playerName, recordedAt) */
export const statKeys = playerStatsSchema
  .omit({ id: true, playerName: true, recordedAt: true })
  .keyof();

export type StatKey = z.infer<typeof statKeys>;
