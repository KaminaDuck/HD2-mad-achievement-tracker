---
title: "Electric Collection"
description: "Real-time data synchronization with Postgres via ElectricSQL shapes"
type: "integration-guide"
tags: ["tanstack", "db", "electric-collection", "electricsql", "postgres", "sync", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "Electric Collection Docs"
    url: "https://tanstack.com/db/latest/docs/collections/electric-collection"
  - name: "ElectricSQL Official Docs"
    url: "https://electric-sql.com/docs"
related: ["../query/guide.md", "../powersync/guide.md", "../../concepts.md", "../../frameworks/react/guide.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Electric Collection

Electric collections provide seamless integration between TanStack DB and ElectricSQL, enabling real-time data synchronization with your Postgres database through Electric's sync engine. ([Electric Collection Docs][1])

## Overview

The `@tanstack/electric-db-collection` package allows you to create collections that: ([Electric Collection Docs][1])

- Automatically sync data from Postgres via Electric shapes
- Support optimistic updates with transaction matching and automatic rollback on errors
- Handle persistence through customizable mutation handlers

## Installation

```bash
npm install @tanstack/electric-db-collection @tanstack/react-db
```

## Basic Usage

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

## Configuration Options

### Required Options

- `shapeOptions`: Configuration for the ElectricSQL ShapeStream ([Electric Collection Docs][1])
  - `url`: The URL of your proxy to Electric
- `getKey`: Function to extract the unique key from an item

### Optional

- `id`: Unique identifier for the collection
- `schema`: Schema for validating items (any Standard Schema compatible)
- `sync`: Custom sync configuration

### Persistence Handlers

Handlers called before mutations to persist changes to your backend: ([Electric Collection Docs][1])

- `onInsert`: Handler called before insert operations
- `onUpdate`: Handler called before update operations
- `onDelete`: Handler called before delete operations

Each handler should return `{ txid }` to wait for synchronization.

## Persistence Handlers & Synchronization

Handlers persist mutations to the backend and wait for Electric to sync changes back. This prevents UI glitches where optimistic updates would be removed and then re-added. ([Electric Collection Docs][1])

### 1. Using Txid (Recommended)

Uses PostgreSQL transaction IDs for precise matching:

```typescript
const todosCollection = createCollection(
  electricCollectionOptions({
    id: 'todos',
    schema: todoSchema,
    getKey: (item) => item.id,
    shapeOptions: {
      url: '/api/todos',
      params: { table: 'todos' },
    },

    onInsert: async ({ transaction }) => {
      const newItem = transaction.mutations[0].modified
      const response = await api.todos.create(newItem)
      return { txid: response.txid }
    },

    onUpdate: async ({ transaction }) => {
      const { original, changes } = transaction.mutations[0]
      const response = await api.todos.update({
        where: { id: original.id },
        data: changes
      })
      return { txid: response.txid }
    }
  })
)
```

### 2. Using Custom Match Functions

For cases where txids aren't available: ([Electric Collection Docs][1])

```typescript
import { isChangeMessage } from '@tanstack/electric-db-collection'

const todosCollection = createCollection(
  electricCollectionOptions({
    id: 'todos',
    getKey: (item) => item.id,
    shapeOptions: {
      url: '/api/todos',
      params: { table: 'todos' },
    },

    onInsert: async ({ transaction, collection }) => {
      const newItem = transaction.mutations[0].modified
      await api.todos.create(newItem)

      await collection.utils.awaitMatch(
        (message) => {
          return isChangeMessage(message) &&
                 message.headers.operation === 'insert' &&
                 message.value.text === newItem.text
        },
        5000 // timeout in ms
      )
    }
  })
)
```

### 3. Using Simple Timeout

For quick prototyping:

```typescript
onInsert: async ({ transaction }) => {
  const newItem = transaction.mutations[0].modified
  await api.todos.create(newItem)
  await new Promise(resolve => setTimeout(resolve, 2000))
}
```

## Generating Txid on Backend

Query `pg_current_xact_id()` inside your transaction: ([Electric Collection Docs][1])

```typescript
async function generateTxId(tx) {
  const result = await tx.execute(
    sql`SELECT pg_current_xact_id()::xid::text as txid`
  )
  const txid = result.rows[0]?.txid
  if (txid === undefined) {
    throw new Error(`Failed to get transaction ID`)
  }
  return parseInt(txid as string, 10)
}
```

**Important:** Query txid **inside** the same transaction as your mutation:

```typescript
// Correct - txid queried inside transaction
async function createTodo(data) {
  let txid!: Txid

  const result = await sql.begin(async (tx) => {
    txid = await generateTxId(tx)
    const [todo] = await tx`
      INSERT INTO todos ${tx(data)}
      RETURNING *
    `
    return todo
  })

  return { todo: result, txid }
}
```

## Electric Proxy Example

Electric is typically deployed behind a proxy for security: ([Electric Collection Docs][1])

```javascript
import { createServerFileRoute } from "@tanstack/react-start/server"
import { ELECTRIC_PROTOCOL_QUERY_PARAMS } from "@electric-sql/client"

const baseUrl = 'http://.../v1/shape'

const serve = async ({ request }: { request: Request }) => {
  const url = new URL(request.url)
  const originUrl = new URL(baseUrl)

  url.searchParams.forEach((value, key) => {
    if (ELECTRIC_PROTOCOL_QUERY_PARAMS.includes(key)) {
      originUrl.searchParams.set(key, value)
    }
  })

  originUrl.searchParams.set("table", "todos")

  const response = await fetch(originUrl)
  const headers = new Headers(response.headers)
  headers.delete("content-encoding")
  headers.delete("content-length")

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export const ServerRoute = createServerFileRoute("/api/todos").methods({
  GET: serve,
})
```

## Optimistic Updates with Explicit Transactions

### Using Txid Strategy

```typescript
const addTodoAction = createOptimisticAction({
  onMutate: ({ text }) => {
    const tempId = crypto.randomUUID()
    todosCollection.insert({
      id: tempId,
      text,
      completed: false,
      created_at: new Date(),
    })
  },

  mutationFn: async ({ text }) => {
    const response = await api.todos.create({
      data: { text, completed: false }
    })
    await todosCollection.utils.awaitTxId(response.txid)
  }
})
```

### Using Custom Match Function

```typescript
import { isChangeMessage } from '@tanstack/electric-db-collection'

const addTodoAction = createOptimisticAction({
  onMutate: ({ text }) => {
    const tempId = crypto.randomUUID()
    todosCollection.insert({
      id: tempId,
      text,
      completed: false,
      created_at: new Date(),
    })
  },

  mutationFn: async ({ text }) => {
    await api.todos.create({
      data: { text, completed: false }
    })

    await todosCollection.utils.awaitMatch(
      (message) => {
        return isChangeMessage(message) &&
               message.headers.operation === 'insert' &&
               message.value.text === text
      }
    )
  }
})
```

## Utility Methods

### awaitTxId(txid, timeout?)

Wait for a specific transaction ID to be synchronized: ([Electric Collection Docs][1])

```typescript
await todosCollection.utils.awaitTxId(12345)
await todosCollection.utils.awaitTxId(12345, 10000) // custom timeout
```

### awaitMatch(matchFn, timeout?)

Wait for a custom match function to find a message: ([Electric Collection Docs][1])

```typescript
import { isChangeMessage } from '@tanstack/electric-db-collection'

await todosCollection.utils.awaitMatch(
  (message) => {
    return isChangeMessage(message) &&
           message.headers.operation === 'insert' &&
           message.value.text === 'New Todo'
  },
  5000
)
```

## Helper Functions

- `isChangeMessage(message)`: Check if message is a data change (insert/update/delete) ([Electric Collection Docs][1])
- `isControlMessage(message)`: Check if message is a control message

```typescript
import { isChangeMessage, isControlMessage } from '@tanstack/electric-db-collection'

const matchFn = (message) => {
  if (isChangeMessage(message)) {
    return message.headers.operation === 'insert'
  }
  return false
}
```

## Debugging

### Enable Debug Logging

```javascript
localStorage.debug = 'ts/db:electric'
```

### Common Issue: awaitTxId Stalls or Times Out

**Root Cause:** Txid returned from API doesn't match the actual mutation txid. This happens when you query `pg_current_xact_id()` **outside** the mutation transaction.

**Wrong - txid queried outside transaction:**

```typescript
// DON'T DO THIS
async function createTodo(data) {
  const txid = await generateTxId(sql) // Wrong: separate transaction
  await sql.begin(async (tx) => {
    await tx`INSERT INTO todos ${tx(data)}`
  })
  return { txid } // This txid won't match!
}
```

**Correct - txid queried inside transaction:**

```typescript
// DO THIS
async function createTodo(data) {
  let txid!: Txid
  const result = await sql.begin(async (tx) => {
    txid = await generateTxId(tx)
    const [todo] = await tx`
      INSERT INTO todos ${tx(data)}
      RETURNING *
    `
    return todo
  })
  return { todo: result, txid }
}
```

## References

[1]: https://github.com/TanStack/db/blob/main/docs/collections/electric-collection.md "TanStack DB Electric Collection Documentation"
