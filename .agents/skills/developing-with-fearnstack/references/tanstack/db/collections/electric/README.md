---
title: "Electric Collection"
description: "Package overview for @tanstack/electric-db-collection"
type: "meta"
tags: ["tanstack", "db", "electric-collection", "electricsql", "postgres", "sync"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "npm"
    url: "https://www.npmjs.com/package/@tanstack/electric-db-collection"
  - name: "GitHub"
    url: "https://github.com/TanStack/db/tree/main/packages/electric-db-collection"
related: ["./guide.md", "./versions.md", "../README.md"]
version_log: "./versions.md"
current_version: "0.2.19"
---

# Electric Collection

**Package:** `@tanstack/electric-db-collection`
**Current Version:** 0.2.19

Real-time Postgres synchronization via ElectricSQL shapes. This collection type enables seamless data sync between your Postgres database and TanStack DB using Electric's sync engine.

## Overview

The Electric Collection provides:

- **Real-time sync** - Automatic data synchronization from Postgres via Electric shapes
- **Optimistic updates** - Transaction matching with automatic rollback on errors
- **Persistence handlers** - Customizable mutation handlers for backend persistence
- **Txid matching** - PostgreSQL transaction ID-based synchronization

## Installation

```bash
npm install @tanstack/electric-db-collection @tanstack/react-db
```

## Quick Example

```typescript
import { createCollection } from '@tanstack/react-db'
import { electricCollectionOptions } from '@tanstack/electric-db-collection'

const todosCollection = createCollection(
  electricCollectionOptions({
    shapeOptions: {
      url: '/api/todos',
    },
    getKey: (item) => item.id,
  })
)
```

## Documentation

- [Integration Guide](./guide.md) - Complete guide with configuration options, persistence handlers, and optimistic updates
- [Version History](./versions.md) - Changelog and version details

## Related Collections

- [Query Collection](../query/) - TanStack Query integration for REST, GraphQL, tRPC
- [PowerSync Collection](../powersync/) - SQLite-based offline-first sync
- [Collections Overview](../README.md) - All available collection types
