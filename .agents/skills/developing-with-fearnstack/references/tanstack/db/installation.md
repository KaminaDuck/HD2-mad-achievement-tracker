---
title: "TanStack DB Installation"
description: "Install TanStack DB for React, Vue, Angular, Solid, Svelte or Vanilla JS"
type: "concept-guide"
tags: ["tanstack", "db", "typescript", "installation", "react", "vue", "angular", "solid", "svelte"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "TanStack DB Installation Guide"
    url: "https://tanstack.com/db/latest/docs/installation"
  - name: "TanStack DB Official Docs"
    url: "https://tanstack.com/db/latest"
related: ["./quick-start.md", "./overview.md", "./collections/query/guide.md"]
author: "unknown"
contributors: []
---

# Installation

Each supported framework comes with its own package. Each framework package re-exports everything from the core `@tanstack/db` package. ([Installation Guide][1])

## Framework Packages

### React

```bash
npm install @tanstack/react-db
```

TanStack DB is compatible with React v16.8+

### Vue

```bash
npm install @tanstack/vue-db
```

TanStack DB is compatible with Vue v3.3.0+

### Angular

```bash
npm install @tanstack/angular-db
```

TanStack DB is compatible with Angular v16.0.0+

### Solid

```bash
npm install @tanstack/solid-db
```

### Svelte

```bash
npm install @tanstack/svelte-db
```

### Vanilla JS

```bash
npm install @tanstack/db
```

Install the core `@tanstack/db` package to use DB without a framework.

## Collection Packages

TanStack DB provides specialized collection packages for different data sources and storage needs. ([Installation Guide][1])

### Query Collection

For loading data using TanStack Query:

```bash
npm install @tanstack/query-db-collection
```

Use `queryCollectionOptions` to fetch data into collections using TanStack Query. This is perfect for REST APIs and existing TanStack Query setups.

### Local Collections

Local storage and in-memory collections are included with the framework packages:

- **LocalStorageCollection** - For persistent local data that syncs across browser tabs
- **LocalOnlyCollection** - For temporary in-memory data and UI state

Both use `localStorageCollectionOptions` and `localOnlyCollectionOptions` respectively, available from your framework package (e.g., `@tanstack/react-db`).

> **Note:** LocalStorageCollections auto-hydrate from localStorage on creation. Don't insert default records during app initialization - it races with hydration and overwrites persisted data. Insert default records lazily (on first mutation), not eagerly (on app startup).

## Sync Engines

### Electric Collection

For real-time sync with [ElectricSQL](https://electric-sql.com/):

```bash
npm install @tanstack/electric-db-collection
```

Use `electricCollectionOptions` to sync data from Postgres databases through ElectricSQL shapes. Ideal for real-time, local-first applications.

### TrailBase Collection

For syncing with [TrailBase](https://trailbase.io/) backends:

```bash
npm install @tanstack/trailbase-db-collection
```

Use `trailBaseCollectionOptions` to sync records from TrailBase's Record APIs with built-in subscription support.

### RxDB Collection

For offline-first apps and local persistence with [RxDB](https://rxdb.info/):

```bash
npm install @tanstack/rxdb-db-collection
```

Use `rxdbCollectionOptions` to bridge an [RxDB collection](https://rxdb.info/rx-collection.html) into TanStack DB. This gives you reactive TanStack DB collections backed by RxDB's powerful local-first database, replication, and conflict handling features.

### PowerSync Collection

For real-time sync with [PowerSync](https://www.powersync.com/):

```bash
npm install @tanstack/powersync-db-collection
```

Use `powerSyncCollectionOptions` to sync data with PowerSync's real-time sync engine.

## Quick Start Examples

### React with Query Collection

```tsx
import { createCollection, useLiveQuery } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient()

const todoCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(r => r.json()),
    getKey: (item) => item.id,
  })
)

function App() {
  const { data } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
  )
  return <div>{data?.map(t => <div key={t.id}>{t.text}</div>)}</div>
}
```

### React with LocalStorage Collection

```tsx
import { createCollection, useLiveQuery, localStorageCollectionOptions } from '@tanstack/react-db'

const settingsCollection = createCollection(
  localStorageCollectionOptions({
    name: 'user-settings',
    getKey: (item) => item.id,
  })
)

function Settings() {
  const { data } = useLiveQuery((q) =>
    q.from({ setting: settingsCollection })
  )

  const updateSetting = (key: string, value: any) => {
    settingsCollection.update(key, (draft) => {
      draft.value = value
    })
  }

  return <div>{/* Settings UI */}</div>
}
```

## Package Summary

| Package | Description |
|---------|-------------|
| `@tanstack/react-db` | React bindings + core |
| `@tanstack/vue-db` | Vue bindings + core |
| `@tanstack/angular-db` | Angular bindings + core |
| `@tanstack/solid-db` | Solid bindings + core |
| `@tanstack/svelte-db` | Svelte bindings + core |
| `@tanstack/db` | Core package (vanilla JS) |
| `@tanstack/query-db-collection` | TanStack Query integration |
| `@tanstack/electric-db-collection` | ElectricSQL sync |
| `@tanstack/trailbase-db-collection` | TrailBase sync |
| `@tanstack/rxdb-db-collection` | RxDB integration |
| `@tanstack/powersync-db-collection` | PowerSync sync |

## References

[1]: https://github.com/TanStack/db/blob/main/docs/installation.md "TanStack DB Installation Guide"
