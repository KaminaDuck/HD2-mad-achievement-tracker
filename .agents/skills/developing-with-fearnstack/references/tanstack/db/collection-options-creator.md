---
title: "Creating Collection Options Creators"
description: "Advanced guide for building custom sync engine integrations"
type: "concept-guide"
tags: ["tanstack", "db", "collection-options-creator", "custom-sync", "advanced", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "Collection Options Creator Guide"
    url: "https://tanstack.com/db/latest/docs/guides/collection-options-creator"
  - name: "TanStack DB Official Docs"
    url: "https://tanstack.com/db/latest"
related: ["./concepts.md", "./collections/query/guide.md", "./collections/electric/guide.md"]
author: "unknown"
contributors: []
---

# Creating a Collection Options Creator

A collection options creator is a factory function that generates configuration options for TanStack DB collections. It provides a standardized way to integrate different sync engines and data sources with TanStack DB's reactive sync-first architecture. ([Collection Options Creator Guide][1])

## Overview

Collection options creators follow a consistent pattern: ([Collection Options Creator Guide][1])

1. Accept configuration specific to the sync engine
2. Return an object that satisfies the CollectionConfig interface
3. Handle sync initialization, data parsing, and transaction management
4. Optionally provide utility functions specific to the sync engine

## When to Create a Custom Collection

You should create a custom collection when:

- You have a dedicated sync engine (like ElectricSQL, Trailbase, Firebase, RxDB or a custom WebSocket solution)
- You need specific sync behaviors that aren't covered by the query collection
- You want to integrate with a backend that has its own sync protocol

**Note**: If you're just hitting an API and returning data, use the query collection instead.

## Core Requirements

### 1. Configuration Interface

Define a configuration interface that extends or includes standard collection properties:

```typescript
// Pattern A: User provides handlers (Query / ElectricSQL style)
interface MyCollectionConfig<TItem extends object> {
  // Your sync engine specific options
  connectionUrl: string
  apiKey?: string

  // Standard collection properties
  id?: string
  schema?: StandardSchemaV1
  getKey: (item: TItem) => string | number
  sync?: SyncConfig<TItem>

  rowUpdateMode?: 'partial' | 'full'

  // User provides mutation handlers
  onInsert?: InsertMutationFn<TItem>
  onUpdate?: UpdateMutationFn<TItem>
  onDelete?: DeleteMutationFn<TItem>
}

// Pattern B: Built-in handlers (Trailbase style)
interface MyCollectionConfig<TItem extends object>
  extends Omit<CollectionConfig<TItem>, 'onInsert' | 'onUpdate' | 'onDelete'> {
  // Your sync engine specific options
  recordApi: MyRecordApi<TItem>
  connectionUrl: string

  rowUpdateMode?: 'partial' | 'full'

  // Note: onInsert/onUpdate/onDelete are implemented by your collection creator
}
```

### 2. Sync Implementation

The sync function is the heart of your collection. It must return a cleanup function for proper garbage collection:

```typescript
const sync: SyncConfig<T>['sync'] = (params) => {
  const { begin, write, commit, markReady, collection } = params

  // 1. Initialize connection to your sync engine
  const connection = initializeConnection(config)

  // 2. Set up real-time subscription FIRST (prevents race conditions)
  const eventBuffer: Array<any> = []
  let isInitialSyncComplete = false

  connection.subscribe((event) => {
    if (!isInitialSyncComplete) {
      // Buffer events during initial sync to prevent race conditions
      eventBuffer.push(event)
      return
    }

    // Process real-time events
    begin()

    switch (event.type) {
      case 'insert':
        write({ type: 'insert', value: event.data })
        break
      case 'update':
        write({ type: 'update', value: event.data })
        break
      case 'delete':
        write({ type: 'delete', value: event.data })
        break
    }

    commit()
  })

  // 3. Perform initial data fetch
  async function initialSync() {
    try {
      const data = await fetchInitialData()

      begin() // Start a transaction

      for (const item of data) {
        write({
          type: 'insert',
          value: item
        })
      }

      commit() // Commit the transaction

      // 4. Process buffered events
      isInitialSyncComplete = true
      if (eventBuffer.length > 0) {
        begin()
        for (const event of eventBuffer) {
          // Deduplicate if necessary based on your sync engine
          write({ type: event.type, value: event.data })
        }
        commit()
        eventBuffer.splice(0)
      }

    } catch (error) {
      console.error('Initial sync failed:', error)
      throw error
    } finally {
      // ALWAYS call markReady, even on error
      markReady()
    }
  }

  initialSync()

  // 4. Return cleanup function
  return () => {
    connection.close()
    // Clean up any timers, intervals, or other resources
  }
}
```

### 3. Transaction Lifecycle

The sync process follows this lifecycle: ([Collection Options Creator Guide][1])

1. **begin()** - Start collecting changes
2. **write()** - Add changes to the pending transaction (buffered until commit)
3. **commit()** - Apply all changes atomically to the collection state
4. **markReady()** - Signal that initial sync is complete

**Race Condition Prevention:**
Many sync engines start real-time subscriptions before the initial sync completes. Your implementation MUST deduplicate events that arrive via subscription that represent the same data as the initial sync. Consider:

- Starting the listener BEFORE initial fetch and buffering events
- Tracking timestamps, sequence numbers, or document versions
- Using read timestamps or other ordering mechanisms

### 4. Data Parsing and Type Conversion

If your sync engine returns data with different types, provide conversion functions for specific fields:

```typescript
interface MyCollectionConfig<TItem, TRecord> {
  // Only specify conversions for fields that need type conversion
  parse: {
    created_at: (ts: number) => new Date(ts * 1000),  // timestamp -> Date
    updated_at: (ts: number) => new Date(ts * 1000),  // timestamp -> Date
    metadata?: (str: string) => JSON.parse(str)       // JSON string -> object
  }

  serialize: {
    created_at: (date: Date) => Math.floor(date.valueOf() / 1000),  // Date -> timestamp
    updated_at: (date: Date) => Math.floor(date.valueOf() / 1000),  // Date -> timestamp
    metadata?: (obj: object) => JSON.stringify(obj)                 // object -> JSON string
  }
}
```

**Type Conversion Examples:**

```typescript
// Firebase Timestamp to Date
parse: {
  createdAt: (timestamp) => timestamp?.toDate?.() || new Date(timestamp),
  updatedAt: (timestamp) => timestamp?.toDate?.() || new Date(timestamp),
}

// PostGIS geometry to GeoJSON
parse: {
  location: (wkb: string) => parseWKBToGeoJSON(wkb)
}

// JSON string to object with error handling
parse: {
  metadata: (str: string) => {
    try {
      return JSON.parse(str)
    } catch {
      return {}
    }
  }
}
```

## Schemas and Type Transformations

When building a custom collection, you need to decide how to handle the relationship between your backend's storage format and the client-side types users work with in their collections.

### Two Separate Concerns

**Backend Format** - The types your storage layer uses (SQLite, Postgres, Firebase, etc.)
- Examples: Unix timestamps, ISO strings, JSON strings, PostGIS geometries

**Client Format** - The types users work with in their TanStack DB collections
- Examples: Date objects, parsed JSON, GeoJSON

Schemas in TanStack DB define the **client format** (TInput/TOutput for mutations). How you bridge between backend and client format depends on your integration design.

### Approach 1: Integration Provides Parse/Serialize Helpers

For backends with specific storage formats, provide parse/serialize options that users configure:

```typescript
// TrailBase example: User specifies field conversions
export function trailbaseCollectionOptions(config) {
  return {
    parse: config.parse,      // User provides field conversions
    serialize: config.serialize,

    onInsert: async ({ transaction }) => {
      const serialized = transaction.mutations.map(m =>
        serializeFields(m.modified, config.serialize)
      )
      await config.recordApi.createBulk(serialized)
    }
  }
}

// User explicitly configures conversions
const collection = createCollection(
  trailbaseCollectionOptions({
    schema: todoSchema,
    parse: {
      created_at: (ts: number) => new Date(ts * 1000)  // Unix -> Date
    },
    serialize: {
      created_at: (date: Date) => Math.floor(date.valueOf() / 1000)  // Date -> Unix
    }
  })
)
```

### Approach 2: User Handles Everything in QueryFn/Handlers

For simple APIs or when users want full control, they handle parsing/serialization themselves:

```typescript
// Query Collection: User handles all transformations
const collection = createCollection(
  queryCollectionOptions({
    schema: todoSchema,
    queryFn: async () => {
      const response = await fetch('/api/todos')
      const todos = await response.json()
      // User manually parses to match their schema's TOutput
      return todos.map(todo => ({
        ...todo,
        created_at: new Date(todo.created_at)  // ISO string -> Date
      }))
    },
    onInsert: async ({ transaction }) => {
      // User manually serializes for their backend
      await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify({
          ...transaction.mutations[0].modified,
          created_at: transaction.mutations[0].modified.created_at.toISOString()  // Date -> ISO string
        })
      })
    }
  })
)
```

### Approach 3: Automatic Serialization in Handlers

If your backend has well-defined types, you can automatically serialize in mutation handlers:

```typescript
export function myCollectionOptions(config) {
  return {
    onInsert: async ({ transaction }) => {
      // Automatically serialize known types for your backend
      const serialized = transaction.mutations.map(m => ({
        ...m.modified,
        // Date objects -> Unix timestamps for your backend
        created_at: m.modified.created_at instanceof Date
          ? Math.floor(m.modified.created_at.valueOf() / 1000)
          : m.modified.created_at
      }))
      await backend.insert(serialized)
    }
  }
}
```

### Key Design Principles

1. **Schemas validate client mutations only** - They don't affect how backend data is parsed during sync
2. **TOutput is the application-facing type** - This is what users work with in their app
3. **Choose your approach based on backend constraints** - Fixed types -> automatic serialization; varying types -> user configuration
4. **Document your backend format clearly** - Explain what types your storage uses and how to handle them

## Mutation Handler Patterns

There are two distinct patterns for handling mutations in collection options creators:

### Pattern A: User-Provided Handlers (ElectricSQL, Query)

The user provides mutation handlers in the config. Your collection creator passes them through:

```typescript
interface MyCollectionConfig<TItem extends object> {
  // User provides these handlers
  onInsert?: InsertMutationFn<TItem>
  onUpdate?: UpdateMutationFn<TItem>
  onDelete?: DeleteMutationFn<TItem>
}

export function myCollectionOptions<TItem extends object>(
  config: MyCollectionConfig<TItem>
) {
  return {
    rowUpdateMode: config.rowUpdateMode || 'partial',

    // Pass through user-provided handlers (possibly with additional logic)
    onInsert: config.onInsert ? async (params) => {
      const result = await config.onInsert!(params)
      // Additional sync coordination logic
      return result
    } : undefined
  }
}
```

### Pattern B: Built-in Handlers (Trailbase, WebSocket, Firebase)

Your collection creator implements the handlers directly using the sync engine's APIs:

```typescript
interface MyCollectionConfig<TItem extends object>
  extends Omit<CollectionConfig<TItem>, 'onInsert' | 'onUpdate' | 'onDelete'> {
  // Note: onInsert/onUpdate/onDelete are NOT in the config
}

export function myCollectionOptions<TItem extends object>(
  config: MyCollectionConfig<TItem>
) {
  return {
    rowUpdateMode: config.rowUpdateMode || 'partial',

    // Implement handlers using sync engine APIs
    onInsert: async ({ transaction }) => {
      // Handle provider-specific batch limits (e.g., Firestore's 500 limit)
      const chunks = chunkArray(transaction.mutations, PROVIDER_BATCH_LIMIT)

      for (const chunk of chunks) {
        const ids = await config.recordApi.createBulk(
          chunk.map(m => serialize(m.modified))
        )
        await awaitIds(ids)
      }

      return transaction.mutations.map(m => m.key)
    },

    onUpdate: async ({ transaction }) => {
      const chunks = chunkArray(transaction.mutations, PROVIDER_BATCH_LIMIT)

      for (const chunk of chunks) {
        await Promise.all(
          chunk.map(m =>
            config.recordApi.update(m.key, serialize(m.changes))
          )
        )
      }

      await awaitIds(transaction.mutations.map(m => String(m.key)))
    }
  }
}
```

Many providers have batch size limits (Firestore: 500, DynamoDB: 25, etc.) so chunk large transactions accordingly.

## Row Update Modes

Collections support two update modes:

- **partial** (default) - Updates are merged with existing data
- **full** - Updates replace the entire row

Configure this in your sync config:

```typescript
sync: {
  sync: syncFn,
  rowUpdateMode: 'full' // or 'partial'
}
```

## Production Examples

For complete, production-ready examples, see the collection packages in the TanStack DB repository:

- **[@tanstack/query-collection](https://github.com/TanStack/db/tree/main/packages/query-collection)** - Pattern A: User-provided handlers with full refetch strategy
- **[@tanstack/trailbase-collection](https://github.com/TanStack/db/tree/main/packages/trailbase-collection)** - Pattern B: Built-in handlers with ID-based tracking
- **[@tanstack/electric-collection](https://github.com/TanStack/db/tree/main/packages/electric-collection)** - Pattern A: Transaction ID tracking with complex sync protocols
- **[@tanstack/rxdb-collection](https://github.com/TanStack/db/tree/main/packages/rxdb-collection)** - Pattern B: Built-in handlers that bridge RxDB change streams into TanStack DB's sync lifecycle

### Key Lessons from Production Collections

**From Query Collection:**
- Simplest approach: Full refetch after mutations
- Best for: APIs without real-time sync
- Pattern: User provides onInsert/onUpdate/onDelete handlers

**From Trailbase Collection:**
- Shows ID-based optimistic state management
- Handles provider batch limits (chunking large operations)
- Pattern: Collection provides mutation handlers using record API

**From Electric Collection:**
- Complex transaction ID tracking for distributed sync
- Demonstrates advanced deduplication techniques
- Shows how to wrap user handlers with sync coordination

**From RxDB Collection:**
- Uses RxDB's built-in queries and change streams
- Uses RxCollection.$ to subscribe to inserts/updates/deletes and forward them to TanStack DB with begin-write-commit
- Implements built-in mutation handlers (onInsert, onUpdate, onDelete) that call RxDB APIs (bulkUpsert, incrementalPatch, bulkRemove)

## Managing Optimistic State

A critical challenge in sync-first apps is knowing when to drop optimistic state. ([Collection Options Creator Guide][1]) When a user makes a change:

1. The UI updates immediately (optimistic update)
2. A mutation is sent to the backend
3. The backend processes and persists the change
4. The change syncs back to the client
5. The optimistic state should be dropped in favor of the synced data

The key question is: **How do you know when step 4 is complete?**

### Strategy 1: Built-in Provider Methods (Recommended)

Many providers offer built-in methods to wait for sync completion:

```typescript
// Firebase
await waitForPendingWrites(firestore)

// Custom WebSocket
await websocket.waitForAck(transactionId)
```

### Strategy 2: Transaction ID Tracking (ElectricSQL)

ElectricSQL returns transaction IDs that you can track:

```typescript
// Track seen transaction IDs
const seenTxids = new Store<Set<number>>(new Set())

// In sync, track txids from incoming messages
if (message.headers.txids) {
  message.headers.txids.forEach(txid => {
    seenTxids.setState(prev => new Set([...prev, txid]))
  })
}

// Mutation handlers return txids and wait for them
const wrappedOnInsert = async (params) => {
  const result = await config.onInsert!(params)

  // Wait for the txid to appear in synced data
  if (result.txid) {
    await awaitTxId(result.txid)
  }

  return result
}

// Utility function to wait for a txid
const awaitTxId = (txId: number): Promise<boolean> => {
  if (seenTxids.state.has(txId)) return Promise.resolve(true)

  return new Promise((resolve) => {
    const unsubscribe = seenTxids.subscribe(() => {
      if (seenTxids.state.has(txId)) {
        unsubscribe()
        resolve(true)
      }
    })
  })
}
```

### Strategy 3: ID-Based Tracking (Trailbase)

Trailbase tracks when specific record IDs have been synced:

```typescript
// Track synced IDs with timestamps
const seenIds = new Store(new Map<string, number>())

// In sync, mark IDs as seen
write({ type: 'insert', value: item })
seenIds.setState(prev => new Map(prev).set(item.id, Date.now()))

// Wait for specific IDs after mutations
const wrappedOnInsert = async (params) => {
  const ids = await config.recordApi.createBulk(items)

  // Wait for all IDs to be synced back
  await awaitIds(ids)
}

const awaitIds = (ids: string[]): Promise<void> => {
  const allSynced = ids.every(id => seenIds.state.has(id))
  if (allSynced) return Promise.resolve()

  return new Promise((resolve) => {
    const unsubscribe = seenIds.subscribe((state) => {
      if (ids.every(id => state.has(id))) {
        unsubscribe()
        resolve()
      }
    })
  })
}
```

### Strategy 4: Version/Timestamp Tracking

Track version numbers or timestamps to detect when data is fresh:

```typescript
// Track latest sync timestamp
let lastSyncTime = 0

// In mutations, record when the operation was sent
const wrappedOnUpdate = async (params) => {
  const mutationTime = Date.now()
  await config.onUpdate(params)

  // Wait for sync to catch up
  await waitForSync(mutationTime)
}

const waitForSync = (afterTime: number): Promise<void> => {
  if (lastSyncTime > afterTime) return Promise.resolve()

  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (lastSyncTime > afterTime) {
        clearInterval(check)
        resolve()
      }
    }, 100)
  })
}
```

### Strategy 5: Full Refetch (Query Collection)

The query collection simply refetches all data after mutations:

```typescript
const wrappedOnInsert = async (params) => {
  // Perform the mutation
  await config.onInsert(params)

  // Refetch the entire collection
  await refetch()

  // The refetch will trigger sync with fresh data,
  // automatically dropping optimistic state
}
```

### Choosing a Strategy

- **Built-in Methods**: Best when your provider offers sync completion APIs
- **Transaction IDs**: Best when your backend provides reliable transaction tracking
- **ID-Based**: Good for systems where each mutation returns the affected IDs
- **Full Refetch**: Simplest but least efficient; good for small datasets
- **Version/Timestamp**: Works when your sync includes reliable ordering information

## Best Practices

1. **Always call markReady()** - This signals that the collection has initial data and is ready for use
2. **Handle errors gracefully** - Call markReady() even on error to avoid blocking the app
3. **Clean up resources** - Return a cleanup function from sync to prevent memory leaks
4. **Batch operations** - Use begin/commit to batch multiple changes for better performance
5. **Race Conditions** - Start listeners before initial fetch and buffer events
6. **Type safety** - Use TypeScript generics to maintain type safety throughout
7. **Provide utilities** - Export sync-engine-specific utilities for advanced use cases

## Testing Your Collection

Test your collection options creator with:

1. **Unit tests** - Test sync logic, data transformations
2. **Integration tests** - Test with real sync engine
3. **Error scenarios** - Connection failures, invalid data
4. **Performance** - Large datasets, frequent updates

## Learn More

- [Schemas Guide](./concepts.md)
- [Query Collection](./collections/query-collection.md)
- [Electric Collection](./collections/electric-collection.md)
- [RxDB Collection](./collections/rxdb-collection.md)

## References

[1]: https://github.com/TanStack/db/blob/main/docs/guides/collection-options-creator.md "TanStack DB Collection Options Creator Guide"
