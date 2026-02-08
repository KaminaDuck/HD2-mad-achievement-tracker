import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";
import { HTTPException } from "hono/http-exception";
import { createDb } from "./services/db.ts";
import { health } from "./routes/health.ts";
import { createStatsRoutes } from "./routes/stats.ts";
import { createAchievementRoutes } from "./routes/achievements.ts";
import { upload } from "./routes/upload.ts";

const db = createDb();

const app = new Hono()
  .use(logger())
  .route("/health", health)
  .route("/api/stats", createStatsRoutes(db))
  .route("/api/achievements", createAchievementRoutes(db))
  .route("/api/upload", upload);

// Serve static frontend in production
app.use("/*", serveStatic({ root: "./dist/client" }));
app.use("/*", serveStatic({ path: "./dist/client/index.html" }));

app.onError((err, c) => {
  console.error(err);
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  return c.json({ error: "Internal server error" }, 500);
});

export type AppType = typeof app;
export default app;
