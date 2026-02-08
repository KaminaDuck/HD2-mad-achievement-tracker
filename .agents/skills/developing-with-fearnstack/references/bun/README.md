---
title: "Bun Runtime & Toolkit"
description: "All-in-one JavaScript/TypeScript runtime, package manager, bundler, and test runner"
type: "framework-guide"
tags: ["bun", "typescript", "javascript", "runtime", "package-manager", "bundler", "test-runner", "nodejs-alternative"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Official Documentation"
    url: "https://bun.sh/docs"
  - name: "Bun GitHub"
    url: "https://github.com/oven-sh/bun"
related:
  - "./runtime/environment-variables.md"
  - "./runtime/file-io.md"
  - "./package-manager/install.md"
  - "./http/server.md"
  - "./database/sqlite.md"
  - "./bundler/overview.md"
  - "./test/overview.md"
author: "unknown"
contributors: []
version_log: "./bun-versions.md"
---

# Bun Runtime & Toolkit Reference

Bun is an all-in-one toolkit for JavaScript and TypeScript apps. It ships as a single executable called `bun` and includes a runtime, package manager, test runner, and bundler. ([Bun Docs][1])

## Key Features

- **Speed**: Bun processes start 4x faster than Node.js, powered by JavaScriptCore engine ([Bun Docs][1])
- **TypeScript & JSX**: Execute `.jsx`, `.ts`, and `.tsx` files directly without configuration ([Bun Docs][1])
- **ESM & CommonJS**: Supports ES modules (recommended) and CommonJS for npm compatibility ([Bun Docs][1])
- **Web Standards**: Implements standard Web APIs like `fetch`, `WebSocket`, `ReadableStream` ([Bun Docs][1])
- **Node.js Compatibility**: Drop-in replacement with support for Node.js globals and modules ([Bun Docs][1])

## Quick Start

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Run a TypeScript file
bun run index.tsx

# Run package.json scripts
bun run start

# Install packages
bun install <pkg>

# Bundle for browsers
bun build ./index.tsx

# Run tests
bun test

# Execute a package
bunx cowsay 'Hello, world!'
```

## What's Inside

| Component | Description | Command |
|-----------|-------------|---------|
| [Runtime](./runtime/) | Execute JavaScript/TypeScript with near-zero overhead | `bun run` |
| [Package Manager](./package-manager/) | Fast installs, workspaces, overrides, audits | `bun install` |
| [Bundler](./bundler/) | Native bundling for JS/TS/JSX with splitting and plugins | `bun build` |
| [Test Runner](./test/) | Jest-compatible tests with snapshots and DOM support | `bun test` |

## Documentation Structure

### Runtime
- [Environment Variables](./runtime/environment-variables.md) - Configure and access env vars with `.env` support
- [File I/O](./runtime/file-io.md) - High-performance file operations with `Bun.file` and `Bun.write`
- [Streams](./runtime/streams.md) - Working with binary data streams
- [Binary Data](./runtime/binary-data.md) - ArrayBuffer, TypedArrays, and Buffer handling
- [Workers](./runtime/workers.md) - Multi-threaded JavaScript execution
- [Shell](./runtime/shell.md) - Cross-platform shell scripting with JavaScript interop
- [Spawn](./runtime/spawn.md) - Child process management and IPC
- [Globals](./runtime/globals.md) - Built-in global variables and functions

### Package Manager
- [bun install](./package-manager/install.md) - Install dependencies up to 30x faster than npm
- [bun add](./package-manager/add.md) - Add packages to your project
- [bunx](./package-manager/bunx.md) - Execute npm packages without installing
- [Workspaces](./package-manager/workspaces.md) - Monorepo support
- [Lockfile](./package-manager/lockfile.md) - Binary lockfile format

### Database Integrations
- [SQLite](./database/sqlite.md) - Built-in SQLite with `bun:sqlite`
- [SQL](./database/sql.md) - PostgreSQL/MySQL client
- [Redis](./database/redis.md) - Native Redis client

### HTTP & Networking
- [Server](./http/server.md) - High-performance HTTP server with `Bun.serve`
- [WebSockets](./http/websockets.md) - Server-side WebSocket support
- [Routing](./http/routing.md) - URL routing and path parameters
- [Fetch](./http/fetch.md) - HTTP client with proxy support
- [TCP/UDP](./http/tcp-udp.md) - Low-level networking APIs

### Bundler
- [Overview](./bundler/overview.md) - Native bundling for JS/TS/JSX
- [HTML & Static Sites](./bundler/html-static.md) - Build static sites with zero config
- [Single-file Executables](./bundler/executables.md) - Compile to standalone binaries

### Test Runner
- [Overview](./test/overview.md) - Jest-compatible test framework
- [Writing Tests](./test/writing-tests.md) - Test syntax and assertions
- [Mocks](./test/mocks.md) - Mock functions and modules

## Design Goals

Bun is designed from the ground-up with today's JavaScript ecosystem in mind:

1. **Speed** - 4x faster process startup than Node.js
2. **TypeScript & JSX** - First-class support without configuration
3. **ESM & CommonJS** - Seamless interoperability
4. **Web Standards** - Native implementation of Web APIs
5. **Node.js Compatibility** - Drop-in replacement for most projects

## What is a Runtime?

JavaScript is a specification for a programming language. JavaScript _engines_ (like V8 or JavaScriptCore) execute valid JavaScript programs. _Runtimes_ extend engines with additional APIs for real-world tasks. ([Bun Docs][1])

- **Browsers**: Ship runtimes with Web APIs exposed via `window`
- **Node.js**: Server-side runtime with globals like `Buffer`, `process`, and modules like `fs`, `http`
- **Bun**: Faster, leaner replacement for Node.js with the same APIs plus extras

## Version Information

See [bun-versions.md](./bun-versions.md) for version history and changelog.

---

**Source**: [bun.sh/docs](https://bun.sh/docs) | **GitHub**: [oven-sh/bun](https://github.com/oven-sh/bun)

[1]: https://bun.sh/docs "Bun Official Documentation"
