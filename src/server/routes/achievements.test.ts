import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { createDb, insertStats } from "../services/db.ts";
import { createAchievementRoutes } from "./achievements.ts";
import { buildCreatePlayerStats } from "../../../tests/helpers/factories.ts";

function createApp() {
  const db = createDb(":memory:");
  const app = new Hono().route("/api/achievements", createAchievementRoutes(db));
  return { app, db };
}

describe("GET /api/achievements", () => {
  it("returns 200 with achievements array and progress array", async () => {
    const { app } = createApp();
    const res = await app.request("/api/achievements");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.achievements)).toBe(true);
    expect(Array.isArray(body.progress)).toBe(true);
    expect(body.achievements.length).toBeGreaterThan(0);
    expect(body.progress.length).toBe(body.achievements.length);
  });

  it("returns progress with all percent=0 when no stats exist", async () => {
    const { app } = createApp();
    const res = await app.request("/api/achievements");
    const body = await res.json();
    for (const p of body.progress) {
      expect(p.percent).toBe(0);
      expect(p.earned).toBe(false);
      expect(p.currentValue).toBe(0);
    }
  });

  it("returns correct progress after inserting stats", async () => {
    const { app, db } = createApp();
    insertStats(
      db,
      buildCreatePlayerStats({ orbitalsUsed: 2500 }),
    );

    const res = await app.request("/api/achievements");
    const body = await res.json();
    const deathFromAbove = body.progress.find(
      (p: { achievementId: string }) => p.achievementId === "death-from-above",
    );
    expect(deathFromAbove).toBeDefined();
    expect(deathFromAbove.currentValue).toBe(2500);
    expect(deathFromAbove.threshold).toBe(5000);
    expect(deathFromAbove.percent).toBe(50);
    expect(deathFromAbove.earned).toBe(false);
  });
});

describe("computeProgress edge cases (via route)", () => {
  it("caps percent at 100 when stat exceeds threshold", async () => {
    const { app, db } = createApp();
    insertStats(
      db,
      buildCreatePlayerStats({ orbitalsUsed: 10000 }),
    );

    const res = await app.request("/api/achievements");
    const body = await res.json();
    const deathFromAbove = body.progress.find(
      (p: { achievementId: string }) => p.achievementId === "death-from-above",
    );
    expect(deathFromAbove.percent).toBe(100);
    expect(deathFromAbove.earned).toBe(true);
  });

  it("marks earned=true at exact threshold", async () => {
    const { app, db } = createApp();
    insertStats(
      db,
      buildCreatePlayerStats({ orbitalsUsed: 5000 }),
    );

    const res = await app.request("/api/achievements");
    const body = await res.json();
    const deathFromAbove = body.progress.find(
      (p: { achievementId: string }) => p.achievementId === "death-from-above",
    );
    expect(deathFromAbove.percent).toBe(100);
    expect(deathFromAbove.earned).toBe(true);
  });

  it("marks earned=false below threshold", async () => {
    const { app, db } = createApp();
    // Use a value far enough below threshold that Math.round won't round up to 100
    insertStats(
      db,
      buildCreatePlayerStats({ orbitalsUsed: 2500 }),
    );

    const res = await app.request("/api/achievements");
    const body = await res.json();
    const deathFromAbove = body.progress.find(
      (p: { achievementId: string }) => p.achievementId === "death-from-above",
    );
    expect(deathFromAbove.percent).toBe(50);
    expect(deathFromAbove.earned).toBe(false);
  });
});
