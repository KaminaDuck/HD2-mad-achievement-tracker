import type { PlayerStats } from "@/shared/schemas/stats.ts";

interface ClanHeaderProps {
  stats: PlayerStats | null;
  earned: number;
  total: number;
}

export function ClanHeader({ stats, earned, total }: ClanHeaderProps) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h1 className="text-2xl font-bold text-yellow-500">
        808th Mad Bastards
      </h1>
      {stats ? (
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
          <span>
            Player: <span className="text-gray-200">{stats.playerName}</span>
          </span>
          <span>
            Achievements:{" "}
            <span className="text-gray-200">
              {earned}/{total}
            </span>
          </span>
          <span>
            Missions:{" "}
            <span className="text-gray-200">
              {stats.missionsPlayed.toLocaleString()}
            </span>
          </span>
          <span>
            Kills:{" "}
            <span className="text-gray-200">
              {stats.enemyKills.toLocaleString()}
            </span>
          </span>
        </div>
      ) : (
        <p className="mt-2 text-sm text-gray-500">
          No stats yet — upload your player card to get started.
        </p>
      )}
    </div>
  );
}
