---
title: "bun install"
description: "Install packages with Bun's fast package manager - 25x faster than npm"
type: "api-reference"
tags: ["bun", "package-manager", "install", "npm", "dependencies", "lockfile"]
category: "typescript"
subcategory: "package-manager"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Install Documentation"
    url: "https://bun.sh/docs/pm/cli/install"
related:
  - "../README.md"
  - "./add.md"
  - "./bunx.md"
author: "unknown"
contributors: []
---

# bun install

The `bun install` command installs all dependencies from your `package.json`. It's **25x faster** than npm. ([Bun Docs][1])

## Basic Usage

```bash
bun install                    # install all dependencies
bun install react              # install specific package
bun install react@19.1.1       # specific version
bun install react@latest       # specific tag
```

Running `bun install`:
- Installs `dependencies`, `devDependencies`, and `optionalDependencies`
- Installs `peerDependencies` by default
- Runs `{pre|post}install` and `{pre|post}prepare` scripts for your project
- Writes a `bun.lock` lockfile

## Logging

```bash
bun install --verbose  # debug logging
bun install --silent   # no logging
```

## Lifecycle Scripts

Bun does not execute lifecycle scripts (like `postinstall`) for installed dependencies by default for security reasons.

To allow scripts for specific packages, add to `trustedDependencies`:

```json
{
  "name": "my-app",
  "trustedDependencies": ["my-trusted-package"]
}
```

Control concurrent script execution:

```bash
bun install --concurrent-scripts 5
```

## Workspaces

```json
{
  "name": "my-app",
  "workspaces": ["packages/*"],
  "dependencies": {
    "preact": "^10.5.13"
  }
}
```

### Filter Specific Packages

```bash
bun install --filter '!pkg-c'          # exclude pkg-c
bun install --filter './packages/pkg-a' # only pkg-a
```

## Overrides and Resolutions

Control transitive dependency versions:

```json
{
  "dependencies": {
    "foo": "^2.0.0"
  },
  "overrides": {
    "bar": "~4.4.0"
  }
}
```

## Global Packages

```bash
bun install --global cowsay  # or -g
cowsay "Bun!"
```

## Production Mode

```bash
bun install --production       # without devDependencies
bun install --frozen-lockfile  # reproducible installs
```

## Omitting Dependencies

```bash
bun install --omit dev                           # exclude devDependencies
bun install --omit=dev --omit=peer --omit=optional  # only dependencies
```

## Dry Run

```bash
bun install --dry-run
```

## Non-npm Dependencies

```json
{
  "dependencies": {
    "dayjs": "git+https://github.com/iamkun/dayjs.git",
    "lodash": "git+ssh://github.com/lodash/lodash.git#4.17.21",
    "moment": "git@github.com:moment/moment.git",
    "zod": "github:colinhacks/zod",
    "react": "https://registry.npmjs.org/react/-/react-18.2.0.tgz"
  }
}
```

## Installation Strategies

### Hoisted (Traditional)

```bash
bun install --linker hoisted
```

Flattens dependencies into shared `node_modules`.

### Isolated (pnpm-like)

```bash
bun install --linker isolated
```

Creates strict dependency isolation preventing phantom dependencies. Uses `node_modules/.bun/` with symlinks.

### Defaults

| Project Type | Default Strategy |
|--------------|------------------|
| New workspaces/monorepos | `isolated` |
| New single-package projects | `hoisted` |
| Existing projects (pre-v1.3.2) | `hoisted` |

## Minimum Release Age

Protect against supply chain attacks:

```bash
bun add @types/bun --minimum-release-age 259200  # 3 days in seconds
```

Or in `bunfig.toml`:

```toml
[install]
minimumReleaseAge = 259200
minimumReleaseAgeExcludes = ["@types/node", "typescript"]
```

## Configuration

### bunfig.toml

```toml
[install]
optional = true              # install optionalDependencies
dev = true                   # install devDependencies
peer = true                  # install peerDependencies
production = false           # --production flag
frozenLockfile = false       # --frozen-lockfile flag
linker = "hoisted"           # "hoisted" or "isolated"
concurrentScripts = 16       # max concurrent lifecycle scripts
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `BUN_CONFIG_REGISTRY` | npm registry (default: registry.npmjs.org) |
| `BUN_CONFIG_YARN_LOCKFILE` | Save yarn.lock (v1 style) |
| `BUN_CONFIG_SKIP_SAVE_LOCKFILE` | Don't save lockfile |
| `BUN_CONFIG_SKIP_LOAD_LOCKFILE` | Don't load lockfile |

## CI/CD

Use `bun ci` for reproducible builds:

```bash
bun ci  # equivalent to bun install --frozen-lockfile
```

GitHub Actions example:

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: oven-sh/setup-bun@v2
  - run: bun ci
  - run: bun run build
```

## Platform-Specific Dependencies

Override target platform:

```bash
bun install --cpu=x64 --os=linux
```

**CPU values**: `arm64`, `x64`, `ia32`, `ppc64`, `s390x`
**OS values**: `linux`, `darwin`, `win32`, `freebsd`, `openbsd`, `sunos`, `aix`

## Platform-Specific Backends

| Platform | Default Backend |
|----------|-----------------|
| Linux | `hardlink` |
| macOS | `clonefile` |

Override with `--backend`:

```bash
bun install --backend hardlink
bun install --backend clonefile
bun install --backend copyfile
bun install --backend symlink
```

## Cache

```bash
bun pm cache rm            # delete cache
rm -rf ~/.bun/install/cache  # manual deletion
```

## pnpm Migration

Bun automatically migrates from pnpm when `pnpm-lock.yaml` exists and no `bun.lock`:

```bash
bun install  # auto-migrates
```

Migrates:
- Lockfile to `bun.lock` format
- Workspace configuration from `pnpm-workspace.yaml`
- Catalog dependencies
- Overrides and patched dependencies

## Key CLI Flags

| Flag | Description |
|------|-------------|
| `--production` | Don't install devDependencies |
| `--frozen-lockfile` | Disallow lockfile changes |
| `--dry-run` | Don't install anything |
| `--force` | Reinstall all dependencies |
| `--global` | Install globally |
| `--filter <pattern>` | Filter workspaces |
| `--backend <type>` | Installation backend |
| `--verbose` | Debug logging |
| `--silent` | No logging |
| `--ignore-scripts` | Skip lifecycle scripts |

---

[1]: https://bun.sh/docs/pm/cli/install "Bun Install Documentation"
