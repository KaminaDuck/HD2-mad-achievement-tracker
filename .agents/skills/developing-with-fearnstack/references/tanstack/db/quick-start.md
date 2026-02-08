---
title: "TanStack DB Quick Start"
description: "Get started with TanStack DB - collections, live queries, and optimistic updates"
type: "concept-guide"
tags: ["tanstack", "db", "typescript", "quick-start", "collections", "live-queries", "mutations"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "TanStack DB Quick Start Guide"
    url: "https://tanstack.com/db/latest/docs/quick-start"
  - name: "TanStack DB Official Docs"
    url: "https://tanstack.com/db/latest"
related: ["./overview.md", "./installation.md", "./concepts.md", "./error-handling.md"]
author: "unknown"
contributors: []
---

# Quick Start

TanStack DB is the reactive client-first store for your API. Stop building custom endpoints for every view—query your data however your components need it. ([Quick Start Guide][1])

## What You'll Learn

- **Load data** into collections using TanStack Query
- **Query data** with blazing-fast live queries
- **Mutate data** with instant optimistic updates

## Complete Example

```tsx
import { createCollection, eq, useLiveQuery } from '@tanstack/react-db'
import { queryCollectionOptions } from '@tanstack/query-db-collection'

// Define a collection that loads data using TanStack Query
const todoCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos')
      return response.json()
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      const { original, modified } = transaction.mutations[0]
      await fetch(`/api/todos/${original.id}`, {
        method: 'PUT',
        body: JSON.stringify(modified),
      })
    },
  })
)

function Todos() {
  // Live query that updates automatically when data changes
  const { data: todos } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
     .where(({ todo }) => eq(todo.completed, false))
     .orderBy(({ todo }) => todo.createdAt, 'desc')
  )

  const toggleTodo = (todo) => {
    // Instantly applies optimistic state, then syncs to server
    todoCollection.update(todo.id, (draft) => {
      draft.completed = !draft.completed
    })
  }

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id} onClick={() => toggleTodo(todo)}>
          {todo.text}
        </li>
      ))}
    </ul>
  )
}
```

## Installation

```bash
npm install @tanstack/react-db @tanstack/query-db-collection
```

## Step 1: Create a Collection

Collections store your data and handle persistence. The `queryCollectionOptions` loads data using TanStack Query and defines mutation handlers for server sync: ([Quick Start Guide][1])

```tsx
const todoCollection = createCollection(
  queryCollectionOptions({
    queryKey: ['todos'],
    queryFn: async () => {
      const response = await fetch('/api/todos')
      return response.json()
    },
    getKey: (item) => item.id,
    // Handle all CRUD operations
    onInsert: async ({ transaction }) => {
      const { modified: newTodo } = transaction.mutations[0]
      await fetch('/api/todos', {
        method: 'POST',
        body: JSON.stringify(newTodo),
      })
    },
    onUpdate: async ({ transaction }) => {
      const { original, modified } = transaction.mutations[0]
      await fetch(`/api/todos/${original.id}`, {
        method: 'PUT',
        body: JSON.stringify(modified),
      })
    },
    onDelete: async ({ transaction }) => {
      const { original } = transaction.mutations[0]
      await fetch(`/api/todos/${original.id}`, { method: 'DELETE' })
    },
  })
)
```

## Step 2: Query with Live Queries

Live queries reactively update when data changes. They support filtering, sorting, joins, and transformations: ([Quick Start Guide][1])

```tsx
function TodoList() {
  // Basic filtering and sorting
  const { data: incompleteTodos } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
     .where(({ todo }) => eq(todo.completed, false))
     .orderBy(({ todo }) => todo.createdAt, 'desc')
  )

  // Transform the data
  const { data: todoSummary } = useLiveQuery((q) =>
    q.from({ todo: todoCollection })
     .select(({ todo }) => ({
       id: todo.id,
       summary: `${todo.text} (${todo.completed ? 'done' : 'pending'})`,
       priority: todo.priority || 'normal'
     }))
  )

  return <div>{/* Render todos */}</div>
}
```

## Step 3: Optimistic Mutations

Mutations apply instantly and sync to your server. If the server request fails, changes automatically roll back: ([Quick Start Guide][1])

```tsx
function TodoActions({ todo }) {
  const addTodo = () => {
    todoCollection.insert({
      id: crypto.randomUUID(),
      text: 'New todo',
      completed: false,
      createdAt: new Date(),
    })
  }

  const toggleComplete = () => {
    todoCollection.update(todo.id, (draft) => {
      draft.completed = !draft.completed
    })
  }

  const updateText = (newText) => {
    todoCollection.update(todo.id, (draft) => {
      draft.text = newText
    })
  }

  const deleteTodo = () => {
    todoCollection.delete(todo.id)
  }

  return (
    <div>
      <button onClick={addTodo}>Add Todo</button>
      <button onClick={toggleComplete}>Toggle</button>
      <button onClick={() => updateText('Updated!')}>Edit</button>
      <button onClick={deleteTodo}>Delete</button>
    </div>
  )
}
```

## Next Steps

- **[Installation](./installation.md)** - All framework and collection packages
- **[Overview](./overview.md)** - Complete feature overview and examples
- **[Live Queries](./concepts.md#live-queries)** - Advanced querying, joins, and aggregations
- **[Error Handling](./error-handling.md)** - Handle errors gracefully

## References

[1]: https://github.com/TanStack/db/blob/main/docs/quick-start.md "TanStack DB Quick Start Guide"
