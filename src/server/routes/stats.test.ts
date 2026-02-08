import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { createDb, insertStats } from "../services/db.ts";
import { createStatsRoutes } from "./stats.ts";
import { buildCreatePlayerStats } from "../../../tests/helpers/factories.ts";

function createApp() {
  const db = createDb(":memory:");
  const app = new Hono().route("/api/stats", createStatsRoutes(db));
  return { app, db };
}

describe("GET /api/stats/latest", () => {
  it("returns 404 with error message when no stats exist", async () => {
    const { app } = createApp();
    const res = await app.request("/api/stats/latest");
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 200 with PlayerStats after insert", async () => {
    const { app, db } = createApp();
    insertStats(db, buildCreatePlayerStats({ playerName: "HERO", enemyKills: 99 }));

    const res = await app.request("/api/stats/latest");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.playerName).toBe("HERO");
    expect(body.enemyKills).toBe(99);
    expect(body.id).toBeDefined();
    expect(body.recordedAt).toBeDefined();
  });
});

describe("GET /api/stats", () => {
  it("returns empty array when no stats exist", async () => {
    const { app } = createApp();
    const res = await app.request("/api/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns array of stats in descending order", async () => {
    const { app, db } = createApp();
    insertStats(db, buildCreatePlayerStats({ playerName: "A", enemyKills: 1 }));
    insertStats(db, buildCreatePlayerStats({ playerName: "B", enemyKills: 2 }));

    const res = await app.request("/api/stats");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(2);
    expect(body[0].playerName).toBe("B");
    expect(body[1].playerName).toBe("A");
  });
});

describe("POST /api/stats", () => {
  it("returns 201 with saved stats for valid body", async () => {
    const { app } = createApp();
    const input = buildCreatePlayerStats({ playerName: "NEW", totalXp: 5000 });
    const res = await app.request("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.playerName).toBe("NEW");
    expect(body.totalXp).toBe(5000);
    expect(body.id).toBeDefined();
    expect(body.recordedAt).toBeDefined();
  });

  it("returns 400 for empty body", async () => {
    const { app } = createApp();
    const res = await app.request("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid playerName (empty string)", async () => {
    const { app } = createApp();
    const input = buildCreatePlayerStats({ playerName: "" });
    const res = await app.request("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for negative stat value", async () => {
    const { app } = createApp();
    const input = buildCreatePlayerStats({ enemyKills: -1 });
    const res = await app.request("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(res.status).toBe(400);
  });
});
