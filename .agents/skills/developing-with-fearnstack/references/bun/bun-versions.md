---
title: "Bun Version History"
description: "Version history and changelog for Bun runtime, package manager, bundler, and test runner"
type: "version-log"
tags: ["bun", "versions", "changelog", "releases"]
category: "typescript"
subcategory: "versions"
version: "1.0"
current_version: "1.3.5"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Releases"
    url: "https://github.com/oven-sh/bun/releases"
  - name: "Bun Blog"
    url: "https://bun.sh/blog"
related:
  - "./README.md"
author: "unknown"
contributors: []
---

# Bun Version History

This document tracks major Bun releases and their key features.

## Current Version

**Bun v1.3.5** (December 17, 2025)

## Version Timeline

### Bun 1.3 (October 2025)

**Release:** v1.3.0 - October 10, 2025
**Latest:** v1.3.5 - December 17, 2025

See [Bun 1.3 announcement](https://bun.com/1.3) for details.

### Bun 1.2 (2025)

**Major Features:**
- SQL API for PostgreSQL and MySQL (`Bun.sql()`)
- Redis client (`Bun.redis()`)
- Enhanced HTTP routing with `routes` option
- Improved bundler performance
- Better Windows support

### Bun 1.1 (2024)

**Major Features:**
- Windows native support (stable)
- Improved Node.js compatibility
- `Bun.serve()` enhancements
- Shell scripting (`Bun.$`)
- Cross-compilation for executables
- Watch mode improvements

### Bun 1.0 (September 2023)

**Production-ready release featuring:**
- Stable runtime API
- Complete package manager
- Built-in bundler
- Jest-compatible test runner
- TypeScript and JSX support
- Node.js compatibility layer

**Core APIs:**
- `Bun.serve()` - HTTP server
- `Bun.file()` - File I/O
- `Bun.spawn()` - Child processes
- `Bun.build()` - Bundler
- `bun:test` - Test runner
- `bun:sqlite` - SQLite database

### Pre-1.0 Development

**Bun 0.8 (August 2023)**
- Improved stability
- Bug fixes for 1.0 preparation

**Bun 0.7 (July 2023)**
- `Bun.$` shell API
- Worker threads improvements

**Bun 0.6 (May 2023)**
- Bundler improvements
- Test runner enhancements

**Bun 0.5 (February 2023)**
- Standalone executables
- Cross-compilation support

## Feature Matrix by Version

| Feature | 1.0 | 1.1 | 1.2 | 1.3 |
|---------|-----|-----|-----|-----|
| HTTP Server | ✅ | ✅ | ✅ | ✅ |
| WebSockets | ✅ | ✅ | ✅ | ✅ |
| File I/O | ✅ | ✅ | ✅ | ✅ |
| SQLite | ✅ | ✅ | ✅ | ✅ |
| PostgreSQL/MySQL | ❌ | ❌ | ✅ | ✅ |
| Redis | ❌ | ❌ | ✅ | ✅ |
| Bundler | ✅ | ✅ | ✅ | ✅ |
| Test Runner | ✅ | ✅ | ✅ | ✅ |
| Package Manager | ✅ | ✅ | ✅ | ✅ |
| Windows Support | Beta | ✅ | ✅ | ✅ |
| Shell API | ✅ | ✅ | ✅ | ✅ |
| Executables | ✅ | ✅ | ✅ | ✅ |
| HTML Bundling | ❌ | ✅ | ✅ | ✅ |
| Routes API | ❌ | ❌ | ✅ | ✅ |

## Recent Releases

| Version | Date | Blog Post |
|---------|------|-----------|
| v1.3.5 | Dec 17, 2025 | [Release Notes](https://bun.com/blog/bun-v1.3.5) |
| v1.3.4 | Dec 7, 2025 | [Release Notes](https://bun.com/blog/bun-v1.3.4) |
| v1.3.3 | Nov 21, 2025 | [Release Notes](https://bun.com/blog/bun-v1.3.3) |
| v1.3.2 | Nov 8, 2025 | [Release Notes](https://bun.com/blog/bun-v1.3.2) |
| v1.3.1 | Oct 22, 2025 | [Release Notes](https://bun.com/blog/bun-v1.3.1) |
| v1.3.0 | Oct 10, 2025 | [Bun 1.3](https://bun.com/1.3) |

## Upgrade Notes

### From 1.2 to 1.3

- See [Bun 1.3 announcement](https://bun.com/1.3) for details
- Check release notes for specific changes

### From 1.1 to 1.2

- New `Bun.sql()` API for PostgreSQL/MySQL
- New `Bun.redis()` client
- Enhanced `routes` option in `Bun.serve()`
- No breaking changes expected

### From 1.0 to 1.1

- Windows support stabilized
- Shell API (`Bun.$`) improvements
- Cross-compilation enhancements
- No breaking changes

### From 0.x to 1.0

- API stabilization
- Some experimental APIs removed or modified
- Check changelog for specific breaking changes

## Resources

- [GitHub Releases](https://github.com/oven-sh/bun/releases)
- [Bun Blog](https://bun.sh/blog)
- [Discord Community](https://bun.sh/discord)
- [Documentation](https://bun.sh/docs)
