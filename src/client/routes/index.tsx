import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { statsQueries } from "../queries/stats.ts";
import { achievementQueries } from "../queries/achievements.ts";
import { ClanHeader } from "../components/ClanHeader.tsx";
import { AchievementGrid } from "../components/AchievementGrid.tsx";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(statsQueries.latest()),
      queryClient.ensureQueryData(achievementQueries.all()),
    ]),
  component: HomePage,
});

function HomePage() {
  const stats = useSuspenseQuery(statsQueries.latest());
  const achievements = useSuspenseQuery(achievementQueries.all());

  const earned =
    achievements.data?.progress.filter((p) => p.earned).length ?? 0;
  const total = achievements.data?.progress.length ?? 0;

  return (
    <div className="space-y-6">
      <ClanHeader stats={stats.data} earned={earned} total={total} />

      {stats.data ? (
        <AchievementGrid
          achievements={achievements.data.achievements}
          progress={achievements.data.progress}
        />
      ) : (
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-300">
            No stats yet
          </h2>
          <p className="mt-2 text-gray-500">
            Upload your player card or enter stats manually to start tracking
            achievements.
          </p>
          <Link
            to="/upload"
            className="mt-4 inline-block rounded-md bg-yellow-600 px-6 py-2 font-medium text-gray-950 transition-colors hover:bg-yellow-500"
          >
            Get Started
          </Link>
        </div>
      )}
    </div>
  );
}
