import { useMutation } from "@tanstack/react-query";
import type { StatKey } from "@/shared/schemas/stats.ts";
import type { Confidence } from "@/shared/schemas/ocr.ts";

interface UploadResult {
  stats: Partial<Record<StatKey, number>>;
  confidence: Partial<Record<StatKey, Confidence>>;
  playerName: string | null;
  rawText: string;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadResult> => {
      const formData = new FormData();
      for (const file of files) {
        formData.append("file", file);
      }
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(
          body.error ?? "Upload failed",
        );
      }
      return res.json();
    },
  });
}
