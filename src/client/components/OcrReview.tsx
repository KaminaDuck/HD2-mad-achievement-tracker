import type { CreatePlayerStats, StatKey } from "@/shared/schemas/stats.ts";
import type { Confidence } from "@/shared/schemas/ocr.ts";
import { PlayerStatsForm } from "./PlayerStatsForm.tsx";

interface OcrReviewProps {
  stats: Partial<Record<StatKey, number>>;
  confidence: Partial<Record<StatKey, Confidence>>;
  playerName: string | null;
  onSubmit: (data: CreatePlayerStats) => void;
  isPending: boolean;
  error?: string | null;
}

export function OcrReview({
  stats,
  confidence,
  playerName,
  onSubmit,
  isPending,
  error,
}: OcrReviewProps) {
  const labelCount = Object.values(confidence).filter((c) => c === "label").length;
  const positionCount = Object.values(confidence).filter((c) => c === "position").length;
  const totalParsed = labelCount + positionCount;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <h3 className="font-semibold text-gray-200">OCR Results</h3>
        <p className="mt-1 text-sm text-gray-400">
          Extracted {totalParsed} stat{totalParsed !== 1 && "s"} —{" "}
          {labelCount} high confidence, {positionCount} low confidence.
          Review and correct any values before saving.
        </p>
      </div>

      <PlayerStatsForm
        defaultStats={stats}
        defaultPlayerName={playerName}
        confidence={confidence}
        onSubmit={onSubmit}
        isPending={isPending}
        error={error}
      />
    </div>
  );
}
