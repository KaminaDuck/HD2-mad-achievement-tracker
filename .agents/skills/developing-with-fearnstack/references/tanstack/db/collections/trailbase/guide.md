---
title: "TrailBase Collection"
description: "Real-time sync with TrailBase self-hosted backend"
type: "integration-guide"
tags: ["tanstack", "db", "trailbase-collection", "trailbase", "sqlite", "sync", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "TrailBase Collection Docs"
    url: "https://tanstack.com/db/latest/docs/collections/trailbase-collection"
  - name: "TrailBase Official Site"
    url: "https://trailbase.io/"
related: ["../query/guide.md", "../electric/guide.md", "../../concepts.md", "../../frameworks/react/guide.md"]
version_log: "./versions.md"
author: "unknown"
contributors: []
---

# TrailBase Collection

TrailBase collections provide seamless integration between TanStack DB and [TrailBase](https://trailbase.io/), enabling real-time data synchronization with TrailBase's self-hosted application backend. ([TrailBase Collection Docs][1])

## Overview

[TrailBase](https://trailbase.io/) is an easy-to-self-host, single-executable application backend with built-in SQLite, a V8 JS runtime, auth, admin UIs and sync functionality.

The `@tanstack/trailbase-db-collection` package allows you to create collections that: ([TrailBase Collection Docs][1])

- Automatically sync data from TrailBase Record APIs
- Support real-time subscriptions when `enable_subscriptions` is enabled
- Handle optimistic updates with automatic rollback on errors
- Provide parse/serialize functions for data transformation

## Installation

```bash
npm install @tanstack/trailbase-db-collection @tanstack/react-db trailbase
```

## Basic Usage

```typescript
import { createCollection } from '@tanstack/react-db'
import { trailBaseCollectionOptions } from '@tanstack/trailbase-db-collection'
import { initClient } from 'trailbase'

const trailBaseClient = initClient(`https://your-trailbase-instance.com`)

const todosCollection = createCollection(
  trailBaseCollectionOptions({
    id: 'todos',
    recordApi: trailBaseClient.records('todos'),
    getKey: (item) => item.id,
  })
)
```

## Configuration Options

### Required Options

- `id`: Unique identifier for the collection ([TrailBase Collection Docs][1])
- `recordApi`: TrailBase Record API instance created via `trailBaseClient.records()`
- `getKey`: Function to extract the unique key from an item

### Optional Options

- `schema`: Standard Schema compatible schema (e.g., Zod, Effect) for client-side validation
- `parse`: Object mapping field names to parsing functions that transform data from TrailBase
- `serialize`: Object mapping field names to serialization functions that transform data to TrailBase
- `onInsert`: Handler function called when items are inserted
- `onUpdate`: Handler function called when items are updated
- `onDelete`: Handler function called when items are deleted

## Data Transformation

TrailBase uses different data formats for storage (e.g., Unix timestamps). Use `parse` and `serialize` to handle these transformations: ([TrailBase Collection Docs][1])

```typescript
type SelectTodo = {
  id: string
  text: string
  created_at: number // Unix timestamp from TrailBase
  completed: boolean
}

type Todo = {
  id: string
  text: string
  created_at: Date // JavaScript Date for app usage
  completed: boolean
}

const todosCollection = createCollection<SelectTodo, Todo>(
  trailBaseCollectionOptions({
    id: 'todos',
    recordApi: trailBaseClient.records('todos'),
    getKey: (item) => item.id,
    schema: todoSchema,
    // Transform TrailBase data to application format
    parse: {
      created_at: (ts) => new Date(ts * 1000),
    },
    // Transform application data to TrailBase format
    serialize: {
      created_at: (date) => Math.floor(date.valueOf() / 1000),
    },
  })
)
```

## Real-time Subscriptions

TrailBase supports real-time subscriptions when enabled on the server. The collection automatically subscribes to changes and updates in real-time:

```typescript
const todosCollection = createCollection(
  trailBaseCollectionOptions({
    id: 'todos',
    recordApi: trailBaseClient.records('todos'),
    getKey: (item) => item.id,
    // Real-time updates work automatically when
    // enable_subscriptions is set in TrailBase config
  })
)

// Changes from other clients will automatically update
// the collection in real-time
```

## Mutation Handlers

Handle inserts, updates, and deletes with mutation handlers:

```typescript
const todosCollection = createCollection(
  trailBaseCollectionOptions({
    id: 'todos',
    recordApi: trailBaseClient.records('todos'),
    getKey: (item) => item.id,
    onInsert: async ({ transaction }) => {
      const newTodo = transaction.mutations[0].modified
      // TrailBase handles the persistence automatically
    },
    onUpdate: async ({ transaction }) => {
      const { original, modified } = transaction.mutations[0]
      // TrailBase handles the persistence automatically
    },
    onDelete: async ({ transaction }) => {
      const deletedTodo = transaction.mutations[0].original
      // TrailBase handles the persistence automatically
    },
  })
)
```

## Complete Example

```typescript
import { createCollection } from '@tanstack/react-db'
import { trailBaseCollectionOptions } from '@tanstack/trailbase-db-collection'
import { initClient } from 'trailbase'
import { z } from 'zod'

const trailBaseClient = initClient(`https://your-trailbase-instance.com`)

// Define schema
const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  created_at: z.date(),
})

type SelectTodo = {
  id: string
  text: string
  completed: boolean
  created_at: number
}

type Todo = z.infer<typeof todoSchema>

// Create collection
export const todosCollection = createCollection<SelectTodo, Todo>(
  trailBaseCollectionOptions({
    id: 'todos',
    recordApi: trailBaseClient.records('todos'),
    getKey: (item) => item.id,
    schema: todoSchema,
    parse: {
      created_at: (ts) => new Date(ts * 1000),
    },
    serialize: {
      created_at: (date) => Math.floor(date.valueOf() / 1000),
    },
    onInsert: async ({ transaction }) => {
      const newTodo = transaction.mutations[0].modified
      console.log('Todo created:', newTodo)
    },
  })
)

// Use in component
function TodoList() {
  const { data: todos } = useLiveQuery((q) =>
    q.from({ todo: todosCollection })
      .where(({ todo }) => !todo.completed)
      .orderBy(({ todo }) => todo.created_at, 'desc')
  )

  const addTodo = (text: string) => {
    todosCollection.insert({
      id: crypto.randomUUID(),
      text,
      completed: false,
      created_at: new Date(),
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

- [TrailBase Documentation](https://trailbase.io/documentation/)
- [TrailBase Record APIs](https://trailbase.io/documentation/apis_record/)
- [Optimistic Mutations](../concepts.md)
- [Live Queries](../concepts.md)

## References

[1]: https://github.com/TanStack/db/blob/main/docs/collections/trailbase-collection.md "TanStack DB TrailBase Collection Documentation"
