# HD2 Mad Achievement Tracker

Achievement tracker for the **808th Mad Bastards**, a Helldivers 2 clan. Upload a screenshot of your in-game player card or career pages and let OCR extract your stats — or enter them manually. Track your progress toward all 10 achievements.

## Features

- **OCR stat extraction** — Upload player card or career page screenshots and Tesseract.js reads your stats automatically
- **Multi-image upload** — Career stats span two pages; upload both at once and results are merged
- **Achievement tracking** — See progress bars for all 10 achievements (kill counts, stratagem usage, samples collected)
- **Manual entry** — Enter or correct stats by hand when OCR isn't available
- **Confidence indicators** — Low-confidence OCR fields are highlighted so you can review before saving
- **SQLite persistence** — Stats are stored locally with full history
- **Docker deployment** — Single-command setup with persistent volumes

## Tracked Achievements

| Achievement | Requirement |
|---|---|
| Death From Above | 5,000 Orbital Stratagems |
| Demolition Virtuoso | 10,000 Grenade Kills |
| Doom of the Enlightened | 80,000 Illuminate Kills |
| Exterminator General | 80,000 Terminid Kills |
| Hold the Line | 3,500 Defensive Stratagems |
| Life Support | 2,500 Supply Stratagems |
| Machine Reaper | 80,000 Automaton Kills |
| Overseer | 3,500 Reinforcements |
| Sample Extractor | 18,808 Samples |
| Sky Tyrant | 5,000 Eagle Kills |

## Tech Stack

- **Runtime**: [Bun](https://bun.sh) (server, bundler, package manager, test runner)
- **Backend**: [Hono](https://hono.dev) with type-safe RPC
- **Frontend**: [React 19](https://react.dev) with Compiler
- **Routing**: [TanStack Router](https://tanstack.com/router) (file-based, type-safe)
- **State**: [TanStack Query](https://tanstack.com/query) (caching, mutations)
- **Forms**: [TanStack Form](https://tanstack.com/form) with Zod validation
- **Validation**: [Zod](https://zod.dev) (shared schemas across frontend/backend)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com)
- **OCR**: [Tesseract.js](https://github.com/naptha/tesseract.js)
- **Database**: SQLite via `bun:sqlite`

## Prerequisites

- [Docker](https://www.docker.com) and Docker Compose

## Getting Started

```bash
# Clone the repo
git clone https://github.com/KaminaDuck/HD2-mad-achievement-tracker.git
cd HD2-mad-achievement-tracker

# Build and run
docker compose up -d
```

The app is available at [http://localhost:3001](http://localhost:3001).

Data is persisted in named volumes:
- `tracker-data` — SQLite database
- `tracker-uploads` — Uploaded images

## Usage

1. Navigate to **Upload** in the nav bar
2. Drag and drop (or click to select) your player card screenshot, career page screenshots, or both
3. Review the OCR results — low-confidence fields are highlighted in amber
4. Correct any misread values and hit **Save**
5. View your achievement progress on the **Dashboard**

## Development

Requires [Bun](https://bun.sh) v1.0+.

```bash
bun install              # Install dependencies
bun run dev              # Start dev server (frontend :3000, backend :3001)
bun run dev:server       # Start backend only (hot reload)
bun run dev:client       # Start frontend only (Vite)
bun run build            # Production build (frontend → dist/client/)
bun test                 # Run all tests
bun test <file>          # Run a single test file
bun run typecheck        # Type-check with tsc
```

## Project Structure

```
src/
├── client/              # Frontend (React + TanStack)
│   ├── components/      # UI components (AchievementCard, ImageUploader, etc.)
│   ├── routes/          # File-based routes (index, upload, achievements)
│   ├── queries/         # TanStack Query option factories
│   └── mutations/       # TanStack Query mutation hooks
├── server/              # Backend (Hono + Bun)
│   ├── routes/          # API routes (stats, achievements, upload, health)
│   └── services/        # Database, OCR, and parser services
└── shared/              # Shared code
    └── schemas/         # Zod schemas (source of truth for types)
data/
└── achievements.json    # Achievement definitions
```

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/api/stats/latest` | Get most recent player stats |
| `GET` | `/api/stats` | Get all stat snapshots |
| `POST` | `/api/stats` | Save a new stat snapshot |
| `GET` | `/api/achievements` | Get achievements with progress |
| `POST` | `/api/upload` | Upload image(s) for OCR processing |

## License

[GPL-3.0](LICENSE)
