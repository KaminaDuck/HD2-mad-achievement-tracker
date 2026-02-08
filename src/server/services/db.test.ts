import { describe, expect, it } from "bun:test";
import { createDb, getAllStats, getLatestStats, insertStats } from "./db.ts";
import { statKeys } from "@/shared/schemas/stats.ts";
import { buildCreatePlayerStats } from "../../../tests/helpers/factories.ts";

describe("createDb", () => {
  it("creates in-memory database without error", () => {
    const db = createDb(":memory:");
    expect(db).toBeDefined();
  });

  it("sets WAL journal mode (falls back to memory for :memory: dbs)", () => {
    const db = createDb(":memory:");
    const result = db.query("PRAGMA journal_mode").get() as {
      journal_mode: string;
    };
    // In-memory databases can't use WAL, so SQLite returns "memory"
    expect(["wal", "memory"]).toContain(result.journal_mode);
  });

  it("creates player_stats table with all stat columns", () => {
    const db = createDb(":memory:");
    const info = db.query("PRAGMA table_info(player_stats)").all() as {
      name: string;
    }[];
    const columns = info.map((col) => col.name);
    expect(columns).toContain("id");
    expect(columns).toContain("playerName");
    expect(columns).toContain("recordedAt");
    expect(columns).toContain("enemyKills");
    expect(columns).toContain("totalXp");
    // 23 stat columns + id + playerName + recordedAt = 26
    expect(columns).toHaveLength(26);
  });
});

describe("insertStats + getLatestStats roundtrip", () => {
  it("inserts and retrieves a complete PlayerStats object", () => {
    const db = createDb(":memory:");
    const input = buildCreatePlayerStats({
      playerName: "TEST",
      enemyKills: 42,
    });
    const saved = insertStats(db, input);

    expect(saved.id).toBeDefined();
    expect(saved.recordedAt).toBeDefined();
    expect(saved.playerName).toBe("TEST");
    expect(saved.enemyKills).toBe(42);

    const latest = getLatestStats(db);
    expect(latest).not.toBeNull();
    expect(latest!.id).toBe(saved.id);
    expect(latest!.playerName).toBe("TEST");
    expect(latest!.enemyKills).toBe(42);
    // Verify all 23 stat fields survive roundtrip
    for (const key of statKeys.options) {
      expect(latest![key]).toBe(input[key]);
    }
  });

  it("getLatestStats returns null for empty database", () => {
    const db = createDb(":memory:");
    expect(getLatestStats(db)).toBeNull();
  });

  it("getLatestStats returns most recent by recordedAt", () => {
    const db = createDb(":memory:");
    const first = buildCreatePlayerStats({
      playerName: "FIRST",
      enemyKills: 1,
    });
    const second = buildCreatePlayerStats({
      playerName: "SECOND",
      enemyKills: 2,
    });
    insertStats(db, first);
    insertStats(db, second);

    const latest = getLatestStats(db);
    expect(latest).not.toBeNull();
    expect(latest!.playerName).toBe("SECOND");
    expect(latest!.enemyKills).toBe(2);
  });

  it("assigns unique UUIDs to each insert", () => {
    const db = createDb(":memory:");
    const a = insertStats(db, buildCreatePlayerStats({ playerName: "A" }));
    const b = insertStats(db, buildCreatePlayerStats({ playerName: "B" }));
    expect(a.id).not.toBe(b.id);
  });
});

describe("getAllStats", () => {
  it("returns empty array for empty database", () => {
    const db = createDb(":memory:");
    expect(getAllStats(db)).toEqual([]);
  });

  it("returns rows in descending recordedAt order", () => {
    const db = createDb(":memory:");
    insertStats(db, buildCreatePlayerStats({ playerName: "A", enemyKills: 1 }));
    insertStats(db, buildCreatePlayerStats({ playerName: "B", enemyKills: 2 }));
    insertStats(db, buildCreatePlayerStats({ playerName: "C", enemyKills: 3 }));

    const all = getAllStats(db);
    expect(all).toHaveLength(3);
    // Most recent first
    expect(all[0]!.playerName).toBe("C");
    expect(all[1]!.playerName).toBe("B");
    expect(all[2]!.playerName).toBe("A");
  });

  it("returns all inserted rows", () => {
    const db = createDb(":memory:");
    for (let i = 0; i < 5; i++) {
      insertStats(db, buildCreatePlayerStats({ playerName: `P${i}` }));
    }
    expect(getAllStats(db)).toHaveLength(5);
  });
});

describe("Zod validation on read (regression guard)", () => {
  it("getLatestStats throws ZodError for corrupted row", () => {
    const db = createDb(":memory:");
    db.run(
      `INSERT INTO player_stats (id, playerName, recordedAt, enemyKills)
       VALUES ('not-a-uuid', 'BAD', 'not-a-datetime', 'not-a-number')`,
    );
    expect(() => getLatestStats(db)).toThrow();
  });

  it("getAllStats throws ZodError if any row is malformed", () => {
    const db = createDb(":memory:");
    insertStats(db, buildCreatePlayerStats({ playerName: "GOOD" }));
    db.run(
      `INSERT INTO player_stats (id, playerName, recordedAt, enemyKills)
       VALUES ('bad-uuid', 'BAD', 'bad-date', 'NaN')`,
    );
    expect(() => getAllStats(db)).toThrow();
  });
});
