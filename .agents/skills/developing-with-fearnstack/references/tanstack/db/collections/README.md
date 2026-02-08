---
title: "TanStack DB Collections"
description: "Index of all TanStack DB collection types and integrations"
type: "meta"
tags: ["tanstack", "db", "collections", "index"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "TanStack DB Docs"
    url: "https://tanstack.com/db/latest/docs/collections"
related: ["../README.md", "../concepts.md", "../quick-start.md"]
parent_reference: "../README.md"
---

# TanStack DB Collections

Collections are the foundation of TanStack DB. They define how data is stored, synchronized, and persisted. Each collection type is optimized for different use cases and backend integrations.

## Collection Types

### Server-Synced Collections

| Collection | Package | Description |
|------------|---------|-------------|
| [Query Collection](./query/) | `@tanstack/query-db-collection` | TanStack Query integration for REST, GraphQL, tRPC |
| [Electric Collection](./electric/) | `@tanstack/electric-db-collection` | Real-time Postgres sync via ElectricSQL shapes |
| [PowerSync Collection](./powersync/) | `@tanstack/powersync-db-collection` | SQLite-based offline-first sync |
| [RxDB Collection](./rxdb/) | `@tanstack/rxdb-db-collection` | Local-first with multiple storage backends |
| [TrailBase Collection](./trailbase/) | `@tanstack/trailbase-db-collection` | TrailBase self-hosted backend sync |

### Local-Only Collections

| Collection | Package | Description |
|------------|---------|-------------|
| [LocalStorage Collection](./localstorage/) | Part of `@tanstack/react-db` | Browser localStorage with cross-tab sync |
| [LocalOnly Collection](./localonly/) | Part of `@tanstack/react-db` | In-memory state without persistence |

## Choosing a Collection Type

### Need server synchronization?

- **REST/GraphQL/tRPC APIs**: Use [Query Collection](./query/) - integrates with TanStack Query
- **Real-time Postgres**: Use [Electric Collection](./electric/) - ElectricSQL shapes
- **Offline-first SQLite**: Use [PowerSync Collection](./powersync/) - PowerSync backend
- **Multiple backends**: Use [RxDB Collection](./rxdb/) - CouchDB, GraphQL, WebRTC, REST
- **Self-hosted**: Use [TrailBase Collection](./trailbase/) - TrailBase backend

### Need local-only storage?

- **Persistent across sessions**: Use [LocalStorage Collection](./localstorage/)
- **Temporary UI state**: Use [LocalOnly Collection](./localonly/)

## Common Patterns

All collections share common patterns:

```typescript
import { createCollection } from '@tanstack/react-db'

const collection = createCollection(
  collectionOptions({
    id: 'my-collection',
    getKey: (item) => item.id,
    schema: mySchema, // Optional validation
  })
)

// Mutations
collection.insert({ id: '1', name: 'Item' })
collection.update('1', (draft) => { draft.name = 'Updated' })
collection.delete('1')
```

## Learn More

- [Core Concepts](../concepts.md) - Optimistic mutations, transactions, live queries
- [Quick Start](../quick-start.md) - Get started with TanStack DB
- [Framework Guides](../frameworks/) - React, Vue, and more
