# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HD2-mad-achievement-tracker is a Helldivers 2 achievement tracking application. The project is in early development.

## Tech Stack (Fearnstack)

This project uses the Fearnstack - a type-safe full-stack TypeScript architecture:

- **Runtime**: Bun (server, bundler, package manager, test runner)
- **Backend**: Hono (API framework with type-safe RPC)
- **Validation**: Zod (shared schemas across frontend/backend)
- **State**: TanStack Query (async state, caching, mutations)
- **Routing**: TanStack Router (type-safe file-based routing)
- **Forms**: TanStack Form (form state with Zod validation)
- **UI**: React 19 with Compiler

## Git Rules

- Do NOT add `Co-Authored-By` trailers to commits (see `.agents/settings.json`)

## Commands

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Run single test file
bun test path/to/file.test.ts

# Type check
bun run typecheck

# Lint
bun run lint

# Build for production
bun run build
```

## Architecture

Types flow automatically through the stack without manual definitions:

```
Zod Schema → Hono Validator → RPC Types → Query Types → Component Props
```

### Directory Structure (when implemented)

```
src/
├── client/              # Frontend (React + TanStack)
│   ├── components/
│   ├── routes/
│   ├── hooks/
│   └── main.tsx
├── server/              # Backend (Hono)
│   ├── routes/
│   ├── middleware/
│   └── index.ts
└── shared/              # Shared code
    └── schemas/         # Zod schemas (source of truth)
```

## Key Patterns

### API Endpoints

```typescript
// Backend: Hono with Zod validation
app.post('/api/resource', zValidator('json', schema), async (c) => {
  const data = c.req.valid('json'); // Typed from schema
  return c.json(result);
});

// Frontend: Type-safe client
const client = hc<typeof app>(baseUrl);
const data = await client.api.resource.$post({ json: payload });
```

### Data Fetching

```typescript
const { data } = useQuery({
  queryKey: ['key'],
  queryFn: () => client.api.resource.$get().then(r => r.json()),
});
```

## Agentic Development (.agents)

This project includes an agentic development framework in `.agents/` for AI-assisted workflows.

### Commands

Invoke with `/<command> <arguments>`:

| Command | Purpose | Example |
|---------|---------|---------|
| `/feature` | Plan a new feature with full spec | `/feature Add user authentication with JWT` |
| `/defect` | Plan a bug fix with root cause analysis | `/defect API returns 500 on login` |
| `/task` | Plan a general task | `/task Upgrade dependencies` |
| `/implement` | Execute a spec file | `/implement .agents/_specs/feature-name.md` |
| `/verify` | Show understanding before implementing | `/verify .agents/_specs/auth-feature.md` |
| `/checkpoint` | Save planning work to git | `/checkpoint before-refactor` |
| `/slop-detector` | Detect code quality issues | |
| `/review-plan` | Review an implementation plan | |
| `/structure` | Analyze codebase structure | |
| `/split-spec` | Split a large spec into smaller parts | |

### Agents

Delegate work to specialized agents via the Task tool:

| Agent | Purpose |
|-------|---------|
| `build-agent` | Implement a single file from detailed spec (use for parallel builds) |
| `code-simplifier` | Refine code for clarity and consistency |
| `docs-scraper` | Fetch and save documentation from URLs as markdown |

Subagents (used by other agents):
- `spec-writer` - Write specification files
- `isolated-test-writer` - Write isolated test files
- `code-simplifier-reviewer` - Review code simplification changes
- `slop-test-reviewer` - Review test quality

### Skills

Read `.agents/skills/developing-with-fearnstack/` for comprehensive stack documentation:

| Category | Topics |
|----------|--------|
| **Overview** | Introduction, quick-start, architecture, stack comparison |
| **Frontend** | React 19, TanStack Router/Query/Form/DB/AI |
| **Backend** | Hono fundamentals, RPC, middleware, streaming |
| **Runtime** | Bun runtime, bundler, testing, package manager |
| **Validation** | Zod fundamentals, cross-stack integration |
| **Integration** | Frontend-backend, type-safe APIs, form validation, AI streaming |
| **Reference** | Cheat sheet, error handling, troubleshooting |

### Workflow

1. **Plan first**: Use `/feature`, `/defect`, or `/task` to create a spec in `.agents/_specs/`
2. **Verify understanding**: Use `/verify` to confirm alignment before coding
3. **Checkpoint**: Use `/checkpoint` to save planning work before implementation
4. **Implement**: Use `/implement` to execute the spec
5. **Parallel builds**: Delegate file implementation to `build-agent` for concurrent work
