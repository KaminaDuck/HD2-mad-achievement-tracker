---
title: Bun Package Manager
description: Fast package management with workspaces and lockfile
---

# Bun Package Manager

Bun's package manager is up to 30x faster than npm with full npm compatibility. It uses a binary lockfile for faster installs and supports workspaces for monorepos.

## Basic Commands

```bash
# Install all dependencies
bun install

# Add a package
bun add react

# Add dev dependency
bun add -d typescript

# Add optional dependency
bun add -o package

# Add peer dependency
bun add --peer package

# Remove package
bun remove react

# Update packages
bun update

# Execute package binary
bunx vite
```

## Installation Modes

```bash
# Production only (no devDependencies)
bun install --production

# Frozen lockfile (CI)
bun install --frozen-lockfile

# Don't save to lockfile
bun install --no-save

# Force fresh install
bun install --force
```

## Package.json

Standard package.json format:

```json
{
  "name": "my-fearnstack-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun run --hot src/server/serve.ts",
    "build": "bun build ./src/client/main.tsx --outdir ./dist",
    "test": "bun test"
  },
  "dependencies": {
    "hono": "^4.0.0",
    "@tanstack/react-query": "^5.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^3.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Lockfile

Bun uses a binary lockfile (`bun.lockb`) for faster installs:

```bash
# View lockfile as YAML
bun bun.lockb

# Regenerate lockfile
bun install --force
```

**Commit `bun.lockb` to version control** for reproducible installs.

### Converting from npm/yarn/pnpm

```bash
# Bun automatically converts existing lockfiles
bun install
# Creates bun.lockb, keeps package-lock.json/yarn.lock for reference
```

## Workspaces

Monorepo support with workspaces:

```json
// package.json (root)
{
  "name": "my-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ]
}
```

### Workspace Structure

```
my-monorepo/
├── package.json
├── bun.lockb
├── packages/
│   ├── shared/
│   │   └── package.json
│   └── ui/
│       └── package.json
└── apps/
    ├── web/
    │   └── package.json
    └── api/
        └── package.json
```

### Workspace Package

```json
// packages/shared/package.json
{
  "name": "@myapp/shared",
  "version": "1.0.0",
  "main": "./src/index.ts"
}
```

### Using Workspace Dependencies

```json
// apps/web/package.json
{
  "name": "@myapp/web",
  "dependencies": {
    "@myapp/shared": "workspace:*",
    "@myapp/ui": "workspace:*"
  }
}
```

### Workspace Commands

```bash
# Install all workspace dependencies
bun install

# Run script in specific workspace
bun run --filter @myapp/web dev

# Run script in all workspaces
bun run --filter '*' build

# Add dependency to specific workspace
bun add react --filter @myapp/web
```

## Scripts

Run scripts from package.json:

```bash
# Run a script
bun run dev
bun run build

# Shorthand (if no conflict)
bun dev
bun build

# Run with arguments
bun run dev -- --port 3000

# List available scripts
bun run
```

## bunx - Execute Packages

Run packages without installing:

```bash
# Execute package
bunx vite

# Specific version
bunx vite@5.0.0

# From npm registry
bunx create-react-app my-app

# From GitHub
bunx github:user/repo
```

## Version Ranges

```json
{
  "dependencies": {
    "exact": "1.2.3",
    "caret": "^1.2.3",    // >=1.2.3 <2.0.0
    "tilde": "~1.2.3",    // >=1.2.3 <1.3.0
    "range": ">=1.0.0",
    "latest": "latest",
    "workspace": "workspace:*"
  }
}
```

## Overrides

Override transitive dependency versions:

```json
{
  "overrides": {
    "lodash": "4.17.21",
    "react": "^19.0.0"
  }
}
```

### Scoped Overrides

```json
{
  "overrides": {
    "some-package": {
      "lodash": "4.17.21"
    }
  }
}
```

## Private Registries

Configure in bunfig.toml:

```toml
[install.scopes]
"@mycompany" = { token = "$REGISTRY_TOKEN", url = "https://npm.mycompany.com/" }
```

Or with `.npmrc`:

```
@mycompany:registry=https://npm.mycompany.com/
//npm.mycompany.com/:_authToken=${REGISTRY_TOKEN}
```

## Cache

```bash
# Clear cache
bun pm cache rm

# View cache location
bun pm cache
```

## Trusted Dependencies

Control which packages can run install scripts:

```json
{
  "trustedDependencies": [
    "esbuild",
    "sharp"
  ]
}
```

## Comparison with npm/yarn/pnpm

| Feature | Bun | npm | yarn | pnpm |
|---------|-----|-----|------|------|
| Install speed | 30x faster | Baseline | 2-3x | 3-5x |
| Lockfile | Binary | JSON | YAML | YAML |
| Workspaces | Yes | Yes | Yes | Yes |
| Disk space | Standard | Standard | Standard | Hard links |
| Node compat | Full | Native | Full | Full |

## Fearnstack Monorepo Example

```json
// package.json (root)
{
  "name": "fearnstack-app",
  "private": true,
  "workspaces": ["packages/*", "apps/*"],
  "scripts": {
    "dev": "bun run --filter @app/server dev & bun run --filter @app/web dev",
    "build": "bun run --filter '*' build",
    "test": "bun test",
    "typecheck": "bun run --filter '*' typecheck"
  }
}
```

```
fearnstack-app/
├── package.json
├── bun.lockb
├── packages/
│   └── shared/
│       ├── package.json
│       └── src/
│           └── schemas/     # Shared Zod schemas
└── apps/
    ├── web/
    │   ├── package.json
    │   └── src/
    │       └── client/      # React frontend
    └── server/
        ├── package.json
        └── src/
            └── server/      # Hono backend
```

## Next Steps

- [Bun Runtime](bun-runtime.md) - Runtime features
- [Bun Bundler](bun-bundler.md) - Building applications
- [Bun Testing](bun-testing.md) - Test framework
