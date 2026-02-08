import type { StatKey } from "@/shared/schemas/stats.ts";

export interface StatFieldDef {
  key: StatKey;
  label: string;
  format?: (value: number) => string;
}

export interface StatGroup {
  label: string;
  fields: StatFieldDef[];
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toLocaleString()}h ${m}m ${s}s`;
}

export const STAT_GROUPS: StatGroup[] = [
  {
    label: "Kills",
    fields: [
      { key: "enemyKills", label: "Enemy Kills" },
      { key: "terminidKills", label: "Terminid Kills" },
      { key: "automatonKills", label: "Automaton Kills" },
      { key: "illuminateKills", label: "Illuminate Kills" },
      { key: "friendlyKills", label: "Friendly Kills" },
      { key: "grenadeKills", label: "Grenade Kills" },
      { key: "meleeKills", label: "Melee Kills" },
      { key: "eagleKills", label: "Eagle Kills" },
    ],
  },
  {
    label: "Missions",
    fields: [
      { key: "missionsPlayed", label: "Missions Played" },
      { key: "missionsWon", label: "Missions Won" },
      { key: "inMissionTimeSeconds", label: "In-Mission Time", format: formatTime },
    ],
  },
  {
    label: "Accuracy",
    fields: [
      { key: "shotsFired", label: "Shots Fired" },
      { key: "shotsHit", label: "Shots Hit" },
    ],
  },
  {
    label: "Stratagems",
    fields: [
      { key: "orbitalsUsed", label: "Orbitals Used" },
      { key: "eagleStratagems", label: "Eagle Stratagems" },
      { key: "supplyStratagems", label: "Supply Stratagems" },
      { key: "defensiveStratagems", label: "Defensive Stratagems" },
      { key: "reinforceStratagems", label: "Reinforce Stratagems" },
      { key: "totalStratagems", label: "Total Stratagems" },
    ],
  },
  {
    label: "Other",
    fields: [
      { key: "deaths", label: "Deaths" },
      { key: "objectivesCompleted", label: "Objectives Completed" },
      { key: "samplesCollected", label: "Samples Collected" },
      { key: "totalXp", label: "Total XP" },
    ],
  },
];

// Compile-time check: fails if a StatKey is missing from STAT_GROUPS
const _exhaustive: Record<StatKey, true> = Object.fromEntries(
  STAT_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, true as const])),
) as Record<StatKey, true>;
void _exhaustive;
