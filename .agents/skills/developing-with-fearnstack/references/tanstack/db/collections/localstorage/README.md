---
title: "LocalStorage Collection"
description: "Package overview for LocalStorage Collection (part of @tanstack/react-db)"
type: "meta"
tags: ["tanstack", "db", "localstorage-collection", "localstorage", "persistence", "cross-tab"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "npm"
    url: "https://www.npmjs.com/package/@tanstack/react-db"
  - name: "GitHub"
    url: "https://github.com/TanStack/db/tree/main/packages/react-db"
related: ["./guide.md", "./versions.md", "../README.md"]
version_log: "./versions.md"
current_version: "0.1.60"
---

# LocalStorage Collection

LocalStorage Collection is part of the core `@tanstack/react-db` package and is not published as a separate npm package.

## Package Information

| Property | Value |
|----------|-------|
| Package | `@tanstack/react-db` |
| Current Version | 0.1.60 |
| Collection Type | Built-in |

## Overview

LocalStorage Collection provides persistent local storage with cross-tab synchronization for TanStack DB. It enables storing small amounts of client-side data that persists across browser sessions and automatically syncs across browser tabs in real-time.

Key capabilities:

- **Persistent storage**: Data persists to localStorage (or sessionStorage) across browser sessions
- **Cross-tab synchronization**: Changes in one tab are automatically reflected in all other tabs via storage events
- **Custom storage backends**: Use any storage API that matches the localStorage interface
- **Schema validation**: Optional Standard Schema support (Zod, Effect, etc.) for client-side validation

## Installation

Since LocalStorage Collection is part of the core package, install `@tanstack/react-db`:

```bash
npm install @tanstack/react-db
```

## Documentation

- [LocalStorage Collection Guide](./guide.md) - Complete usage guide with examples
- [Version History](./versions.md) - Version log and changelog

## Related Documentation

- [Core Package Overview](../README.md)
- [LocalOnly Collection](../localonly/guide.md) - In-memory collections without persistence
- [Query Collection](../query/guide.md) - Server-synced collections with TanStack Query
