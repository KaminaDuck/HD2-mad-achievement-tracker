import { queryOptions } from "@tanstack/react-query";
import { client } from "../lib/api.ts";

export const achievementQueries = {
  all: () =>
    queryOptions({
      queryKey: ["achievements"],
      queryFn: async () => {
        const res = await client.api.achievements.$get();
        if (!res.ok) throw new Error("Failed to fetch achievements");
        return res.json();
      },
    }),
};
