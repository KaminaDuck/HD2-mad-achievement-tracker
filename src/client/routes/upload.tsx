import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ImageUploader } from "../components/ImageUploader.tsx";
import { OcrReview } from "../components/OcrReview.tsx";
import { PlayerStatsForm } from "../components/PlayerStatsForm.tsx";
import { useUploadImage } from "../mutations/upload.ts";
import { useCreateStats } from "../mutations/stats.ts";
import type { StatKey } from "@/shared/schemas/stats.ts";
import type { Confidence } from "@/server/services/parser.ts";

type Step =
  | { kind: "upload" }
  | { kind: "manual" }
  | {
      kind: "review";
      stats: Partial<Record<StatKey, number>>;
      confidence: Partial<Record<StatKey, Confidence>>;
      playerName: string | null;
    };

export const Route = createFileRoute("/upload")({
  component: UploadPage,
});

function UploadPage() {
  const [step, setStep] = useState<Step>({ kind: "upload" });
  const navigate = useNavigate();
  const uploadMutation = useUploadImage();
  const saveMutation = useCreateStats();

  const handleUpload = (file: File) => {
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        setStep({
          kind: "review",
          stats: data.stats,
          confidence: data.confidence,
          playerName: data.playerName,
        });
      },
    });
  };

  const handleSave = (data: Parameters<typeof saveMutation.mutate>[0]) => {
    saveMutation.mutate(data, {
      onSuccess: () => navigate({ to: "/" }),
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-100">Upload Player Card</h1>

      {step.kind === "upload" && (
        <>
          <ImageUploader
            onUpload={handleUpload}
            isPending={uploadMutation.isPending}
            error={uploadMutation.error?.message}
          />
          <div className="text-center">
            <span className="text-sm text-gray-500">or</span>
          </div>
          <button
            type="button"
            onClick={() => setStep({ kind: "manual" })}
            className="w-full rounded-md border border-gray-700 px-6 py-2 text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100"
          >
            Enter stats manually
          </button>
        </>
      )}

      {step.kind === "review" && (
        <OcrReview
          stats={step.stats}
          confidence={step.confidence}
          playerName={step.playerName}
          onSubmit={handleSave}
          isPending={saveMutation.isPending}
          error={saveMutation.error?.message}
        />
      )}

      {step.kind === "manual" && (
        <PlayerStatsForm
          onSubmit={handleSave}
          isPending={saveMutation.isPending}
          error={saveMutation.error?.message}
        />
      )}

      {step.kind !== "upload" && (
        <button
          type="button"
          onClick={() => {
            uploadMutation.reset();
            saveMutation.reset();
            setStep({ kind: "upload" });
          }}
          className="text-sm text-gray-500 hover:text-gray-300"
        >
          Start over
        </button>
      )}
    </div>
  );
}
