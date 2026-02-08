import { Database } from "bun:sqlite";
import type { CreatePlayerStats, PlayerStats, StatKey } from "@/shared/schemas/stats.ts";
import { playerStatsSchema, statKeys } from "@/shared/schemas/stats.ts";

const STAT_COLUMNS: readonly StatKey[] = statKeys.options;

function initDb(db: Database): void {
  db.run("PRAGMA journal_mode = WAL;");

  db.run(`
    CREATE TABLE IF NOT EXISTS player_stats (
      id TEXT PRIMARY KEY,
      playerName TEXT NOT NULL,
      recordedAt TEXT NOT NULL,
      ${STAT_COLUMNS.map((col) => `${col} INTEGER NOT NULL DEFAULT 0`).join(",\n      ")}
    );
  `);

  db.run(
    "CREATE INDEX IF NOT EXISTS idx_player_stats_recordedAt ON player_stats(recordedAt);",
  );
}

export function createDb(path: string = "data/tracker.sqlite"): Database {
  const db = new Database(path, { create: true });
  initDb(db);
  return db;
}

export function insertStats(db: Database, stats: CreatePlayerStats): PlayerStats {
  const id = crypto.randomUUID();
  const recordedAt = new Date().toISOString();

  const columns = ["id", "playerName", "recordedAt", ...STAT_COLUMNS];
  const placeholders = columns.map((c) => `$${c}`);

  const stmt = db.prepare(
    `INSERT INTO player_stats (${columns.join(", ")}) VALUES (${placeholders.join(", ")})`,
  );

  const params: Record<string, string | number> = {
    $id: id,
    $playerName: stats.playerName,
    $recordedAt: recordedAt,
  };
  for (const col of STAT_COLUMNS) {
    params[`$${col}`] = stats[col];
  }

  stmt.run(params);

  return { id, recordedAt, ...stats };
}

export function getLatestStats(db: Database): PlayerStats | null {
  const row = db
    .query("SELECT * FROM player_stats ORDER BY recordedAt DESC LIMIT 1")
    .get();

  return row ? playerStatsSchema.parse(row) : null;
}

export function getAllStats(db: Database): PlayerStats[] {
  const rows = db.query("SELECT * FROM player_stats ORDER BY recordedAt DESC").all();
  return rows.map((row) => playerStatsSchema.parse(row));
}
