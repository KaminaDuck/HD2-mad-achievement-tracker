---
title: "bun add"
description: "Add packages to your project with Bun's fast package manager"
type: "api-reference"
tags: ["bun", "package-manager", "add", "dependencies", "npm"]
category: "typescript"
subcategory: "package-manager"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Add Documentation"
    url: "https://bun.sh/docs/pm/cli/add"
related:
  - "../README.md"
  - "./install.md"
  - "./bunx.md"
author: "unknown"
contributors: []
---

# bun add

Add packages to your project with Bun's fast package manager. ([Bun Docs][1])

## Basic Usage

```bash
bun add preact              # add to dependencies
bun add zod@3.20.0          # specific version
bun add zod@^3.0.0          # version range
bun add zod@latest          # latest version
```

## Dependency Types

### Dev Dependencies

```bash
bun add --dev @types/react
bun add -d @types/react      # alias
bun add -D @types/react      # alias
```

Adds to `"devDependencies"` in package.json.

### Optional Dependencies

```bash
bun add --optional lodash
```

Adds to `"optionalDependencies"` in package.json.

### Peer Dependencies

```bash
bun add --peer @types/bun
```

Adds to `"peerDependencies"` in package.json.

## Version Pinning

### Exact Version

```bash
bun add react --exact
bun add react -E          # alias
```

Without `--exact`:
```json
{ "react": "^18.2.0" }  // matches >= 18.2.0 < 19.0.0
```

With `--exact`:
```json
{ "react": "18.2.0" }   // matches exactly 18.2.0
```

## Global Installation

```bash
bun add --global cowsay
bun add -g cowsay         # alias
```

Does not modify project's package.json.

Configure global directories in `bunfig.toml`:

```toml
[install]
globalDir = "~/.bun/install/global"
globalBinDir = "~/.bun/bin"
```

## Trusted Dependencies

Bun doesn't run lifecycle scripts for installed dependencies by default.

To allow scripts for a package:

```json
{
  "trustedDependencies": ["my-trusted-package"]
}
```

Or use `--trust` flag:

```bash
bun add my-package --trust
```

## Git Dependencies

```bash
bun add git@github.com:moment/moment.git
```

Supported protocols:
- `github:user/repo`
- `git+https://github.com/user/repo.git`
- `git+ssh://github.com/user/repo.git`
- `git@github.com:user/repo.git`

Examples in package.json:

```json
{
  "dependencies": {
    "dayjs": "git+https://github.com/iamkun/dayjs.git",
    "lodash": "git+ssh://github.com/lodash/lodash.git#4.17.21",
    "moment": "git@github.com:moment/moment.git",
    "zod": "github:colinhacks/zod"
  }
}
```

## Tarball Dependencies

```bash
bun add zod@https://registry.npmjs.org/zod/-/zod-3.21.4.tgz
```

Results in:

```json
{
  "dependencies": {
    "zod": "https://registry.npmjs.org/zod/-/zod-3.21.4.tgz"
  }
}
```

## CLI Options

### Dependency Management

| Flag | Description |
|------|-------------|
| `--dev`, `-d`, `-D` | Add to devDependencies |
| `--optional` | Add to optionalDependencies |
| `--peer` | Add to peerDependencies |
| `--exact`, `-E` | Pin exact version |
| `--global`, `-g` | Install globally |
| `--production`, `-p` | Don't install devDependencies |
| `--omit <type>` | Exclude dev/optional/peer |
| `--only-missing` | Only add if not present |

### Lockfile Control

| Flag | Description |
|------|-------------|
| `--yarn`, `-y` | Write yarn.lock (v1) |
| `--no-save` | Don't update package.json or lockfile |
| `--save` | Save to package.json (default: true) |
| `--frozen-lockfile` | Disallow lockfile changes |
| `--save-text-lockfile` | Save text-based lockfile |
| `--lockfile-only` | Generate lockfile without installing |
| `--trust` | Add to trustedDependencies |

### Installation Control

| Flag | Description |
|------|-------------|
| `--dry-run` | Don't install anything |
| `--force`, `-f` | Reinstall all dependencies |
| `--no-verify` | Skip integrity verification |
| `--ignore-scripts` | Skip lifecycle scripts |
| `--analyze`, `-a` | Analyze dependencies recursively |

### Network & Registry

| Flag | Description |
|------|-------------|
| `--registry <url>` | Use specific registry |
| `--ca <cert>` | CA signing certificate |
| `--cafile <path>` | CA certificate file path |
| `--network-concurrency <n>` | Max concurrent requests (default: 48) |

### Performance

| Flag | Description |
|------|-------------|
| `--backend <type>` | `clonefile`, `hardlink`, `symlink`, `copyfile` |
| `--concurrent-scripts <n>` | Max concurrent lifecycle scripts (default: 5) |

### Caching

| Flag | Description |
|------|-------------|
| `--cache-dir <path>` | Custom cache directory |
| `--no-cache` | Ignore manifest cache |

### Output

| Flag | Description |
|------|-------------|
| `--silent` | No logging |
| `--verbose` | Debug logging |
| `--no-progress` | Disable progress bar |
| `--no-summary` | Don't print summary |

### Configuration

| Flag | Description |
|------|-------------|
| `--config`, `-c` | Path to bunfig.toml |
| `--cwd` | Set working directory |

---

[1]: https://bun.sh/docs/pm/cli/add "Bun Add Documentation"
