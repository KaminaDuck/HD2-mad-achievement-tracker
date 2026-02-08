---
title: "Bun Environment Variables"
description: "Read and configure environment variables in Bun with automatic .env file support"
type: "api-reference"
tags: ["bun", "environment-variables", "dotenv", "configuration", "runtime"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Environment Variables Documentation"
    url: "https://bun.sh/docs/runtime/environment-variables"
related:
  - "../README.md"
  - "./shell.md"
  - "./spawn.md"
author: "unknown"
contributors: []
---

# Bun Environment Variables

Bun reads your `.env` files automatically and provides idiomatic ways to read and write environment variables programmatically. ([Bun Docs][1])

## Setting Environment Variables

Bun reads the following files automatically (listed in order of increasing precedence):

1. `.env`
2. `.env.production`, `.env.development`, `.env.test` (depending on `NODE_ENV`)
3. `.env.local`

```env
# .env
FOO=hello
BAR=world
```

### Command Line

```bash
# Linux/macOS
FOO=helloworld bun run dev

# Cross-platform with bun shell
bun exec 'FOO=helloworld bun run dev'
```

On Windows, `package.json` scripts called with `bun run` automatically use bun shell, making this cross-platform:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development bun --watch app.ts"
  }
}
```

### Programmatically

```typescript
process.env.FOO = "hello";
```

## Manually Specifying .env Files

Use `--env-file` to override which specific `.env` file to load:

```bash
bun --env-file=.env.1 src/index.ts

bun --env-file=.env.abc --env-file=.env.def run build
```

## Disabling Automatic .env Loading

Use `--no-env-file` to disable automatic `.env` file loading:

```bash
bun run --no-env-file index.ts
```

Or configure in `bunfig.toml`:

```toml
# Disable loading .env files
env = false
```

Explicitly provided environment files via `--env-file` will still be loaded when default loading is disabled. ([Bun Docs][1])

## Quotation Marks

Bun supports double quotes, single quotes, and template literal backticks:

```env
FOO='hello'
FOO="hello"
FOO=`hello`
```

## Variable Expansion

Environment variables are automatically expanded using `$` syntax:

```env
FOO=world
BAR=hello$FOO
```

```typescript
process.env.BAR; // => "helloworld"
```

Useful for constructing connection strings:

```env
DB_USER=postgres
DB_PASSWORD=secret
DB_HOST=localhost
DB_PORT=5432
DB_URL=postgres://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME
```

Escape `$` with a backslash to disable expansion:

```env
BAR=hello\$FOO
```

```typescript
process.env.BAR; // => "hello$FOO"
```

**Note**: You typically don't need `dotenv` or `dotenv-expand` packages anymore. ([Bun Docs][1])

## Reading Environment Variables

Access environment variables via three equivalent methods:

```typescript
process.env.API_TOKEN;     // => "secret"
Bun.env.API_TOKEN;         // => "secret"
import.meta.env.API_TOKEN; // => "secret"
```

Print all environment variables for debugging:

```bash
bun --print process.env
```

## TypeScript Support

All properties of `process.env` are typed as `string | undefined`:

```typescript
Bun.env.whatever; // string | undefined
```

Use interface merging for autocompletion and non-optional typing:

```typescript
declare module "bun" {
  interface Env {
    AWESOME: string;
  }
}

process.env.AWESOME; // => string (not string | undefined)
```

## Configuring Bun Behavior

| Name | Description |
|------|-------------|
| `NODE_TLS_REJECT_UNAUTHORIZED` | Set to `0` to disable SSL certificate validation |
| `BUN_CONFIG_VERBOSE_FETCH` | Set to `curl` to log fetch requests with headers |
| `BUN_RUNTIME_TRANSPILER_CACHE_PATH` | Custom path for transpiler cache, or `0` to disable |
| `TMPDIR` | Directory for intermediate assets (default: `/tmp`) |
| `NO_COLOR` | Set to `1` to disable ANSI color output |
| `FORCE_COLOR` | Set to `1` to force ANSI color output |
| `BUN_CONFIG_MAX_HTTP_REQUESTS` | Max concurrent HTTP requests (default: 256) |
| `BUN_CONFIG_NO_CLEAR_TERMINAL_ON_RELOAD` | Set to `true` to keep console on watch reload |
| `DO_NOT_TRACK` | Set to `1` to disable crash reports and telemetry |
| `BUN_OPTIONS` | Prepend command-line arguments to any Bun execution |

## Runtime Transpiler Caching

For files larger than 50 KB, Bun caches transpiled output to speed up CLI startup. The cache is:

- Global and shared across all projects
- Safe to delete at any time (content-addressable)
- Stored in `$BUN_RUNTIME_TRANSPILER_CACHE_PATH` or platform cache directory

### Disable the Cache

```bash
BUN_RUNTIME_TRANSPILER_CACHE_PATH=0 bun run dev
```

Recommended to disable in ephemeral filesystems like Docker (Bun's Docker images do this automatically). ([Bun Docs][1])

### What It Caches

- Transpiled output of source files larger than 50 KB
- Sourcemaps for the transpiled output
- Files use `.pile` extension

---

[1]: https://bun.sh/docs/runtime/environment-variables "Bun Environment Variables Documentation"
