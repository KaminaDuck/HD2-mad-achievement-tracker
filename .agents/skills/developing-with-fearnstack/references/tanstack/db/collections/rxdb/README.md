---
title: "RxDB Collection"
description: "Package overview for @tanstack/rxdb-db-collection"
type: "meta"
tags: ["tanstack", "db", "rxdb-collection", "rxdb", "local-first", "offline"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "npm"
    url: "https://www.npmjs.com/package/@tanstack/rxdb-db-collection"
  - name: "GitHub"
    url: "https://github.com/TanStack/db/tree/main/packages/rxdb-db-collection"
related: ["./guide.md", "./versions.md", "../README.md"]
version_log: "./versions.md"
current_version: "0.1.48"
---

# RxDB Collection

**Package:** `@tanstack/rxdb-db-collection`
**Current Version:** 0.1.48

## Description

The RxDB Collection package provides offline-first local persistence with RxDB integration for TanStack DB. It enables automatic synchronization between TanStack DB collections and RxDB's reactive database, supporting multiple storage backends and replication plugins for comprehensive offline-first and sync scenarios.

## Key Features

- Offline-first local persistence with RxDB
- Multiple storage backends (LocalStorage, IndexedDB, SQLite, Memory)
- Replication plugins for syncing with CouchDB, GraphQL, WebRTC, REST APIs, Supabase, and more
- Reactive updates via RxDB change streams
- Cross-tab synchronization
- Optimistic mutations with rollback support

## Documentation

- [Integration Guide](./guide.md) - Complete setup and usage guide
- [Version History](./versions.md) - Changelog and version notes

## Installation

```bash
npm install @tanstack/rxdb-db-collection rxdb
```

## Quick Links

- [npm Package](https://www.npmjs.com/package/@tanstack/rxdb-db-collection)
- [GitHub Source](https://github.com/TanStack/db/tree/main/packages/rxdb-db-collection)
- [RxDB Official Docs](https://rxdb.info/)
