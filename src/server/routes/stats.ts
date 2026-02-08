import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import type { Database } from "bun:sqlite";
import { createPlayerStatsSchema } from "@/shared/schemas/stats.ts";
import { getAllStats, getLatestStats, insertStats } from "../services/db.ts";

export function createStatsRoutes(db: Database) {
  return new Hono()
    .get("/latest", (c) => {
      const stats = getLatestStats(db);
      if (!stats) {
        return c.json({ error: "No stats recorded yet" }, 404);
      }
      return c.json(stats);
    })
    .get("/", (c) => {
      return c.json(getAllStats(db));
    })
    .post(
      "/",
      zValidator("json", createPlayerStatsSchema, (result, c) => {
        if (!result.success) {
          return c.json(
            { error: "Validation failed", detail: result.error.message },
            400,
          );
        }
      }),
      (c) => {
        const data = c.req.valid("json");
        const saved = insertStats(db, data);
        return c.json(saved, 201);
      },
    );
}
