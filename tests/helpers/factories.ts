import type { CreatePlayerStats } from "@/shared/schemas/stats.ts";

export function buildCreatePlayerStats(
  overrides?: Partial<CreatePlayerStats>,
): CreatePlayerStats {
  return {
    playerName: "TestPlayer",
    enemyKills: 0,
    terminidKills: 0,
    automatonKills: 0,
    illuminateKills: 0,
    friendlyKills: 0,
    grenadeKills: 0,
    meleeKills: 0,
    eagleKills: 0,
    missionsPlayed: 0,
    missionsWon: 0,
    inMissionTimeSeconds: 0,
    shotsFired: 0,
    shotsHit: 0,
    orbitalsUsed: 0,
    eagleStratagems: 0,
    supplyStratagems: 0,
    defensiveStratagems: 0,
    reinforceStratagems: 0,
    totalStratagems: 0,
    deaths: 0,
    objectivesCompleted: 0,
    samplesCollected: 0,
    totalXp: 0,
    ...overrides,
  };
}
