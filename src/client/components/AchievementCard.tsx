import type { Achievement, AchievementProgress } from "@/shared/schemas/achievements.ts";
import { ProgressBar } from "./ProgressBar.tsx";

interface AchievementCardProps {
  achievement: Achievement;
  progress: AchievementProgress;
}

export function AchievementCard({ achievement, progress }: AchievementCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 ${
        progress.earned
          ? "border-yellow-500/30 bg-yellow-500/5"
          : "border-gray-800 bg-gray-900"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={`font-semibold ${progress.earned ? "text-yellow-500" : "text-gray-200"}`}
        >
          {achievement.name}
        </h3>
        {progress.earned && (
          <span className="shrink-0 text-xs font-medium text-yellow-500">
            EARNED
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-gray-500">{achievement.description}</p>
      <div className="mt-3">
        <ProgressBar percent={progress.percent} earned={progress.earned} />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>{progress.currentValue.toLocaleString()}</span>
          <span>
            {progress.threshold.toLocaleString()} ({progress.percent}%)
          </span>
        </div>
      </div>
    </div>
  );
}
