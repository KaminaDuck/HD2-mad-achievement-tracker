---
title: "Bun Lockfile"
description: "Bun's lockfile format and configuration"
type: "concept-guide"
tags: ["bun", "lockfile", "bun.lock", "package-manager", "reproducible-builds"]
category: "typescript"
subcategory: "package-manager"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Lockfile Documentation"
    url: "https://bun.sh/docs/pm/lockfile"
related:
  - "../README.md"
  - "./install.md"
  - "./workspaces.md"
author: "unknown"
contributors: []
---

# Bun Lockfile

Running `bun install` creates a lockfile called `bun.lock`. ([Bun Docs][1])

## Should It Be Committed?

**Yes.** The lockfile should be committed to git for reproducible builds.

## Generate Without Installing

Generate a lockfile without installing to `node_modules`:

```bash
bun install --lockfile-only
```

This still populates the global cache with registry metadata and git/tarball dependencies.

## Opt Out

Install without creating a lockfile:

```bash
bun install --no-save
```

## Yarn Lockfile

Generate a Yarn v1 lockfile in addition to `bun.lock`:

```bash
bun install --yarn
```

Or configure in `bunfig.toml`:

```toml
[install]
yarn = true
```

## Text-Based Lockfile

Bun v1.2 changed the default lockfile format from binary (`bun.lockb`) to text-based (`bun.lock`).

### Migrate from Binary

```bash
bun install --save-text-lockfile --frozen-lockfile --lockfile-only
rm bun.lockb
```

## Automatic Lockfile Migration

When no `bun.lock` exists, Bun automatically migrates from:

- `yarn.lock` (v1)
- `package-lock.json` (npm)
- `pnpm-lock.yaml` (pnpm)

The original lockfile is preserved and can be removed after verification.

## Frozen Lockfile

For reproducible builds (CI/CD), use frozen lockfile:

```bash
bun install --frozen-lockfile
# or
bun ci
```

This fails if `package.json` doesn't match the lockfile.

## Configuration

### bunfig.toml

```toml
[install]
frozenLockfile = false     # --frozen-lockfile
saveTextLockfile = true    # --save-text-lockfile
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BUN_CONFIG_SKIP_SAVE_LOCKFILE` | Don't save lockfile |
| `BUN_CONFIG_SKIP_LOAD_LOCKFILE` | Don't load lockfile |
| `BUN_CONFIG_YARN_LOCKFILE` | Save yarn.lock |

---

[1]: https://bun.sh/docs/pm/lockfile "Bun Lockfile Documentation"
