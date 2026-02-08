import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { achievementQueries } from "../queries/achievements.ts";
import { AchievementGrid } from "../components/AchievementGrid.tsx";

export const Route = createFileRoute("/achievements")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(achievementQueries.all()),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { data } = useSuspenseQuery(achievementQueries.all());

  const earned = data.progress.filter((p) => p.earned).length;
  const total = data.progress.length;

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-gray-100">Achievements</h1>
        <span className="text-sm text-gray-400">
          {earned}/{total} earned
        </span>
      </div>

      <AchievementGrid
        achievements={data.achievements}
        progress={data.progress}
      />
    </div>
  );
}
