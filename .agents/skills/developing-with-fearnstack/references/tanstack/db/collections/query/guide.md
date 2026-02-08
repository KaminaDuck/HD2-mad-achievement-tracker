---
title: "Query Collection"
description: "Integration between TanStack DB and TanStack Query for automatic sync"
type: "integration-guide"
tags: ["tanstack", "db", "query-collection", "tanstack-query", "sync", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "Query Collection Docs"
    url: "https://tanstack.com/db/latest/docs/collections/query-collection"
  - name: "TanStack Query Docs"
    url: "https://tanstack.com/query/latest"
related: ["../electric/guide.md", "../localstorage/guide.md", "../../concepts.md", "../../frameworks/react/guide.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Query Collection

Query collections provide seamless integration between TanStack DB and TanStack Query, enabling automatic synchronization between your local database and remote data sources. ([Query Collection Docs][1])

## Overview

The `@tanstack/query-db-collection` package allows you to create collections that: ([Query Collection Docs][1])

- Automatically fetch remote data via TanStack Query
- Support optimistic updates with automatic rollback on errors
- Handle persistence through customizable mutation handlers
- Provide direct write capabilities for directly writing to the sync store

## Installation

```bash
npm install @tanstack/query-db-collection @tanstack/query-core @tanstack/db
```

## Basic Usage

```typescript
import { QueryClient } from "@tanstack/query-core"
import { createCollection } from "@tanstack/db"
import { queryCollectionOptions } from "@tanstack/query-db-collection"

const queryClient = new QueryClient()

const todosCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await fetch("/api/todos")
      return response.json()
    },
    queryClient,
    getKey: (item) => item.id,
  })
)
```

## Configuration Options

The `queryCollectionOptions` function accepts the following options: ([Query Collection Docs][1])

### Required Options

- `queryKey`: The query key for TanStack Query
- `queryFn`: Function that fetches data from the server
- `queryClient`: TanStack Query client instance
- `getKey`: Function to extract the unique key from an item

### Query Options

- `select`: Function to extract array items when wrapped with metadata
- `enabled`: Whether the query should automatically run (default: `true`)
- `refetchInterval`: Refetch interval in milliseconds (default: `0`)
- `retry`: Retry configuration for failed queries
- `retryDelay`: Delay between retries
- `staleTime`: How long data is considered fresh
- `meta`: Optional metadata passed to the query function context

### Collection Options

- `id`: Unique identifier for the collection
- `schema`: Schema for validating items
- `sync`: Custom sync configuration
- `startSync`: Whether to start syncing immediately (default: `true`)

### Persistence Handlers

- `onInsert`: Handler called before insert operations
- `onUpdate`: Handler called before update operations
- `onDelete`: Handler called before delete operations

## Persistence Handlers

Define handlers that are called when mutations occur. These handlers persist changes to your backend and control refetch behavior:

```typescript
const todosCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    queryClient,
    getKey: (item) => item.id,

    onInsert: async ({ transaction }) => {
      const newItems = transaction.mutations.map((m) => m.modified)
      await api.createTodos(newItems)
      // Return { refetch: false } to skip automatic refetch
    },

    onUpdate: async ({ transaction }) => {
      const updates = transaction.mutations.map((m) => ({
        id: m.key,
        changes: m.changes,
      }))
      await api.updateTodos(updates)
    },

    onDelete: async ({ transaction }) => {
      const ids = transaction.mutations.map((m) => m.key)
      await api.deleteTodos(ids)
    },
  })
)
```

### Controlling Refetch Behavior

By default, after persistence handlers complete successfully, the query refetches. Control this by returning `{ refetch: false }`:

```typescript
onInsert: async ({ transaction }) => {
  await api.createTodos(transaction.mutations.map((m) => m.modified))
  return { refetch: false } // Skip automatic refetch
}
```

## Direct Writes

Direct writes bypass the optimistic update system and write directly to the synced data store. ([Query Collection Docs][1])

### Understanding the Data Stores

Query Collections maintain two data stores: ([Query Collection Docs][1])

1. **Synced Data Store** - Authoritative state synchronized with the server via `queryFn`
2. **Optimistic Mutations Store** - Temporary changes applied optimistically before server confirmation

### When to Use Direct Writes

- Sync real-time updates from WebSockets or server-sent events
- Handle large datasets where refetching is expensive
- Receive incremental updates or server-computed field updates
- Implement complex pagination or partial data loading

### Individual Write Operations

```typescript
// Insert directly to synced data store
todosCollection.utils.writeInsert({
  id: "1",
  text: "Buy milk",
  completed: false,
})

// Update in synced data store
todosCollection.utils.writeUpdate({ id: "1", completed: true })

// Delete from synced data store
todosCollection.utils.writeDelete("1")

// Upsert (insert or update)
todosCollection.utils.writeUpsert({
  id: "1",
  text: "Buy milk",
  completed: false,
})
```

### Batch Operations

```typescript
todosCollection.utils.writeBatch(() => {
  todosCollection.utils.writeInsert({ id: "1", text: "Buy milk" })
  todosCollection.utils.writeInsert({ id: "2", text: "Walk dog" })
  todosCollection.utils.writeUpdate({ id: "3", completed: true })
  todosCollection.utils.writeDelete("4")
})
```

### WebSocket Integration Example

```typescript
ws.on("todos:update", (changes) => {
  todosCollection.utils.writeBatch(() => {
    changes.forEach((change) => {
      switch (change.type) {
        case "insert":
          todosCollection.utils.writeInsert(change.data)
          break
        case "update":
          todosCollection.utils.writeUpdate(change.data)
          break
        case "delete":
          todosCollection.utils.writeDelete(change.id)
          break
      }
    })
  })
})
```

## Important Behaviors

### Full State Sync

The query collection treats the `queryFn` result as the **complete state** of the collection: ([Query Collection Docs][1])

- Items in collection but not in query result will be deleted
- Items in query result but not in collection will be inserted
- Items present in both will be updated if they differ

### Empty Array Behavior

When `queryFn` returns an empty array, **all items will be deleted**:

```typescript
// This deletes all items in the collection
queryFn: async () => []
```

### Handling Partial/Incremental Fetches

Merge new data with existing data for incremental updates:

```typescript
queryFn: async ({ queryKey }) => {
  const existingData = queryClient.getQueryData(queryKey) || []
  const lastSyncTime = localStorage.getItem("todos-last-sync")
  const newData = await fetch(`/api/todos?since=${lastSyncTime}`).then((r) =>
    r.json()
  )

  const existingMap = new Map(existingData.map((item) => [item.id, item]))
  newData.forEach((item) => existingMap.set(item.id, item))

  if (newData.deletions) {
    newData.deletions.forEach((id) => existingMap.delete(id))
  }

  localStorage.setItem("todos-last-sync", new Date().toISOString())
  return Array.from(existingMap.values())
}
```

## Predicate Push-Down (On-Demand Mode)

With `syncMode: 'on-demand'`, query predicates are pushed down to your `queryFn`: ([Query Collection Docs][1])

```typescript
import { parseLoadSubsetOptions } from "@tanstack/query-db-collection"

const productsCollection = createCollection(
  queryCollectionOptions({
    id: "products",
    queryKey: ["products"],
    queryClient,
    getKey: (item) => item.id,
    syncMode: "on-demand",

    queryFn: async (ctx) => {
      const { limit, offset, where, orderBy } = ctx.meta.loadSubsetOptions
      const parsed = parseLoadSubsetOptions({ where, orderBy, limit })

      const params = new URLSearchParams()
      parsed.filters.forEach(({ field, operator, value }) => {
        const fieldName = field.join(".")
        if (operator === "eq") params.set(fieldName, String(value))
        else if (operator === "lt") params.set(`${fieldName}_lt`, String(value))
      })

      if (parsed.sorts.length > 0) {
        params.set(
          "sort",
          parsed.sorts.map((s) => `${s.field.join(".")}:${s.direction}`).join(",")
        )
      }

      if (parsed.limit) params.set("limit", String(parsed.limit))
      if (offset) params.set("offset", String(offset))

      return fetch(`/api/products?${params}`).then((r) => r.json())
    },
  })
)
```

## Expression Helpers

```typescript
import {
  parseWhereExpression,
  parseOrderByExpression,
  extractSimpleComparisons,
  parseLoadSubsetOptions,
} from "@tanstack/db"
```

### parseLoadSubsetOptions(options)

Convenience function that parses all LoadSubsetOptions:

```typescript
const { filters, sorts, limit, offset } = parseLoadSubsetOptions(
  ctx.meta?.loadSubsetOptions
)
```

### Supported Operators

- `eq` - Equality (=)
- `gt` - Greater than (>)
- `gte` - Greater than or equal (>=)
- `lt` - Less than (<)
- `lte` - Less than or equal (<=)
- `and` - Logical AND
- `or` - Logical OR
- `in` - IN clause

## Extending Meta with Custom Properties

Extend the meta type using TypeScript module augmentation:

```typescript
// types.d.ts
declare module "@tanstack/query-db-collection" {
  interface QueryCollectionMeta {
    userId?: string
    includeDeleted?: boolean
    authToken?: string
  }
}
```

Use in your collection:

```typescript
const collection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos"],
    queryFn: async (ctx) => {
      const { loadSubsetOptions, userId } = ctx.meta
      return api.getTodos({ ...parseLoadSubsetOptions(loadSubsetOptions), userId })
    },
    queryClient,
    getKey: (item) => item.id,
    meta: { userId: "user-123" },
  })
)
```

## Complete Direct Write API Reference

All methods available on `collection.utils`: ([Query Collection Docs][1])

- `writeInsert(data)`: Insert items directly
- `writeUpdate(data)`: Update items directly
- `writeDelete(keys)`: Delete items directly
- `writeUpsert(data)`: Insert or update items directly
- `writeBatch(callback)`: Perform multiple operations atomically
- `refetch(opts?)`: Manually trigger a refetch

## References

[1]: https://github.com/TanStack/db/blob/main/docs/collections/query-collection.md "TanStack DB Query Collection Documentation"
