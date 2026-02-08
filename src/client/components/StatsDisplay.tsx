import type { PlayerStats } from "@/shared/schemas/stats.ts";
import { STAT_GROUPS } from "../lib/stat-fields.ts";

interface StatsDisplayProps {
  stats: PlayerStats;
}

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
              const value = stats[field.key];
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
