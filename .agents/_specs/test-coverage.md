# task: Comprehensive Test Coverage

## task Description

Add test coverage across the codebase to protect against regressions. The project currently has 1 test file (`parser.test.ts`, 19 tests) covering 1 of ~15 source modules. The post-review cleanup introduced runtime Zod validation on database reads, changed OCR return types, and extracted shared constants — none of which are tested. The slop-test-reviewer identified ~44 missing tests across 7 modules and 3 existing tests to strengthen.

Additionally, the parser test fixtures (`sample-extracted-stats.json`, `sample-extracted-stats-2.json`) were confirmed to be parser-generated (not hand-verified), creating a tautological test pattern. This phase must address that.

## Relevant Files

**Existing test file (strengthen):**
- `src/server/services/parser.test.ts` — 19 tests, 4 describe blocks, uses fixtures from `tests/fixtures/`

**Test fixtures:**
- `tests/fixtures/sample-ocr-output.txt` — Raw OCR text for card 1 (THUPER)
- `tests/fixtures/sample-ocr-output-2.txt` — Raw OCR text for card 2 (GAMBLE)
- `tests/fixtures/sample-extracted-stats.json` — Expected stats for card 1 (PARSER-GENERATED — needs verification)
- `tests/fixtures/sample-extracted-stats-2.json` — Expected stats for card 2 (PARSER-GENERATED — needs verification)
- `tests/fixtures/sample-player-card.png` — Player card image 1
- `tests/fixtures/sample-player-card-2.png` — Player card image 2

**Modules needing tests (server services):**
- `src/server/services/db.ts` — `createDb(path?)`, `insertStats(db, stats)`, `getLatestStats(db)`, `getAllStats(db)` — uses `bun:sqlite` in-memory for testing, `playerStatsSchema.parse()` on reads
- `src/server/services/ocr.ts` — `recognizeImage(image): Promise<string>` — returns raw text string

**Modules needing tests (server routes):**
- `src/server/routes/stats.ts` — `createStatsRoutes(db)` → GET `/latest`, GET `/`, POST `/` with zValidator
- `src/server/routes/achievements.ts` — `createAchievementRoutes(db)` → GET `/` returning `{ achievements, progress }`; internal `loadAchievements()` and `computeProgress()`
- `src/server/routes/upload.ts` — `upload` const → POST `/` with MIME/size validation, OCR, parser pipeline

**Modules needing tests (shared schemas):**
- `src/shared/schemas/stats.ts` — `playerStatsSchema`, `createPlayerStatsSchema`, `statKeys` enum
- `src/shared/schemas/achievements.ts` — `achievementSchema`, `achievementCategorySchema` (internal)

**Modules needing tests (client lib):**
- `src/client/lib/stat-fields.ts` — `STAT_GROUPS` constant, `formatTime()` function, compile-time exhaustiveness check

### New Files
- `src/server/services/db.test.ts`
- `src/server/routes/stats.test.ts`
- `src/server/routes/achievements.test.ts`
- `src/shared/schemas/stats.test.ts`
- `src/shared/schemas/achievements.test.ts`
- `src/client/lib/stat-fields.test.ts`

## Test Helpers

All tests use `bun:test` (`describe`, `it`, `expect`). No external test libraries.

For database tests, use in-memory SQLite:
```typescript
import { createDb } from "./db.ts";
const db = createDb(":memory:");
```

For route tests, use Hono's `app.request()` pattern:
```typescript
const app = new Hono().route("/api/stats", createStatsRoutes(db));
const res = await app.request("/api/stats/latest");
```

For building valid `CreatePlayerStats` objects, create a shared factory:
```typescript
function buildCreatePlayerStats(overrides?: Partial<CreatePlayerStats>): CreatePlayerStats {
  return {
    playerName: "TestPlayer",
    enemyKills: 0, terminidKills: 0, automatonKills: 0, illuminateKills: 0,
    friendlyKills: 0, grenadeKills: 0, meleeKills: 0, eagleKills: 0,
    missionsPlayed: 0, missionsWon: 0, inMissionTimeSeconds: 0,
    shotsFired: 0, shotsHit: 0,
    orbitalsUsed: 0, eagleStratagems: 0, supplyStratagems: 0,
    defensiveStratagems: 0, reinforceStratagems: 0, totalStratagems: 0,
    deaths: 0, objectivesCompleted: 0, samplesCollected: 0, totalXp: 0,
    ...overrides,
  };
}
```

Put this helper in `tests/helpers/factories.ts` and import where needed.

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create test helper factory

Create `tests/helpers/factories.ts` with the `buildCreatePlayerStats` helper above. This will be shared across db, route, and schema tests.

### Step 2: Write schema tests — `src/shared/schemas/stats.test.ts`

Tests for `playerStatsSchema`, `createPlayerStatsSchema`, and `statKeys`:

```typescript
describe("playerStatsSchema", () => {
  it("accepts a valid full PlayerStats object");
  it("rejects non-UUID id", () => {
    // { id: "abc", ... } → ZodError
  });
  it("rejects non-datetime recordedAt", () => {
    // { recordedAt: "yesterday", ... } → ZodError
  });
  it("rejects negative stat values", () => {
    // { enemyKills: -1, ... } → ZodError
  });
  it("rejects non-integer stat values", () => {
    // { enemyKills: 1.5, ... } → ZodError
  });
  it("rejects missing required fields", () => {
    // {} → ZodError
  });
});

describe("createPlayerStatsSchema", () => {
  it("accepts valid data without id and recordedAt");
  it("rejects unknown fields id and recordedAt", () => {
    // .strict() or verify they don't pass through
    // Note: Zod .omit() strips them, so this tests the omission works
  });
  it("rejects empty playerName");
});

describe("statKeys", () => {
  it("enumerates exactly 23 stat keys", () => {
    expect(statKeys.options).toHaveLength(23);
  });
  it("includes known keys", () => {
    const keys = statKeys.options;
    expect(keys).toContain("enemyKills");
    expect(keys).toContain("totalXp");
    expect(keys).toContain("inMissionTimeSeconds");
  });
  it("excludes id, playerName, recordedAt", () => {
    const keys = statKeys.options as readonly string[];
    expect(keys).not.toContain("id");
    expect(keys).not.toContain("playerName");
    expect(keys).not.toContain("recordedAt");
  });
});
```

**6 tests minimum.**

### Step 3: Write schema tests — `src/shared/schemas/achievements.test.ts`

Tests for `achievementSchema`:

```typescript
describe("achievementSchema", () => {
  it("accepts a valid achievement", () => {
    // Use a real entry from data/achievements.json
  });
  it("rejects invalid statKey", () => {
    // { statKey: "notARealStat" } → ZodError
  });
  it("rejects invalid category", () => {
    // { category: "banana" } → ZodError
  });
  it("rejects missing required fields");
  it("rejects non-positive threshold", () => {
    // { threshold: 0 } and { threshold: -1 } → ZodError
  });
  it("accepts optional icon field");
});
```

**6 tests minimum.**

### Step 4: Write database tests — `src/server/services/db.test.ts` (CRITICAL)

This is the highest-priority test file. It validates the Zod runtime validation on reads.

```typescript
describe("createDb", () => {
  it("creates in-memory database without error");
  it("initializes WAL journal mode", () => {
    const db = createDb(":memory:");
    const result = db.query("PRAGMA journal_mode").get() as { journal_mode: string };
    expect(result.journal_mode).toBe("wal");
  });
  it("creates player_stats table with all stat columns", () => {
    const db = createDb(":memory:");
    const info = db.query("PRAGMA table_info(player_stats)").all() as { name: string }[];
    const columns = info.map((col) => col.name);
    expect(columns).toContain("id");
    expect(columns).toContain("playerName");
    expect(columns).toContain("enemyKills");
    expect(columns).toContain("totalXp");
    // Verify all 23 stat columns + id + playerName + recordedAt = 26
    expect(columns).toHaveLength(26);
  });
});

describe("insertStats + getLatestStats roundtrip", () => {
  it("inserts and retrieves a complete PlayerStats object", () => {
    const db = createDb(":memory:");
    const input = buildCreatePlayerStats({ playerName: "TEST", enemyKills: 42 });
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
    // Insert two rows, verify the most recent is returned
  });
});

describe("getAllStats", () => {
  it("returns empty array for empty database", () => {
    const db = createDb(":memory:");
    expect(getAllStats(db)).toEqual([]);
  });

  it("returns rows in descending recordedAt order", () => {
    // Insert 3 rows, verify order
  });
});

describe("Zod validation on read (regression guard)", () => {
  it("getLatestStats throws ZodError for corrupted row", () => {
    const db = createDb(":memory:");
    // Manually insert a row with a non-integer stat value
    db.run(`INSERT INTO player_stats (id, playerName, recordedAt, enemyKills)
            VALUES ('not-a-uuid', 'BAD', 'not-a-datetime', 'not-a-number')`);
    expect(() => getLatestStats(db)).toThrow();
  });

  it("getAllStats throws ZodError if any row is malformed", () => {
    const db = createDb(":memory:");
    const input = buildCreatePlayerStats({ playerName: "GOOD" });
    insertStats(db, input);
    // Manually insert a corrupted row
    db.run(`INSERT INTO player_stats (id, playerName, recordedAt, enemyKills)
            VALUES ('bad-uuid', 'BAD', 'bad-date', 'NaN')`);
    expect(() => getAllStats(db)).toThrow();
  });
});
```

**10 tests minimum.** This file is CRITICAL because the cleanup replaced unsafe `as PlayerStats` casts with `playerStatsSchema.parse()`. Without these tests, a revert would go undetected by CI.

### Step 5: Write route tests — `src/server/routes/stats.test.ts`

Test the stats API routes using Hono's `app.request()`:

```typescript
describe("GET /api/stats/latest", () => {
  it("returns 404 with error message when no stats exist");
  it("returns 200 with PlayerStats after insert");
});

describe("GET /api/stats", () => {
  it("returns empty array when no stats exist");
  it("returns array of stats in descending order");
});

describe("POST /api/stats", () => {
  it("returns 201 with saved stats for valid body");
  it("returns 400 for empty body");
  it("returns 400 for invalid playerName (empty string)");
  it("returns 400 for negative stat value");
});
```

**8 tests minimum.** Use in-memory db. Create a fresh `Hono().route("/api/stats", createStatsRoutes(db))` per describe block.

### Step 6: Write route tests — `src/server/routes/achievements.test.ts`

Test the achievements API route and `computeProgress` logic:

```typescript
describe("GET /api/achievements", () => {
  it("returns 200 with achievements array and progress array");
  it("returns progress with all percent=0 when no stats exist");
  it("returns correct progress after inserting stats", () => {
    // Insert stats with orbitalsUsed: 2500, verify "Death From Above" threshold=5000 → percent=50
  });
});

describe("computeProgress edge cases (via route)", () => {
  it("caps percent at 100 when stat exceeds threshold", () => {
    // Insert stats with orbitalsUsed: 10000 (threshold 5000) → percent=100, earned=true
  });
  it("marks earned=true at exact threshold", () => {
    // Insert stats with orbitalsUsed: 5000 → earned=true
  });
  it("marks earned=false below threshold", () => {
    // Insert stats with orbitalsUsed: 4999 → earned=false
  });
});
```

**6 tests minimum.** Use in-memory db. Note: `loadAchievements()` reads `data/achievements.json` from disk using `readFileSync` relative to cwd — tests must run from the project root (which `bun test` does by default).

### Step 7: Write client lib tests — `src/client/lib/stat-fields.test.ts`

Test the shared `STAT_GROUPS` constant and `formatTime` function:

```typescript
import { statKeys } from "@/shared/schemas/stats.ts";

describe("STAT_GROUPS", () => {
  it("covers all StatKey values", () => {
    const groupKeys = STAT_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    const schemaKeys = [...statKeys.options];
    expect(groupKeys.sort()).toEqual(schemaKeys.sort());
  });

  it("has no duplicate keys", () => {
    const keys = STAT_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("has non-empty labels for all groups", () => {
    for (const group of STAT_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
    }
  });

  it("has non-empty labels for all fields", () => {
    for (const group of STAT_GROUPS) {
      for (const field of group.fields) {
        expect(field.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("formatTime", () => {
  // formatTime is not exported — test via the format property on inMissionTimeSeconds
  it("formats zero seconds", () => {
    const field = STAT_GROUPS.flatMap((g) => g.fields).find(
      (f) => f.key === "inMissionTimeSeconds",
    );
    expect(field?.format?.(0)).toBe("0h 0m 0s");
  });

  it("formats hours, minutes, seconds", () => {
    const field = STAT_GROUPS.flatMap((g) => g.fields).find(
      (f) => f.key === "inMissionTimeSeconds",
    );
    expect(field?.format?.(3661)).toBe("1h 1m 1s");
  });

  it("formats large values", () => {
    const field = STAT_GROUPS.flatMap((g) => g.fields).find(
      (f) => f.key === "inMissionTimeSeconds",
    );
    expect(field?.format?.(3935744)).toBe("1,093h 15m 44s");
  });
});
```

**7 tests minimum.**

### Step 8: Strengthen existing parser tests

Modify `src/server/services/parser.test.ts` to address the slop-test-reviewer findings:

**8a.** Replace count-based assertions with exact key sets:
```typescript
// BEFORE:
it("extracts all 21 stats", () => {
  expect(Object.keys(result.stats).length).toBe(21);
});

// AFTER:
it("extracts exactly the expected stat keys", () => {
  const expectedKeys = [
    "enemyKills", "terminidKills", "automatonKills", "illuminateKills",
    "friendlyKills", "grenadeKills", "meleeKills", "eagleKills",
    "deaths", "shotsFired", "shotsHit", "orbitalsUsed",
    "defensiveStratagems", "eagleStratagems", "supplyStratagems",
    "objectivesCompleted", "missionsPlayed", "missionsWon",
    "inMissionTimeSeconds", "samplesCollected", "totalXp",
  ];
  expect(Object.keys(result.stats).sort()).toEqual(expectedKeys.sort());
});
```

**8b.** Tighten confidence assertion for card 1:
```typescript
// BEFORE:
it("uses label confidence for most stats", () => {
  const labelCount = Object.values(result.confidence).filter((c) => c === "label").length;
  expect(labelCount).toBeGreaterThanOrEqual(20);
});

// AFTER:
it("uses label confidence for all 21 stats", () => {
  const labelCount = Object.values(result.confidence).filter((c) => c === "label").length;
  expect(labelCount).toBe(21);
});
```

**8c.** Add comprehensive confidence assertion for card 2:
```typescript
it("uses label confidence for 20 stats and position for shotsHit", () => {
  const labelCount = Object.values(result.confidence).filter((c) => c === "label").length;
  const positionCount = Object.values(result.confidence).filter((c) => c === "position").length;
  expect(labelCount).toBe(20);
  expect(positionCount).toBe(1);
  expect(result.confidence.shotsHit).toBe("position");
});
```

**8d.** Add a comment documenting the fixture tautology for future resolution:
```typescript
// NOTE: sample-extracted-stats.json and sample-extracted-stats-2.json were
// generated by running the parser on the OCR output fixtures. These values
// should be independently verified against the original game screenshots.
// Until verified, these tests prove consistency (parser produces same output
// for same input), not correctness (parser produces correct output).
```

### Step 9: Run validation commands

Execute every command to validate the task is complete with zero regressions.

- `bun run typecheck` — TypeScript compilation must pass with zero errors
- `bun test` — All tests must pass (target: ~60+ tests across 7 files)
- `bun run build` — Vite production build must succeed

## Validation Commands

- `bun run typecheck` — Zero errors
- `bun test` — All tests pass, expect ~60+ tests across 7+ files
- `bun run build` — Production build succeeds
- `bun test --coverage` — Review coverage report (informational, no threshold required yet)

## Notes

- All tests use `bun:test` — no external test frameworks (jest, vitest, etc.)
- Database tests MUST use `:memory:` SQLite — never touch `data/tracker.sqlite`
- Route tests use Hono's `app.request()` — no HTTP server needed
- The `upload.ts` route is excluded from this phase because it requires OCR integration (tesseract.js) which is slow and needs mocking infrastructure. Defer to a future phase.
- `formatTime` is not directly exported from `stat-fields.ts` — test it via the `format` property on the `inMissionTimeSeconds` field in `STAT_GROUPS`
- The `buildCreatePlayerStats` factory MUST include all 23 stat keys with defaults — verify against `statKeys.options` at test time
- Do NOT modify existing source code in this phase — only add test files and the factory helper
- The fixture tautology (Step 8d) is documented but NOT fixed in this phase — a future phase should independently verify fixture values against game screenshots
