---
title: "RxDB Collection"
description: "Offline-first local persistence with RxDB integration"
type: "integration-guide"
tags: ["tanstack", "db", "rxdb-collection", "rxdb", "local-first", "offline", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "RxDB Collection Docs"
    url: "https://tanstack.com/db/latest/docs/collections/rxdb-collection"
  - name: "RxDB Official Docs"
    url: "https://rxdb.info/"
related: ["../query/guide.md", "../localstorage/guide.md", "../../concepts.md", "../../frameworks/react/guide.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# RxDB Collection

RxDB collections provide seamless integration between TanStack DB and [RxDB](https://rxdb.info/), enabling automatic synchronization between your in-memory TanStack DB collections and RxDB's local-first database. Giving you offline-ready persistence, and powerful sync capabilities with a wide range of backends. ([RxDB Collection Docs][1])

## Overview

The `@tanstack/rxdb-db-collection` package allows you to create collections that: ([RxDB Collection Docs][1])

- Automatically mirror the state of an underlying RxDB collection
- Reactively update when RxDB documents change
- Support optimistic mutations with rollback on error
- Provide persistence handlers to keep RxDB in sync with TanStack DB transactions
- Sync across browser tabs - changes in one tab are reflected in RxDB and TanStack DB collections in all tabs
- Use one of RxDB's [storage engines](https://rxdb.info/rx-storage.html)
- Work with RxDB's [replication features](https://rxdb.info/replication.html) for offline-first and sync scenarios
- Leverage RxDB's [replication plugins](https://rxdb.info/replication.html) to sync with CouchDB, MongoDB, Supabase, REST APIs, GraphQL, WebRTC (P2P) and more

## 1. Installation

Install the RxDB collection packages along with your preferred framework integration:

```bash
npm install @tanstack/rxdb-db-collection rxdb @tanstack/react-db
```

## 2. Create an RxDatabase and RxCollection

```typescript
import { createRxDatabase, addRxPlugin } from 'rxdb/plugins/core'

/**
 * Here we use the localstorage based storage for RxDB.
 * RxDB has a wide range of storages based on Dexie.js, IndexedDB, SQLite and more.
 */
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage'

// add json-schema validation (optional)
import { wrappedValidateAjvStorage } from 'rxdb/plugins/validate-ajv';

// Enable dev mode (optional, recommended during development)
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
addRxPlugin(RxDBDevModePlugin)

type Todo = { id: string; text: string; completed: boolean }

const db = await createRxDatabase({
  name: 'my-todos',
  storage: wrappedValidateAjvStorage({
    storage: getRxStorageLocalstorage()
  })
})

await db.addCollections({
  todos: {
    schema: {
      title: 'todos',
      version: 0,
      type: 'object',
      primaryKey: 'id',
      properties: {
        id: { type: 'string', maxLength: 100 },
        text: { type: 'string' },
        completed: { type: 'boolean' },
      },
      required: ['id', 'text', 'completed'],
    },
  },
})
```

## 3. (Optional) Sync with a Backend

```typescript
import { replicateRxCollection } from 'rxdb/plugins/replication'

const replicationState = replicateRxCollection({
  collection: db.todos,
  pull: { handler: myPullHandler },
  push: { handler: myPushHandler },
})
```

## 4. Wrap the RxDB Collection with TanStack DB

```typescript
import { createCollection } from '@tanstack/react-db'
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection'

const todosCollection = createCollection(
  rxdbCollectionOptions({
    rxCollection: myDatabase.todos,
    startSync: true, // start ingesting RxDB data immediately
  })
)
```

Now `todosCollection` is a reactive TanStack DB collection driven by RxDB:

- Writes via `todosCollection.insert/update/delete` persist to RxDB
- Direct writes in RxDB (or via replication) flow into the TanStack collection via change streams

## Configuration Options

The `rxdbCollectionOptions` function accepts the following options: ([RxDB Collection Docs][1])

### Required

- `rxCollection`: The underlying [RxDB collection](https://rxdb.info/rx-collection.html)

### Optional

- `id`: Unique identifier for the collection
- `schema`: Schema for validating items. RxDB already has schema validation but having additional validation on the TanStack DB side can help to unify error handling between different tanstack collections.
- `startSync`: Whether to start syncing immediately (default: `true`)
- `onInsert`, `onUpdate`, `onDelete`: Override default persistence handlers. By default, TanStack DB writes are persisted to RxDB using `bulkUpsert`, `patch`, and `bulkRemove`.
- `syncBatchSize`: The maximum number of documents fetched per batch during the initial sync from RxDB into TanStack DB (default: 1000). Larger values reduce round trips but use more memory; smaller values are lighter but may increase query calls. Note that this only affects the initial sync. Ongoing live updates are streamed one by one via RxDB's change feed. ([RxDB Collection Docs][1])

## Syncing with Backends

Replication and sync in RxDB run independently of TanStack DB. You set up replication directly on your RxCollection using RxDB's replication plugins (for CouchDB, GraphQL, WebRTC, REST APIs, etc.). ([RxDB Collection Docs][1])

When replication runs, it pulls and pushes changes to the backend and applies them to the RxDB collection. Since the TanStack DB integration subscribes to the RxDB change stream, any changes applied by replication are automatically reflected in your TanStack DB collection.

This separation of concerns means you configure replication entirely in RxDB, and TanStack DB automatically benefits: your TanStack collections always stay up to date with whatever sync strategy you choose.

## Storage Engines

RxDB supports various storage engines:

- **LocalStorage** - Simple browser storage
- **IndexedDB** - Browser indexed database via Dexie.js
- **SQLite** - For React Native and Electron apps
- **Memory** - In-memory storage for testing

```typescript
// IndexedDB storage example
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie'

const db = await createRxDatabase({
  name: 'my-app',
  storage: getRxStorageDexie()
})
```

## Replication Plugins

RxDB provides replication plugins for various backends:

- **CouchDB** - Sync with CouchDB/PouchDB
- **GraphQL** - Custom GraphQL endpoints
- **WebRTC** - Peer-to-peer synchronization
- **REST** - Custom REST APIs
- **Supabase** - Supabase integration
- **Firebase** - Firestore integration

```typescript
import { replicateRxCollection } from 'rxdb/plugins/replication'

const replicationState = replicateRxCollection({
  collection: db.todos,
  replicationIdentifier: 'my-sync',
  pull: {
    handler: async (lastCheckpoint) => {
      const response = await fetch('/api/sync/pull', {
        method: 'POST',
        body: JSON.stringify({ checkpoint: lastCheckpoint })
      })
      return response.json()
    }
  },
  push: {
    handler: async (changeRows) => {
      await fetch('/api/sync/push', {
        method: 'POST',
        body: JSON.stringify(changeRows)
      })
      return []
    }
  }
})
```

## Complete Example

```typescript
import { createRxDatabase, addRxPlugin } from 'rxdb/plugins/core'
import { getRxStorageLocalstorage } from 'rxdb/plugins/storage-localstorage'
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode'
import { createCollection, useLiveQuery } from '@tanstack/react-db'
import { rxdbCollectionOptions } from '@tanstack/rxdb-db-collection'

// Setup RxDB
addRxPlugin(RxDBDevModePlugin)

const db = await createRxDatabase({
  name: 'my-todos',
  storage: getRxStorageLocalstorage()
})

await db.addCollections({
  todos: {
    schema: {
      title: 'todos',
      version: 0,
      type: 'object',
      primaryKey: 'id',
      properties: {
        id: { type: 'string', maxLength: 100 },
        text: { type: 'string' },
        completed: { type: 'boolean' },
      },
      required: ['id', 'text', 'completed'],
    },
  },
})

// Create TanStack DB collection
const todosCollection = createCollection(
  rxdbCollectionOptions({
    rxCollection: db.todos,
    startSync: true,
  })
)

// Use in component
function TodoList() {
  const { data: todos } = useLiveQuery((q) =>
    q.from({ todo: todosCollection })
      .where(({ todo }) => !todo.completed)
      .orderBy(({ todo }) => todo.text, 'asc')
  )

  const addTodo = (text: string) => {
    todosCollection.insert({
      id: crypto.randomUUID(),
      text,
      completed: false,
    })
  }

  return (
    <div>
      {todos.map((todo) => (
        <div key={todo.id}>{todo.text}</div>
      ))}
    </div>
  )
}
```

## Learn More

- [RxDB Documentation](https://rxdb.info/)
- [RxDB Storage Engines](https://rxdb.info/rx-storage.html)
- [RxDB Replication](https://rxdb.info/replication.html)
- [Optimistic Mutations](../concepts.md)
- [Live Queries](../concepts.md)

## References

[1]: https://github.com/TanStack/db/blob/main/docs/collections/rxdb-collection.md "TanStack DB RxDB Collection Documentation"
