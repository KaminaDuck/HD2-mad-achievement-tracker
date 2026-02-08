---
title: "TanStack DB Solid Guide"
description: "SolidJS signals for reactive live queries with TanStack DB"
type: "framework-guide"
tags: ["tanstack", "db", "solid", "solidjs", "signals", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "Solid Adapter Overview"
    url: "https://tanstack.com/db/latest/docs/framework/solid/overview"
related: ["../react/guide.md", "../../concepts.md", "../../overview.md"]
version_log: "./versions.md"
---

# TanStack DB Solid Guide

SolidJS signals for reactive live queries with TanStack DB.

## Installation

```bash
npm install @tanstack/solid-db
```

([Solid Adapter Overview][1])

## Basic Usage

### createLiveQuery

The `createLiveQuery` primitive creates a live query that returns a signal. The signal automatically updates when underlying data changes:

```tsx
import { createLiveQuery } from '@tanstack/solid-db'
import { eq } from '@tanstack/db'
import { For, Show } from 'solid-js'

function TodoList() {
  const todos = createLiveQuery((q) =>
    q.from({ todos: todosCollection })
     .where(({ todos }) => eq(todos.completed, false))
     .select(({ todos }) => ({ id: todos.id, text: todos.text }))
  )

  return (
    <Show when={!todos().isLoading} fallback={<div>Loading...</div>}>
      <ul>
        <For each={todos().data}>
          {(todo) => <li>{todo.text}</li>}
        </For>
      </ul>
    </Show>
  )
}
```

**Note:** The return value is a signal function - call it with `todos()` to access the reactive data.

## Query Syntax

Query syntax is identical across all framework adapters. For comprehensive documentation on filtering, joins, aggregations, and other query operations, see the [Concepts Guide](../../concepts.md).

### Quick Examples

```tsx
// Filtering
const todos = createLiveQuery((q) =>
  q.from({ todos: todosCollection })
   .where(({ todos }) => eq(todos.completed, false))
)

// Ordering
const todos = createLiveQuery((q) =>
  q.from({ todos: todosCollection })
   .orderBy(({ todos }) => todos.createdAt, 'desc')
)

// Joins
const todos = createLiveQuery((q) =>
  q.from({ todos: todosCollection })
   .leftJoin({ users: usersCollection }, ({ todos, users }) =>
     eq(todos.userId, users.id)
   )
   .select(({ todos, users }) => ({
     id: todos.id,
     text: todos.text,
     userName: users.name
   }))
)
```

## Mutations

Mutations are performed directly on collections, same as other adapters:

```tsx
// Insert
todosCollection.insert({
  id: crypto.randomUUID(),
  text: 'New todo',
  completed: false
})

// Update
todosCollection.update(todoId, (draft) => {
  draft.completed = true
})

// Delete
todosCollection.delete(todoId)
```

## Learn More

- [Concepts Guide](../../concepts.md) - Live queries, mutations, schemas
- [React Adapter](../react/guide.md) - React integration patterns
- [Overview](../../overview.md) - TanStack DB introduction

## References

[1]: https://tanstack.com/db/latest/docs/framework/solid/overview "Solid Adapter Overview"
