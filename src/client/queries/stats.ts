import { queryOptions } from "@tanstack/react-query";
import { client } from "../lib/api.ts";

export const statsQueries = {
  latest: () =>
    queryOptions({
      queryKey: ["stats", "latest"],
      queryFn: async () => {
        const res = await client.api.stats.latest.$get();
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      },
    }),

  all: () =>
    queryOptions({
      queryKey: ["stats"],
      queryFn: async () => {
        const res = await client.api.stats.$get();
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      },
    }),
};
