import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreatePlayerStats } from "@/shared/schemas/stats.ts";
import { client } from "../lib/api.ts";

export function useCreateStats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePlayerStats) => {
      const res = await client.api.stats.$post({ json: data });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(
          "error" in body ? body.error : "Failed to save stats",
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
    },
  });
}
