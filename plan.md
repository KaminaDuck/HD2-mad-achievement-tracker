# HD2 Mad Achievement Tracker - Implementation Plan

## Context

The 808th Mad Bastards need a way to track one-time career achievements in Helldivers 2. Stats come from player card images downloaded from hd2clans.com profiles. The tracker extracts stats via OCR (with manual entry fallback), compares them against achievement thresholds defined in a JSON file, and shows progress on a dashboard. Single player, served from Docker.

## Architecture

Fearnstack monolith: Bun + Hono backend serves API and built React frontend from a single process/container.

```
src/
├── client/                    # React 19 + TanStack
│   ├── components/
│   │   ├── AchievementCard.tsx    # Single achievement: name, threshold, progress bar, status
│   │   ├── AchievementGrid.tsx    # Grid of cards grouped by category
│   │   ├── ClanHeader.tsx         # "808th Mad Bastards" banner + stats snapshot
│   │   ├── ImageUploader.tsx      # Drag-and-drop image upload with preview
│   │   ├── OcrReview.tsx          # Show OCR results, let user correct before saving
│   │   ├── PlayerStatsForm.tsx    # Editable form for all stats (manual entry + OCR correction)
│   │   ├── ProgressBar.tsx        # Reusable progress bar component
│   │   └── StatsDisplay.tsx       # Read-only stats overview
│   ├── routes/
│   │   ├── __root.tsx             # Root layout with nav
│   │   ├── index.tsx              # Dashboard: achievement grid + stats summary
│   │   ├── upload.tsx             # Upload flow: image → OCR → review → save
│   │   └── achievements.tsx       # Full achievement catalog
│   ├── lib/
│   │   ├── api.ts                 # hc<AppType> RPC client
│   │   └── query.ts              # QueryClient config
│   ├── queries/
│   │   ├── stats.ts              # Stats query options
│   │   └── achievements.ts       # Achievement query options
│   ├── mutations/
│   │   ├── upload.ts             # useUploadImage hook
│   │   └── stats.ts             # useCreateStats hook
│   └── main.tsx
├── server/
│   ├── routes/
│   │   ├── stats.ts              # GET /api/stats/latest, POST /api/stats
│   │   ├── achievements.ts       # GET /api/achievements (with progress)
│   │   ├── upload.ts             # POST /api/upload (image → OCR → structured result)
│   │   └── health.ts             # GET /health
│   ├── services/
│   │   ├── db.ts                 # bun:sqlite wrapper (player_stats table)
│   │   ├── ocr.ts                # Tesseract.js wrapper
│   │   └── parser.ts             # OCR text → structured stats via regex
│   ├── index.ts                  # Hono app assembly, AppType export
│   └── serve.ts                  # Bun.serve entry point
└── shared/
    └── schemas/
        ├── stats.ts              # PlayerStats Zod schema (all stat fields)
        ├── achievements.ts       # Achievement Zod schema (single threshold)
        └── index.ts              # Re-exports
```

Additional root files:
```
data/achievements.json     # Achievement definitions (source of truth)
uploads/                   # Uploaded images (gitignored, Docker volume)
index.html                 # Vite HTML entry
package.json
tsconfig.json
vite.config.ts
Dockerfile
docker-compose.yml
.dockerignore
```

## Key Design Decisions

### Achievements: Single Threshold
Each achievement has one target value. You've reached it or you haven't. Schema:
```typescript
{ id, name, description, category, statKey, threshold, icon? }
```
Progress is computed as: `currentValue / threshold` (capped at 100%).

### Persistence: SQLite via bun:sqlite
- Zero extra dependencies (built into Bun)
- Single `player_stats` table storing snapshots over time
- Latest snapshot used for achievement progress
- DB file at `data/tracker.sqlite`, volume-mounted in Docker

### OCR: Tesseract.js Server-Side
- No API keys, no cost, runs offline in Docker
- Player cards from hd2clans.com have a consistent generated layout (good for OCR)
- Parser uses regex patterns matching stat labels to numbers
- **User always reviews/corrects** OCR output before saving
- Manual entry available as complete fallback
- **Requires Phase 0 spike** to validate feasibility before implementation
- Confidence scoring: Tesseract word-level confidence used to highlight low-confidence fields (<70%) in OcrReview form
- Time field parsing: parser is responsible for converting HH:MM:SS strings to seconds

### Single Process Production
Hono serves both `/api/*` routes and static frontend from `dist/client/`. One container, one port (3001). Vite proxy used in dev for HMR.

## Schemas

### PlayerStats (`src/shared/schemas/stats.ts`)
All numeric stat fields as `z.number().int().nonnegative()`:
- **Kills**: enemyKills, terminidKills, automatonKills, illuminateKills, friendlyKills, grenadeKills, meleeKills, eagleKills
- **Missions**: missionsPlayed, missionsWon
- **Time**: inMissionTimeSeconds (HH:MM:SS converted to seconds)
- **Accuracy**: shotsFired, shotsHit
- **Stratagems**: orbitalsUsed, eagleStratagems, supplyStratagems, defensiveStratagems, reinforceStratagems, totalStratagems
- **Other**: deaths, objectivesCompleted, samplesCollected, totalXp
- **Meta**: id (uuid), playerName, recordedAt (datetime)

### Achievement (`src/shared/schemas/achievements.ts`)
```typescript
{ id: string, name: string, description: string,
  category: "kills" | "missions" | "stratagems" | "accuracy" | "survival" | "misc",
  statKey: StatKey, threshold: number, icon?: string }
```

### AchievementProgress (computed, not stored)
```typescript
{ achievementId, name, currentValue, threshold, percent, earned: boolean }
```

## Achievement Data (`data/achievements.json`)

17 achievements across categories (thresholds are placeholders — tune in JSON):
- **Terminid Slayer**: terminidKills >= 100,000
- **Automaton Breaker**: automatonKills >= 100,000
- **Total Annihilation**: enemyKills >= 500,000
- **Veteran Diver**: missionsPlayed >= 500
- **Mission Success**: missionsWon >= 300
- **Sharpshooter**: shotsHit >= 500,000
- **Orbital Commander**: orbitalsUsed >= 1,000
- **Stratagem Specialist**: totalStratagems >= 5,000
- **Sample Collector**: samplesCollected >= 10,000
- **Mad Bastard**: friendlyKills >= 1,000 (on-brand)
- **Lifer**: inMissionTimeSeconds >= 1,800,000 (500 hours)
- **Grenadier**: grenadeKills >= 5,000
- **Up Close and Personal**: meleeKills >= 2,000
- **Death From Above**: eagleKills >= 50,000
- **Walking Dead**: deaths >= 5,000
- **Objective Focused**: objectivesCompleted >= 2,000
- **Trigger Happy**: shotsFired >= 2,000,000

## API Routes

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/stats/latest` | Latest stats snapshot |
| GET | `/api/stats` | All stats snapshots (history) — reserved for future history view |
| POST | `/api/stats` | Save new stats (from OCR review or manual entry) |
| GET | `/api/achievements` | All achievements with progress from latest stats |
| POST | `/api/upload` | Upload player card image → OCR → return parsed stats |
| GET | `/health` | Container health check |

## UX Flow

1. **Dashboard** (`/`): Shows clan header, achievement grid with progress bars, overall completion count
2. **Upload** (`/upload`):
   - Step 1: Drag-and-drop player card image → upload → OCR runs server-side
   - Step 2: Review extracted stats in editable form (low-confidence fields highlighted)
   - Step 3: Correct any values → submit → stats saved → redirect to dashboard
   - Alternative: "Enter manually" button skips OCR, shows blank form
3. **Achievements** (`/achievements`): Full catalog with descriptions and current progress

## Docker Setup

**Dockerfile**: Multi-stage build (oven/bun:1 builder → oven/bun:1-slim production)
- Copies dist/, data/achievements.json, and only Tesseract WASM assets from node_modules (not the entire node_modules tree)
- Creates /app/data and /app/uploads directories
- Health check against /health endpoint
- Exposes port 3001

**docker-compose.yml**: Single service with named volumes for `data/` (SQLite) and `uploads/` (images)

## Styling

Tailwind CSS 4 via `@tailwindcss/vite`. Utility-first, no separate CSS files. Dark theme default (fits the HD2 aesthetic).

## Error Handling

### API Error Shape
All error responses return:
```typescript
{ error: string, detail?: string }
```

### Status Codes
| Scenario | Status | Error |
|----------|--------|-------|
| Validation failure (bad stats) | 400 | Zod error message |
| Upload not an image | 400 | "File must be PNG or JPEG" |
| Upload too large (>5MB) | 413 | "File exceeds 5MB limit" |
| OCR processing failure | 422 | "Could not extract text from image" |
| DB write failure | 500 | "Failed to save stats" |
| Tesseract init failure | 503 | "OCR service unavailable" |

### Upload Constraints
- Max file size: 5MB
- Accepted MIME types: `image/png`, `image/jpeg`
- Validated server-side before OCR processing

### Frontend Error Handling
- API errors displayed as toast/banner with the `error` message
- Upload failures show inline error with retry option
- Network errors show "Connection lost" with retry
- Empty states: dashboard shows "No stats yet — upload your player card to get started"

## Testing Strategy

### Unit Tests
- `src/server/services/parser.test.ts` — Parser is the highest-risk code. Test with real OCR output samples and edge cases (missing fields, garbled numbers, extra whitespace).
- `src/shared/schemas/stats.test.ts` — Schema validation: valid data passes, invalid data rejected with correct errors.
- `src/shared/schemas/achievements.test.ts` — Achievement schema validation + achievements.json passes schema check at test time.

### Integration Tests
- `src/server/routes/stats.test.ts` — POST/GET stats lifecycle.
- `src/server/routes/upload.test.ts` — Upload validation (bad MIME, too large, valid image).

### Test Fixtures
- `tests/fixtures/sample-ocr-output.txt` — Real Tesseract output from an hd2clans.com player card.
- `tests/fixtures/sample-player-card.png` — Real player card image for end-to-end OCR test.

### Running Tests
```bash
bun test                           # All tests
bun test src/server/services/      # Parser + service tests
bun test src/shared/               # Schema tests
```

## Implementation Order

### Phase 0: OCR Feasibility Spike (do this first)
Before building anything, validate the OCR bet:
1. `bun init` + `bun add tesseract.js` — confirm it loads in Bun without errors
2. Download a real player card image from hd2clans.com
3. Run Tesseract against it, capture raw text output
4. Assess: Is the output parseable? What regex patterns match stat labels to values?
5. Save sample output to `tests/fixtures/sample-ocr-output.txt`

**Decision gate**: If OCR output is unusable, defer OCR to v2 and ship manual-only for v1. The upload route becomes optional and the parser is not needed.

### Phase 1: Foundation (steps 1-5)
1. `package.json` - deps and scripts
2. `tsconfig.json` - TypeScript config
3. `.gitignore` - expanded (node_modules, dist, uploads/, data/*.sqlite)
4. `vite.config.ts` - Vite + React + TanStack Router plugin + dev proxy
5. `index.html` - Vite entry point

→ Run `bun install`

### Phase 2: Shared Schemas (steps 6-8)
6. `src/shared/schemas/stats.ts`
7. `src/shared/schemas/achievements.ts`
8. `src/shared/schemas/index.ts`

### Phase 3: Data + Server Services (steps 9-12)
9. `data/achievements.json` - all achievement definitions
10. `src/server/services/db.ts` - SQLite init + CRUD
11. `src/server/services/ocr.ts` - Tesseract.js wrapper (skip if Phase 0 failed)
12. `src/server/services/parser.ts` - OCR text → stats regex parser (skip if Phase 0 failed)

### Phase 3b: Parser Tests (step 12b)
12b. `src/server/services/parser.test.ts` - Tests against real OCR output from Phase 0 spike

### Phase 4: Server Routes + App (steps 13-18)
13. `src/server/routes/health.ts`
14. `src/server/routes/stats.ts` - includes input validation via Zod, returns 400 on bad data
15. `src/server/routes/achievements.ts` - validates achievements.json against schema at startup
16. `src/server/routes/upload.ts` - MIME check, size check (5MB), returns 400/413/422 on failure (skip if Phase 0 failed)
17. `src/server/index.ts` - app assembly + AppType + global error handler
18. `src/server/serve.ts` - Bun.serve entry

→ Test: `bun run dev:server` + curl endpoints + `bun test src/server/`

### Phase 5: Frontend Foundation (steps 19-22)
19. `src/client/lib/api.ts` - RPC client
20. `src/client/lib/query.ts` - QueryClient
21. `src/client/main.tsx` - entry with providers
22. `src/client/routes/__root.tsx` - root layout + nav

### Phase 6: Frontend Data Layer (steps 23-26)
23. `src/client/queries/stats.ts`
24. `src/client/queries/achievements.ts`
25. `src/client/mutations/upload.ts`
26. `src/client/mutations/stats.ts`

### Phase 7: Frontend Components (steps 27-34)
27. `ProgressBar.tsx`
28. `ClanHeader.tsx`
29. `AchievementCard.tsx`
30. `AchievementGrid.tsx`
31. `StatsDisplay.tsx`
32. `ImageUploader.tsx`
33. `PlayerStatsForm.tsx`
34. `OcrReview.tsx`

### Phase 8: Frontend Routes (steps 35-37)
35. `src/client/routes/index.tsx` - dashboard
36. `src/client/routes/upload.tsx` - upload flow
37. `src/client/routes/achievements.tsx` - catalog

→ Test: `bun run dev` → full app in browser

### Phase 9: Docker (steps 38-40)
38. `Dockerfile`
39. `docker-compose.yml`
40. `.dockerignore`

→ Test: `docker compose up --build` → app at localhost:3001

## Verification

### Automated (must pass)
1. `bun test` — all unit and integration tests pass
2. `bun run typecheck` — no type errors
3. `bun run lint` — no lint errors

### Manual (smoke test checklist)
4. **Server**: `bun run dev:server` → `curl localhost:3001/health` returns ok
5. **Full dev**: `bun run dev` → dashboard loads at localhost:3000
6. **Empty state**: Dashboard shows "no stats yet" prompt, not a broken grid
7. **Manual entry**: Click "Enter manually" → fill form → save → achievements reflect new stats → redirect to dashboard
8. **Upload flow**: Upload a real hd2clans.com player card → OCR returns stats → review form shows values with low-confidence fields highlighted → correct → save → dashboard updates
9. **Upload errors**: Upload a .txt file → 400 error shown. Upload a 10MB image → 413 error shown.
10. **Achievements**: Progress bars show correct % based on latest stats vs thresholds
11. **Docker**: `docker compose up --build` → app fully functional at localhost:3001

### Acceptance Criteria
- All 17 achievements render with correct progress from latest stats snapshot
- Stats can be entered manually without using OCR at all
- Uploading a non-image or oversized file shows a clear error, not a crash
- App is fully functional from a single `docker compose up`

## Open Questions

1. **Stats history UI** — `GET /api/stats` returns all snapshots but no frontend consumes it. Build a history view later or cut the endpoint for now?
2. **Delete/edit stats** — Once saved, stats snapshots are permanent. Should there be a way to delete a bad save?
3. **Multi-player** — Clan name implies multiple members. Is this strictly single-player forever, or will multi-player be needed?

## Review Log

**2025-02-07 — Initial review (status: Needs Work → Updated)**

Changes made based on review:
- Added Phase 0 OCR feasibility spike with decision gate
- Added Styling section (Tailwind CSS 4)
- Added Error Handling section (API error shape, status codes, upload constraints, frontend error handling)
- Added Testing Strategy section (unit tests, integration tests, fixtures)
- Added parser test step (Phase 3b)
- Added error validation details to server route descriptions
- Specified all 17 achievements (was "~17" with "etc.")
- Specified Docker image should copy only Tesseract WASM assets, not full node_modules
- Added OCR confidence threshold (70%) and time field parsing responsibility
- Replaced vague verification with automated checks, manual smoke test checklist, and acceptance criteria
- Added empty state handling requirement
- Noted `GET /api/stats` as reserved for future history view
- Added Open Questions section for unresolved decisions
