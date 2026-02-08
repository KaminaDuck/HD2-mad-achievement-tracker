---
title: "bunx"
description: "Run packages from npm - Bun's equivalent of npx, 100x faster"
type: "api-reference"
tags: ["bun", "bunx", "npx", "package-runner", "cli-tools"]
category: "typescript"
subcategory: "package-manager"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bunx Documentation"
    url: "https://bun.sh/docs/pm/bunx"
related:
  - "../README.md"
  - "./install.md"
  - "./add.md"
author: "unknown"
contributors: []
---

# bunx

`bunx` auto-installs and runs packages from npm. It's Bun's equivalent of `npx` or `yarn dlx`, but **~100x faster** for locally installed packages. ([Bun Docs][1])

## Basic Usage

```bash
bunx cowsay "Hello world!"
```

`bunx` is an alias for `bun x` and is auto-installed with Bun.

## How It Works

Packages can declare executables in their `package.json`:

```json
{
  "name": "my-cli",
  "bin": {
    "my-cli": "dist/index.js"
  }
}
```

When you run `bunx my-cli`:
1. Checks for locally installed package in `node_modules`
2. If not found, auto-installs from npm
3. Runs the executable
4. Caches installed packages in Bun's global cache

## Arguments and Flags

Pass arguments after the package name:

```bash
bunx my-cli --foo bar
```

## Shebangs

By default, Bun respects shebangs. If a file has `#!/usr/bin/env node`, Bun runs it with Node.js.

### Force Bun Runtime

Use `--bun` to run with Bun instead of Node.js:

```bash
bunx --bun my-cli
```

**Important**: `--bun` must come before the package name:

```bash
bunx --bun my-cli    # correct
bunx my-cli --bun    # wrong - passes --bun to my-cli
```

## Package Flag

When the binary name differs from the package name, use `--package` or `-p`:

```bash
bunx -p renovate renovate-config-validator
bunx --package @angular/cli ng new my-app
```

## Shebang in Your Scripts

To force Bun for your own scripts:

```javascript
#!/usr/bin/env bun

console.log("Hello world!");
```

## CLI Flags

| Flag | Description |
|------|-------------|
| `--bun` | Force running with Bun instead of Node.js |
| `-p`, `--package <pkg>` | Specify package when binary name differs |
| `--no-install` | Skip installation if not already installed |
| `--verbose` | Enable verbose output |
| `--silent` | Suppress installation output |

## Examples

```bash
# Run Prisma migrations
bunx prisma migrate

# Format with Prettier
bunx prettier foo.js

# Run specific version
bunx uglify-js@3.14.0 app.js

# Binary name differs from package name
bunx -p @angular/cli ng new my-app

# Force Bun runtime
bunx --bun vite dev
```

## Usage

```bash
bunx [flags] <package>[@version] [flags and arguments for the package]
```

---

[1]: https://bun.sh/docs/pm/bunx "Bunx Documentation"
