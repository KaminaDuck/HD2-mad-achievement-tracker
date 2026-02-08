# task: Post-Review Code Cleanup

## task Description

Address all findings from the code-simplifier, slop-test-reviewer, and explorer audits conducted after Phase 9. This task covers 3 CRITICAL, 6 HIGH, and 8 MEDIUM/LOW code quality issues identified across the codebase. Items explicitly kept by decision (StatsDisplay, tracker-uploads volume, statsQueries.all) are excluded. Test coverage is deferred to a separate phase.

## Relevant Files

Use these files to resolve the task:

**Shared schemas (foundational changes go here first):**
- `src/shared/schemas/stats.ts` — Source of truth for stat keys; `Confidence` type needs to land here or in a new sibling
- `src/shared/schemas/achievements.ts` — Contains dead `achievementProgressSchema` export; `achievementCategorySchema` only used internally
- `src/shared/schemas/index.ts` — Barrel re-exports; needs pruning after schema changes

**Server services:**
- `src/server/services/db.ts` — `STAT_COLUMNS` duplicates schema keys (lines 4-28); unsafe `as PlayerStats` casts (lines 84, 90); pointless `PRAGMA foreign_keys = ON` (line 32)
- `src/server/services/ocr.ts` — `OcrResult` wraps a single string; should return `string` directly
- `src/server/services/parser.ts` — Exports `Confidence` type (line 3); this type must move to `src/shared/`

**Server routes:**
- `src/server/routes/achievements.ts` — `require("fs")` in ESM (line 14); superfluous lazy cache (lines 20-27); redundant `as StatKey` and `as number` casts (line 34)
- `src/server/routes/upload.ts` — Calls `result.text` on `OcrResult` (line 29); must update after `recognizeImage` returns string

**Client components:**
- `src/client/components/PlayerStatsForm.tsx` — Imports `Confidence` from `@/server/` (line 7); has duplicated `STAT_GROUPS`
- `src/client/components/OcrReview.tsx` — Imports `Confidence` from `@/server/` (line 2); redundant `playerName ?? ""` (line 39)
- `src/client/components/ImageUploader.tsx` — Unnecessary `useCallback` wrappers (lines 14-38); `URL.createObjectURL` never revoked (line 16)
- `src/client/components/StatsDisplay.tsx` — Duplicated `STAT_GROUPS` (lines 19-68); redundant `as number` cast (line 80). Keeping the component, but fixing duplication and cast.

**Client routes:**
- `src/client/routes/upload.tsx` — Imports `Confidence` from `@/server/` (line 9)

**Client lib:**
- `src/client/lib/api.ts` — Imports `AppType` from `@/server/` (line 2); this one is architectural (Hono RPC pattern) and is acceptable. Leave as-is.

**Config / data files:**
- `data/achievements.json` — Typo "demolitionviruoso" on line 18
- `vite.config.ts` — Remove `/health` proxy (lines 35-38); remove `changeOrigin: true` (lines 33, 37)
- `index.html` — Redundant body classes (line 8)
- `package.json` — `@types/bun: "latest"` unpinned (line 29)
- `.dockerignore` — Stale `PHASE0-FINDINGS.md` reference (line 14)

### New Files
- `src/shared/schemas/ocr.ts` — New file for `Confidence` type and `ParseResult` interface (moved from `parser.ts`)

## Step by Step Tasks

IMPORTANT: Execute every step in order, top to bottom.

### Step 1: Create shared OCR types (CRITICAL #1)

Move the `Confidence` type and `ParseResult` interface from `src/server/services/parser.ts` to a new shared schema file so the client can import them without crossing the server boundary.

- Create `src/shared/schemas/ocr.ts` with:
  - `export type Confidence = "label" | "position";`
  - Import `StatKey` from `./stats.ts`
  - `export interface ParseResult { stats: Partial<Record<StatKey, number>>; confidence: Partial<Record<StatKey, Confidence>>; playerName: string | null; }`
- Re-export from `src/shared/schemas/index.ts`: add `export { type Confidence, type ParseResult } from "./ocr.ts";`
- Update `src/server/services/parser.ts`: remove local `Confidence` type and `ParseResult` interface definitions; import both from `@/shared/schemas/ocr.ts`
- Update all 3 client files that import from `@/server/services/parser.ts`:
  - `src/client/components/OcrReview.tsx:2` — change to `import type { Confidence } from "@/shared/schemas/ocr.ts";`
  - `src/client/components/PlayerStatsForm.tsx:7` — change to `import type { Confidence } from "@/shared/schemas/ocr.ts";`
  - `src/client/routes/upload.tsx:9` — change to `import type { Confidence } from "@/shared/schemas/ocr.ts";`

### Step 2: Fix require("fs") in ESM (CRITICAL #2)

Replace CJS `require("fs")` with ESM-compatible Bun API in the achievements route.

- In `src/server/routes/achievements.ts`:
  - Replace line 14 `require("fs").readFileSync("data/achievements.json", "utf-8")` with `Bun.file("data/achievements.json").text()` (async) or `import { readFileSync } from "node:fs"` at the top and use `readFileSync("data/achievements.json", "utf-8")`.
  - Using `readFileSync` is simpler since `loadAchievements()` is currently synchronous. If switching to async, the function signature and its callers must change.
  - Recommended: Add `import { readFileSync } from "node:fs";` at top and replace the `require("fs").readFileSync(...)` call with `readFileSync("data/achievements.json", "utf-8")`.

### Step 3: Add runtime validation on SQLite rows (CRITICAL #3)

Replace unsafe `as PlayerStats` casts with schema validation on database query results.

- In `src/server/services/db.ts`:
  - Import `playerStatsSchema` from `@/shared/schemas/stats.ts`
  - Line 84 (`getLatestStats`): Replace `(row as PlayerStats) ?? null` with:
    ```typescript
    return row ? playerStatsSchema.parse(row) : null;
    ```
  - Line 90 (`getAllStats`): Replace `as PlayerStats[]` with:
    ```typescript
    const rows = db.query("SELECT * FROM player_stats ORDER BY recordedAt DESC").all();
    return rows.map((row) => playerStatsSchema.parse(row));
    ```

### Step 4: Derive STAT_COLUMNS from schema (HIGH #4)

Eliminate the hand-maintained 23-element array that duplicates schema keys.

- In `src/server/services/db.ts`:
  - Import `statKeys` from `@/shared/schemas/stats.ts`
  - Replace the entire `const STAT_COLUMNS: StatKey[] = [...]` block (lines 4-28) with:
    ```typescript
    const STAT_COLUMNS: StatKey[] = statKeys.options as unknown as StatKey[];
    ```
  - Note: `statKeys` is `z.enum(...)` and `.options` gives the array of string literals. Verify the array order doesn't matter for the SQL generation (it shouldn't — column order in CREATE TABLE and INSERT is derived from this same array).

### Step 5: Remove superfluous lazy cache (HIGH #10)

The `cachedAchievements` variable and `getAchievements()` wrapper serve no purpose since `loadAchievements()` is called exactly once.

- In `src/server/routes/achievements.ts`:
  - Delete lines 20-27 (the `let cachedAchievements` and `getAchievements()` function)
  - On line 52 (inside `createAchievementRoutes`), change `getAchievements()` to `loadAchievements()`:
    ```typescript
    const achievements = loadAchievements();
    ```

### Step 6: Remove redundant type casts in achievements route (MEDIUM #12)

- In `src/server/routes/achievements.ts`, line 34:
  - Change `const currentValue = stats ? (stats[a.statKey as StatKey] as number) : 0;` to:
    ```typescript
    const currentValue = stats ? stats[a.statKey] : 0;
    ```
  - `a.statKey` is already typed as `StatKey` by the Zod schema, and `stats[a.statKey]` returns `number` since all stat fields are `number` in `PlayerStats`. Both casts are redundant.

### Step 7: Simplify OcrResult to return string (HIGH #9)

- In `src/server/services/ocr.ts`:
  - Remove the `OcrResult` interface (lines 3-5)
  - Change the return type of `recognizeImage` from `Promise<OcrResult>` to `Promise<string>`
  - Change the return statement from `return { text: result.data.text }` to `return result.data.text`
- In `src/server/routes/upload.ts`, line 28-29:
  - Change from:
    ```typescript
    const result = await recognizeImage(buffer);
    ocrText = result.text;
    ```
  - To:
    ```typescript
    ocrText = await recognizeImage(buffer);
    ```

### Step 8: Remove dead schema exports (HIGH #7)

- In `src/shared/schemas/achievements.ts`:
  - Remove `achievementProgressSchema` (lines 27-34) entirely
  - Keep `AchievementProgress` type — but redefine it as a plain interface since it's used by `src/server/routes/achievements.ts`:
    ```typescript
    export interface AchievementProgress {
      achievementId: string;
      name: string;
      currentValue: number;
      threshold: number;
      percent: number;
      earned: boolean;
    }
    ```
  - Alternatively, just delete the schema and keep the type inferred from it removed — use a manual type. The point is to remove the unused Zod schema while preserving the TypeScript type that IS used.
- In `src/shared/schemas/index.ts`:
  - Remove `achievementProgressSchema` from the re-exports
  - Remove `achievementCategorySchema` from the re-exports (only used internally in `achievements.ts`)

### Step 9: Remove PRAGMA foreign_keys (MEDIUM #11)

- In `src/server/services/db.ts`, line 32:
  - Delete the line `db.run("PRAGMA foreign_keys = ON;");`
  - There are no foreign key constraints in the database.

### Step 10: Fix ImageUploader — remove useCallback + fix URL leak (MEDIUM #13, #14)

- In `src/client/components/ImageUploader.tsx`:
  - Remove `useCallback` import (only keep `useState, useRef` from react)
  - Convert `handleFile` (lines 14-19) from `useCallback` to a plain function:
    ```typescript
    function handleFile(file: File) {
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(file));
      onUpload(file);
    }
    ```
    This also fixes the URL leak by revoking the previous object URL.
  - Convert `handleDrop` (lines 22-29) from `useCallback` to a plain function:
    ```typescript
    function handleDrop(e: React.DragEvent) {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    }
    ```
  - Convert `handleChange` (lines 32-37) from `useCallback` to a plain function:
    ```typescript
    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    }
    ```

### Step 11: Remove redundant `as number` cast in StatsDisplay (MEDIUM #13)

- In `src/client/components/StatsDisplay.tsx`, line 80:
  - Change `const value = stats[field.key] as number;` to `const value = stats[field.key];`

### Step 12: Extract shared STAT_GROUPS constant (HIGH #5)

Both `StatsDisplay.tsx` and `PlayerStatsForm.tsx` define nearly identical `STAT_GROUPS` arrays. Extract to a shared location.

- Create or add to `src/client/lib/stat-fields.ts`:
  ```typescript
  import type { StatKey } from "@/shared/schemas/stats.ts";

  export interface StatFieldDef {
    key: StatKey;
    label: string;
    format?: (value: number) => string;
  }

  export interface StatGroup {
    label: string;
    fields: StatFieldDef[];
  }

  export const STAT_GROUPS: StatGroup[] = [
    // ... (use the definitive version from PlayerStatsForm.tsx)
  ];
  ```
- Update `src/client/components/PlayerStatsForm.tsx`:
  - Remove local `StatFieldDef` interface and `STAT_GROUPS` definition
  - Import from `../lib/stat-fields.ts`
- Update `src/client/components/StatsDisplay.tsx`:
  - Remove local `STAT_GROUPS` definition
  - Import from `../lib/stat-fields.ts`

### Step 13: Remove redundant OcrReview null coalescing (LOW #24)

- In `src/client/components/OcrReview.tsx`, line 39:
  - Change `defaultPlayerName={playerName ?? ""}` to `defaultPlayerName={playerName}`
  - Verify `PlayerStatsForm.buildDefaults` already handles `null` for `playerName` (it does, in its `buildDefaults` function)
  - Update `PlayerStatsForm`'s `defaultPlayerName` prop type to accept `string | null` if it doesn't already

### Step 14: Fix config / data file issues (LOW)

- **`data/achievements.json`** line 18: Change `"demolitionviruoso"` to `"demolitionvirtuoso"`
- **`vite.config.ts`**: Remove the `/health` proxy block (lines 35-38) and `changeOrigin: true` from the `/api` proxy (line 33)
- **`index.html`** line 8: Remove `class="bg-gray-950 text-gray-100"` from the `<body>` tag (React root controls styling)
- **`package.json`** line 29: Pin `@types/bun` to a specific version (run `bun pm ls @types/bun` to get current installed version, then pin to `^<version>`)
- **`.dockerignore`** line 14: Remove the `PHASE0-FINDINGS.md` entry (file no longer exists)

### Step 15: Run validation commands

Run all validation commands from the section below to confirm zero regressions.

## Validation Commands

Execute every command to validate the task is complete with zero regressions.

- `bun run typecheck` — TypeScript compilation must pass with zero errors
- `bun test` — All 19 parser tests must pass
- `bun run build` — Vite production build must succeed (confirms no client-side import breakage)
- `grep -r "from.*@/server" src/client/` — Must return ONLY `src/client/lib/api.ts` (the AppType import, which is the intentional Hono RPC pattern). No other client files should import from `@/server/`.
- `grep -r "require(" src/` — Must return zero results (no CJS require calls remaining)
- `grep -r "as PlayerStats" src/` — Must return zero results (no unsafe casts remaining)
- `grep -r "as StatKey" src/` — Must return zero results
- `grep -r "as number" src/client/components/StatsDisplay.tsx` — Must return zero results
- `grep "useCallback" src/client/components/ImageUploader.tsx` — Must return zero results
- `grep "demolitionviruoso" data/achievements.json` — Must return zero results (typo fixed)
- `grep "PHASE0-FINDINGS" .dockerignore` — Must return zero results

## Notes

- Create a git worktree for isolated implementation (e.g., `cleanup/post-review`)
- `src/client/lib/api.ts` importing `AppType` from `@/server/index.ts` is the standard Hono RPC pattern and should NOT be changed
- `StatsDisplay.tsx` is being kept per user decision — fix its issues but do not delete it
- `statsQueries.all()` is being kept per user decision — do not delete it
- `tracker-uploads` Docker volume is being kept per user decision — do not remove it
- `achievementProgressSchema` is being removed, but the `AchievementProgress` TypeScript type must be preserved (it's used by the achievements route)
- When extracting `STAT_GROUPS`, use the `PlayerStatsForm.tsx` version as the canonical source (it has the `format` functions for time display)
- Step 4 (derive STAT_COLUMNS) depends on the `statKeys` export from the schema — verify `statKeys.options` gives the correct array at runtime before committing
