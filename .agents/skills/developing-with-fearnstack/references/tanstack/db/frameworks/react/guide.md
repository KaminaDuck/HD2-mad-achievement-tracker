---
title: "TanStack DB React Guide"
description: "Complete guide to using TanStack DB with React"
type: "framework-guide"
tags: ["tanstack", "db", "react", "hooks", "data-management", "typescript", "collections"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "React Adapter Overview"
    url: "https://tanstack.com/db/latest/docs/framework/react/overview"
  - name: "TanStack DB Overview"
    url: "https://tanstack.com/db/latest/docs/overview"
  - name: "Live Queries Guide"
    url: "https://tanstack.com/db/latest/docs/guides/live-queries"
related: ["../../overview.md", "../../concepts.md", "../../error-handling.md", "../vue/guide.md"]
version_log: "./versions.md"
author: "unknown"
contributors: []
---

# TanStack DB React Guide

Comprehensive guide for using TanStack DB with React for reactive client-side data management with collections, live queries, and optimistic mutations.

## Installation

Install the React adapter via npm: ([React Adapter Overview][1])

```bash
npm install @tanstack/react-db
```

For TanStack Query integration (QueryCollection):

```bash
npm install @tanstack/db @tanstack/react-db @tanstack/react-query
```

## Core React Hooks

The adapter provides three primary hooks for different use cases: ([React Adapter Overview][1])

### useLiveQuery

Creates live queries that automatically update components when underlying data changes. Accepts a query function and optional dependency array.

```tsx
import { useLiveQuery } from '@tanstack/react-db'

function TodoList() {
  const { data, isLoading } = useLiveQuery((q) =>
    q.from({ todos: todosCollection })
     .where(({ todos }) => eq(todos.completed, false))
     .select(({ todos }) => ({ id: todos.id, text: todos.text }))
  )

  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {data?.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}
```

### useLiveSuspenseQuery

Integrates with React Suspense for cleaner loading states. Re-suspends when dependencies change, displaying fallback UI until new data loads. ([React Adapter Overview][1])

```tsx
import { Suspense } from 'react'
import { useLiveSuspenseQuery } from '@tanstack/react-db'

function TodoList() {
  // data is guaranteed to be defined (no loading check needed)
  const { data } = useLiveSuspenseQuery((q) =>
    q.from({ todos: todosCollection })
     .where(({ todos }) => eq(todos.completed, false))
     .select(({ todos }) => ({ id: todos.id, text: todos.text }))
  )

  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
  )
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TodoList />
    </Suspense>
  )
}
```

### useLiveInfiniteQuery

Enables paginated data with live updates. Returns data, pages, fetchNextPage, and hasNextPage properties for handling pagination. ([React Adapter Overview][1])

```tsx
import { useLiveInfiniteQuery } from '@tanstack/react-db'

function InfiniteTodoList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useLiveInfiniteQuery((q) =>
      q.from({ todos: todosCollection })
       .orderBy(({ todos }) => todos.createdAt)
       .select(({ todos }) => ({ id: todos.id, text: todos.text }))
    )

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.map(todo => (
            <div key={todo.id}>{todo.text}</div>
          ))}
        </div>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? 'Loading...' : hasNextPage ? 'Load More' : 'No more'}
      </button>
    </div>
  )
}
```

## Dependency Arrays

Dependency arrays work similarly to `useEffect`. Include all external values (props, state) used within queries. When dependencies change, the previous query cleans up and a new one executes with updated values. ([React Adapter Overview][1])

```tsx
function FilteredTodos({ status }: { status: 'active' | 'completed' }) {
  const { data } = useLiveQuery(
    (q) =>
      q.from({ todos: todosCollection })
       .where(({ todos }) => eq(todos.status, status))
       .select(({ todos }) => ({ id: todos.id, text: todos.text })),
    [status] // Include all external values
  )

  return <TodoList todos={data} />
}
```

**Best Practices:** ([React Adapter Overview][1])

- **Include all external values in dependency arrays** to prevent stale queries
- **Omit the dependency array** for static queries with no external dependencies
- **Use useLiveSuspenseQuery** when React Suspense boundaries wrap components

## Setting Up Collections

Before using hooks, create your collections. Here's a basic QueryCollection setup with TanStack Query:

```tsx
import { createQueryCollection } from '@tanstack/db'
import { z } from 'zod'

// Define schema
const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),
  createdAt: z.string().transform(val => new Date(val))
})

// Create collection
const todosCollection = createQueryCollection({
  id: 'todos',
  schema: todoSchema,
  getId: (todo) => todo.id,
  queryFn: async () => {
    const response = await fetch('/api/todos')
    return response.json()
  },
  onInsert: async ({ transaction }) => {
    await Promise.all(
      transaction.mutations.map(m =>
        fetch('/api/todos', {
          method: 'POST',
          body: JSON.stringify(m.data)
        })
      )
    )
  },
  onUpdate: async ({ transaction }) => {
    await Promise.all(
      transaction.mutations.map(m =>
        fetch(`/api/todos/${m.original.id}`, {
          method: 'PATCH',
          body: JSON.stringify(m.changes)
        })
      )
    )
  },
  onDelete: async ({ transaction }) => {
    await Promise.all(
      transaction.mutations.map(m =>
        fetch(`/api/todos/${m.original.id}`, {
          method: 'DELETE'
        })
      )
    )
  }
})
```

## Basic Query Patterns

### Simple Query

```tsx
const { data } = useLiveQuery((q) =>
  q.from({ todos: todosCollection })
   .select(({ todos }) => ({
     id: todos.id,
     text: todos.text,
     completed: todos.completed
   }))
)
```

### Filtered Query

```tsx
const { data } = useLiveQuery((q) =>
  q.from({ todos: todosCollection })
   .where(({ todos }) => eq(todos.completed, false))
   .select(({ todos }) => ({ id: todos.id, text: todos.text }))
)
```

### Ordered Query

```tsx
const { data } = useLiveQuery((q) =>
  q.from({ todos: todosCollection })
   .orderBy(({ todos }) => todos.createdAt, 'desc')
   .select(({ todos }) => ({ id: todos.id, text: todos.text }))
)
```

### Query with Joins

```tsx
const { data } = useLiveQuery((q) =>
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

## Performing Mutations

Mutations are performed directly on collections:

### Insert

```tsx
function AddTodo() {
  const [text, setText] = useState('')

  const handleAdd = () => {
    todosCollection.insert({
      id: crypto.randomUUID(),
      text,
      completed: false
    })
    setText('')
  }

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleAdd}>Add</button>
    </div>
  )
}
```

### Update

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const handleToggle = () => {
    todosCollection.update(todo.id, (draft) => {
      draft.completed = !draft.completed
    })
  }

  return (
    <li onClick={handleToggle}>
      {todo.completed ? '✓' : '○'} {todo.text}
    </li>
  )
}
```

### Delete

```tsx
function TodoItem({ todo }: { todo: Todo }) {
  const handleDelete = () => {
    todosCollection.delete(todo.id)
  }

  return (
    <li>
      {todo.text}
      <button onClick={handleDelete}>Delete</button>
    </li>
  )
}
```

## Conditional Queries

Return `undefined` from hooks to disable queries conditionally: ([React Adapter Overview][1])

```tsx
function UserTodos({ userId }: { userId: string | null }) {
  const { data } = useLiveQuery(
    userId
      ? (q) =>
          q.from({ todos: todosCollection })
           .where(({ todos }) => eq(todos.userId, userId))
           .select(({ todos }) => ({ id: todos.id, text: todos.text }))
      : undefined,
    [userId]
  )

  if (!userId) return <div>Select a user</div>

  return <TodoList todos={data} />
}
```

## Error Handling

Wrap components with error boundaries to catch query and mutation errors:

```tsx
import { ErrorBoundary } from 'react-error-boundary'

function App() {
  return (
    <ErrorBoundary fallback={<div>Something went wrong</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <TodoList />
      </Suspense>
    </ErrorBoundary>
  )
}
```

For mutation-specific error handling:

```tsx
const handleAdd = async () => {
  const tx = todosCollection.insert({
    id: crypto.randomUUID(),
    text,
    completed: false
  })

  try {
    await tx.isPersisted.promise
    console.log('Todo saved!')
  } catch (error) {
    // Optimistic state automatically rolled back
    console.error('Failed to save:', error)
  }
}
```

## Integration with TanStack Query

When using QueryCollection, TanStack Query handles the underlying data fetching. Ensure you wrap your app with QueryClientProvider:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoApp />
    </QueryClientProvider>
  )
}
```

## Best Practices

1. **Use Suspense for cleaner code** - `useLiveSuspenseQuery` eliminates manual loading/error states
2. **Include all dependencies** - Prevent stale queries by including all external values
3. **Define collections outside components** - Avoid recreating collections on each render
4. **Use schemas for validation** - Catch data errors at the client boundary
5. **Handle transaction results** - Check `isPersisted.promise` for mutation confirmation
6. **Leverage fine-grained reactivity** - TanStack DB only re-renders when relevant data changes

## Links

**Official Documentation:**
- [React Adapter Overview](https://tanstack.com/db/latest/docs/framework/react/overview)
- [Live Queries Guide](https://tanstack.com/db/latest/docs/guides/live-queries)
- [Mutations Guide](https://tanstack.com/db/latest/docs/guides/mutations)

**Related Guides:**
- [TanStack DB Overview](overview.md)
- [TanStack DB Concepts](concepts.md)

## References

[1]: https://github.com/TanStack/db/blob/main/docs/framework/react/overview.md "React Adapter Overview"
[2]: https://github.com/TanStack/db/blob/main/docs/overview.md "TanStack DB Overview"
[3]: https://github.com/TanStack/db/blob/main/docs/guides/live-queries.md "Live Queries Guide"
