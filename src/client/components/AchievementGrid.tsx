import type { Achievement, AchievementCategory, AchievementProgress } from "@/shared/schemas/achievements.ts";
import { AchievementCard } from "./AchievementCard.tsx";

interface AchievementGridProps {
  achievements: Achievement[];
  progress: AchievementProgress[];
}

const CATEGORY_LABELS: Record<AchievementCategory, string> = {
  kills: "Kills",
  missions: "Missions",
  stratagems: "Stratagems",
  accuracy: "Accuracy",
  survival: "Survival",
  misc: "Misc",
};

const CATEGORY_ORDER: AchievementCategory[] = [
  "kills",
  "missions",
  "stratagems",
  "accuracy",
  "survival",
  "misc",
];

export function AchievementGrid({ achievements, progress }: AchievementGridProps) {
  const progressMap = new Map(progress.map((p) => [p.achievementId, p]));

  const grouped = new Map<AchievementCategory, Achievement[]>();
  for (const a of achievements) {
    const list = grouped.get(a.category) ?? [];
    list.push(a);
    grouped.set(a.category, list);
  }

  return (
    <div className="space-y-8">
      {CATEGORY_ORDER.filter((cat) => grouped.has(cat)).map((category) => (
        <section key={category}>
          <h2 className="mb-3 text-lg font-semibold text-gray-300">
            {CATEGORY_LABELS[category]}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {grouped.get(category)!.map((achievement) => {
              const prog = progressMap.get(achievement.id);
              if (!prog) return null;
              return (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  progress={prog}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
