import type { PlayerStats, StatKey } from "@/shared/schemas/stats.ts";

interface StatsDisplayProps {
  stats: PlayerStats;
}

interface StatGroup {
  label: string;
  fields: { key: StatKey; label: string; format?: (v: number) => string }[];
}

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toLocaleString()}h ${m}m ${s}s`;
}

const STAT_GROUPS: StatGroup[] = [
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

export function StatsDisplay({ stats }: StatsDisplayProps) {
  return (
    <div className="space-y-6">
      {STAT_GROUPS.map((group) => (
        <section key={group.label}>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {group.label}
          </h3>
          <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
            {group.fields.map((field) => {
              const value = stats[field.key] as number;
              return (
                <div key={field.key} className="flex justify-between py-1 text-sm">
                  <span className="text-gray-400">{field.label}</span>
                  <span className="font-mono text-gray-200">
                    {field.format ? field.format(value) : value.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
