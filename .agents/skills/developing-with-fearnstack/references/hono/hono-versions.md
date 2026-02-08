---
title: "Hono Version Log"
description: "Version history and changelog for Hono web framework"
type: "meta"
tags: ["changelog", "versions", "hono", "web-framework", "typescript"]
category: "meta"
subcategory: "none"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono GitHub Releases"
    url: "https://github.com/honojs/hono/releases"
  - name: "Hono Documentation"
    url: "https://hono.dev/"
  - name: "Hono npm"
    url: "https://www.npmjs.com/package/hono"
related: []
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "4.6.x"
---

# Hono Version Log

**Current version documented:** 4.6.x
**Last checked:** 2025-12-26

[GitHub Releases](https://github.com/honojs/hono/releases) | [Documentation](https://hono.dev/) | [npm](https://www.npmjs.com/package/hono)

---

## About Hono

Hono is a small, simple, and ultrafast web framework built on Web Standards. It works on any JavaScript runtime including Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, Netlify, AWS Lambda, and Node.js.

---

## Current Major: v4.x

### v4.6.x (2024-2025)
Latest stable release series with continued improvements.
- **Continued:** Bug fixes and performance improvements
- **Enhanced:** TypeScript type inference
- **Improved:** RPC client performance

### v4.5.x (2024)
Feature and stability release.
- **New:** `parseResponse()` helper for RPC clients
- **New:** `cloneRawRequest()` for request cloning after body consumption
- **Enhanced:** Streaming helpers
- **Fixed:** Various edge case bugs

### v4.4.x (2024)
Stability and feature enhancements.
- **Improved:** WebSocket helper support across runtimes
- **Enhanced:** Middleware typing
- **Fixed:** Route helper deprecations

### v4.0.0 (2024) **BREAKING**
Major release with significant improvements.
- **New:** Improved type inference for RPC
- **New:** Better generic types for Hono class
- **New:** Enhanced middleware factory
- **Breaking:** Some type signature changes
- **Breaking:** Deprecated APIs removed

[Release Notes](https://github.com/honojs/hono/releases/tag/v4.0.0)

---

## Previous Major: v3.x

### v3.12.x (2023-2024)
Final v3.x release series.
- Mature API and stable types
- Full runtime support

### v3.0.0 (2023) **BREAKING**
Major release with improved architecture.
- **New:** Redesigned router system
- **New:** Better Cloudflare Workers support
- **New:** Enhanced middleware ecosystem
- **Breaking:** Router API changes

---

## Previous Major: v2.x

### v2.0.0 (2022) **BREAKING**
Significant framework evolution.
- **New:** Full TypeScript rewrite
- **New:** Multi-runtime support
- **Breaking:** API redesign from v1

---

## Key Features by Version

| Version | Key Features |
|---------|--------------|
| 4.x | Enhanced RPC, improved types, streaming helpers, `parseResponse()` |
| 3.x | Redesigned router, expanded middleware, mature ecosystem |
| 2.x | TypeScript rewrite, multi-runtime support |
| 1.x | Initial release, Cloudflare Workers focused |

---

## Installation

```bash
# Bun
bun add hono

# npm
npm install hono

# pnpm
pnpm add hono

# Deno
import { Hono } from 'https://deno.land/x/hono/mod.ts'
# or
import { Hono } from 'jsr:@hono/hono'
```

---

## Runtime Support

| Runtime | Status | Import |
|---------|--------|--------|
| Cloudflare Workers | Full | `hono` |
| Bun | Full | `hono` |
| Deno | Full | `jsr:@hono/hono` |
| Node.js | Full | `hono` (with adapter) |
| Fastly Compute | Full | `hono` |
| AWS Lambda | Full | `hono` (with adapter) |
| Vercel | Full | `hono` |
| Netlify | Full | `hono` |

---

## Migration Notes

### v3 to v4

- Check for deprecated API usage
- Update type generics if using custom Env types
- Review RPC client usage for new patterns

### v2 to v3

- Router API changes require updates
- Middleware registration patterns updated
- Check runtime-specific code

---

## Version Log Guidelines

1. **Current major**: Include all minor/patch versions with brief summaries
2. **Previous majors**: Include milestone releases
3. **Breaking changes**: Mark with `**BREAKING**`
4. **Dates**: Use ISO format (YYYY-MM-DD)
5. **Links**: Always link to official release notes
6. **Updates**: Check for new versions when updating the parent reference
