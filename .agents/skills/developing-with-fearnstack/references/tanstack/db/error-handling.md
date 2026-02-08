---
title: "TanStack DB Error Handling"
description: "Error handling guide - schema validation, transactions, and sync errors"
type: "concept-guide"
tags: ["tanstack", "db", "typescript", "error-handling", "transactions", "validation"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "TanStack DB Error Handling Guide"
    url: "https://tanstack.com/db/latest/docs/guides/error-handling"
  - name: "TanStack DB Official Docs"
    url: "https://tanstack.com/db/latest"
related: ["./concepts.md", "./quick-start.md", "./frameworks/react/guide.md"]
author: "unknown"
contributors: []
---

# Error Handling

TanStack DB provides comprehensive error handling capabilities to ensure robust data synchronization and state management. ([Error Handling Guide][1])

## Error Types

TanStack DB provides named error classes for better error handling and type safety. All error classes can be imported from `@tanstack/db` (or framework-specific packages like `@tanstack/react-db`): ([Error Handling Guide][1])

```ts
import {
  SchemaValidationError,
  CollectionInErrorStateError,
  DuplicateKeyError,
  MissingHandlerError,
  TransactionError,
  // ... and many more
} from "@tanstack/db"
```

## SchemaValidationError

Thrown when data doesn't match the collection's schema during insert or update operations:

```ts
import { SchemaValidationError } from "@tanstack/db"

try {
  todoCollection.insert({ text: 123 }) // Invalid type
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.log(error.type) // 'insert' or 'update'
    console.log(error.issues) // Array of validation issues
    // Example issue: { message: "Expected string, received number", path: ["text"] }
  }
}
```

The error includes:
- `type`: Whether it was an 'insert' or 'update' operation
- `issues`: Array of validation issues with messages and paths
- `message`: A formatted error message listing all issues

**When schema validation occurs:**

Schema validation happens only for **client mutations** - when you explicitly insert or update data:

1. **During inserts** - When `collection.insert()` is called
2. **During updates** - When `collection.update()` is called

Schemas do **not** validate data coming from your server or sync layer - that data is assumed to already be valid.

## Collection Status and Error States

Collections track their status and transition between states:

```tsx
import { useLiveQuery } from "@tanstack/react-db"

const TodoList = () => {
  const { data, status, isError, isLoading, isReady } = useLiveQuery(
    (query) => query.from({ todos: todoCollection })
  )

  if (isError) {
    return <div>Collection is in error state</div>
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return <div>{data?.map(todo => <div key={todo.id}>{todo.text}</div>)}</div>
}
```

Collection status values:
- `idle` - Not yet started
- `loading` - Loading initial data
- `initialCommit` - Processing initial data
- `ready` - Ready for use
- `error` - In error state
- `cleaned-up` - Cleaned up and no longer usable

## Query Collection Error Tracking

Query collections provide enhanced error tracking utilities through the `utils` object:

```tsx
const syncedCollection = createCollection(
  queryCollectionOptions({
    queryClient,
    queryKey: ['synced-data'],
    queryFn: fetchData,
    getKey: (item) => item.id,
  })
)

function DataList() {
  const { data } = useLiveQuery((q) => q.from({ item: syncedCollection }))
  const isError = syncedCollection.utils.isError
  const errorCount = syncedCollection.utils.errorCount

  return (
    <>
      {isError && errorCount > 3 && (
        <Alert>
          Unable to sync. Showing cached data.
          <button onClick={() => syncedCollection.utils.clearError()}>
            Retry
          </button>
        </Alert>
      )}
      {/* Render data */}
    </>
  )
}
```

Error tracking methods:
- **`lastError`**: Returns the most recent error, or undefined
- **`isError`**: Returns boolean indicating error state
- **`errorCount`**: Number of consecutive sync failures
- **`clearError()`**: Clears error state and triggers refetch

## Using Suspense and Error Boundaries (React)

Handle loading and error states with `useLiveSuspenseQuery`, React Suspense, and Error Boundaries:

```tsx
import { useLiveSuspenseQuery } from "@tanstack/react-db"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"

const TodoList = () => {
  // No need to check status - Suspense and ErrorBoundary handle it
  const { data } = useLiveSuspenseQuery(
    (query) => query.from({ todos: todoCollection })
  )

  // data is always defined here
  return <div>{data.map(todo => <div key={todo.id}>{todo.text}</div>)}</div>
}

const App = () => (
  <ErrorBoundary fallback={<div>Failed to load todos</div>}>
    <Suspense fallback={<div>Loading...</div>}>
      <TodoList />
    </Suspense>
  </ErrorBoundary>
)
```

## Transaction Error Handling

When mutations fail, TanStack DB automatically rolls back optimistic updates: ([Error Handling Guide][1])

```ts
const todoCollection = createCollection({
  id: "todos",
  onInsert: async ({ transaction }) => {
    const response = await fetch("/api/todos", {
      method: "POST",
      body: JSON.stringify(transaction.mutations[0].modified),
    })

    if (!response.ok) {
      // Throwing an error will rollback the optimistic state
      throw new Error(`HTTP Error: ${response.status}`)
    }

    return response.json()
  },
})

// Usage - optimistic update will be rolled back if the mutation fails
try {
  const tx = todoCollection.insert({
    id: "1",
    text: "New todo",
    completed: false,
  })

  await tx.isPersisted.promise
} catch (error) {
  // The optimistic update has been automatically rolled back
  console.error("Failed to create todo:", error)
}
```

### Transaction States

Transactions have the following states:
- `pending` - Transaction is being processed
- `persisting` - Currently executing the mutation function
- `completed` - Transaction completed successfully
- `failed` - Transaction failed and was rolled back

Access transaction error information:

```ts
try {
  const tx = await todoCollection.update("todo-1", (draft) => {
    draft.completed = true
  })

  await tx.isPersisted.promise
} catch (error) {
  console.log(tx.state) // "failed"
  console.log(tx.error) // { message: "Update failed: 500", error: Error }
}
```

## Collection Operation Errors

### Invalid Collection State

Collections in an error state cannot perform operations:

```ts
import { CollectionInErrorStateError } from "@tanstack/db"

try {
  todoCollection.insert(newTodo)
} catch (error) {
  if (error instanceof CollectionInErrorStateError) {
    await todoCollection.cleanup()
    todoCollection.insert(newTodo) // Retry
  }
}
```

### Missing Mutation Handlers

Direct mutations require handlers to be configured:

```ts
const todoCollection = createCollection({
  id: "todos",
  getKey: (todo) => todo.id,
  // Missing onInsert handler
})

todoCollection.insert(newTodo)
// Error: Collection.insert called directly but no 'onInsert' handler is configured
```

## Insert Operation Errors

### DuplicateKeyError

Thrown when inserting items with existing keys:

```ts
import { DuplicateKeyError } from "@tanstack/db"

try {
  todoCollection.insert({ id: "existing-id", text: "Todo" })
} catch (error) {
  if (error instanceof DuplicateKeyError) {
    console.log(`Duplicate key: ${error.message}`)
    // Consider using update() instead
  }
}
```

### UndefinedKeyError

Thrown when an object is created without a defined key:

```ts
import { UndefinedKeyError } from "@tanstack/db"

try {
  collection.insert({ text: "Todo" }) // Missing 'id' field
} catch (error) {
  if (error instanceof UndefinedKeyError) {
    console.log("Item is missing required key field")
  }
}
```

## Update Operation Errors

### UpdateKeyNotFoundError

Thrown when trying to update a key that doesn't exist:

```ts
import { UpdateKeyNotFoundError } from "@tanstack/db"

try {
  todoCollection.update("nonexistent-key", draft => {
    draft.completed = true
  })
} catch (error) {
  if (error instanceof UpdateKeyNotFoundError) {
    console.log("Key not found - item may have been deleted")
  }
}
```

### KeyUpdateNotAllowedError

Thrown when attempting to change an item's key:

```ts
import { KeyUpdateNotAllowedError } from "@tanstack/db"

try {
  todoCollection.update("todo-1", draft => {
    draft.id = "todo-2" // Not allowed!
  })
} catch (error) {
  if (error instanceof KeyUpdateNotAllowedError) {
    console.log("Cannot change item keys")
    // Instead, delete the old item and insert a new one
  }
}
```

## Delete Operation Errors

### DeleteKeyNotFoundError

Thrown when trying to delete a key that doesn't exist:

```ts
import { DeleteKeyNotFoundError } from "@tanstack/db"

try {
  todoCollection.delete("nonexistent-key")
} catch (error) {
  if (error instanceof DeleteKeyNotFoundError) {
    console.log("Key not found - item may have already been deleted")
  }
}
```

## Sync Error Handling

### Query Collection Sync Errors

Query collections handle sync errors gracefully:

```ts
import { queryCollectionOptions } from "@tanstack/query-db-collection"

const todoCollection = createCollection(
  queryCollectionOptions({
    queryKey: ["todos"],
    queryFn: async () => {
      const response = await fetch("/api/todos")
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`)
      }
      return response.json()
    },
    queryClient,
    getKey: (item) => item.id,
    // Standard TanStack Query error handling options
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })
)
```

When sync errors occur:
- Error is logged to console
- Collection is marked as ready to prevent blocking the application
- Cached data remains available
- Error tracking counters are updated

## Error Recovery Patterns

### Collection Cleanup and Restart

```ts
if (todoCollection.status === "error") {
  await todoCollection.cleanup()
  todoCollection.preload() // Collection will restart
}
```

### Graceful Degradation

```tsx
const TodoApp = () => {
  const { data, isError } = useLiveQuery((query) =>
    query.from({ todos: todoCollection })
  )

  return (
    <div>
      {isError && (
        <div>Sync failed, but you can still view cached data</div>
      )}
      {data?.map(todo => <TodoItem key={todo.id} todo={todo} />)}
    </div>
  )
}
```

### Transaction Rollback Cascading

When a transaction fails, conflicting transactions are automatically rolled back:

```ts
const tx1 = createTransaction({ mutationFn: async () => {} })
const tx2 = createTransaction({ mutationFn: async () => {} })

tx1.mutate(() => collection.update("1", draft => { draft.value = "A" }))
tx2.mutate(() => collection.update("1", draft => { draft.value = "B" })) // Same item

// Rolling back tx1 will also rollback tx2 due to conflict
tx1.rollback() // tx2 is automatically rolled back
```

## Transaction Lifecycle Errors

### MissingMutationFunctionError

Thrown when creating a transaction without a required `mutationFn`:

```ts
import { MissingMutationFunctionError } from "@tanstack/db"

try {
  const tx = createTransaction({}) // Missing mutationFn
} catch (error) {
  if (error instanceof MissingMutationFunctionError) {
    console.log("mutationFn is required when creating a transaction")
  }
}
```

### TransactionNotPendingMutateError

Thrown when calling `mutate()` after a transaction is no longer pending.

### TransactionNotPendingCommitError

Thrown when calling `commit()` after a transaction is no longer pending.

### TransactionAlreadyCompletedRollbackError

Thrown when calling `rollback()` on a transaction that's already completed.

## Best Practices

1. **Use instanceof checks** - Use `instanceof` instead of string matching:

```ts
// Good
if (error instanceof SchemaValidationError) { }

// Avoid
if (error.message.includes("validation failed")) { }
```

2. **Import specific error types** - Import only the error classes you need for better tree-shaking

3. **Always handle SchemaValidationError** - Provide clear feedback for validation failures

4. **Check collection status** - Use `isError`, `isLoading`, `isReady` flags in React components

5. **Handle transaction promises** - Always handle `isPersisted.promise` rejections

## Complete Example

```tsx
import {
  createCollection,
  SchemaValidationError,
  DuplicateKeyError,
} from "@tanstack/db"
import { useLiveQuery } from "@tanstack/react-db"

const todoCollection = createCollection({
  id: "todos",
  schema: todoSchema,
  getKey: (todo) => todo.id,
  onInsert: async ({ transaction }) => {
    const response = await fetch("/api/todos", {
      method: "POST",
      body: JSON.stringify(transaction.mutations[0].modified),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.json()
  },
})

const TodoApp = () => {
  const { data, isError, isLoading } = useLiveQuery(
    (query) => query.from({ todos: todoCollection })
  )

  const handleAddTodo = async (text: string) => {
    try {
      const tx = await todoCollection.insert({
        id: crypto.randomUUID(),
        text,
        completed: false,
      })

      await tx.isPersisted.promise
    } catch (error) {
      if (error instanceof SchemaValidationError) {
        alert(`Validation error: ${error.issues[0]?.message}`)
      } else if (error instanceof DuplicateKeyError) {
        alert("A todo with this ID already exists")
      } else {
        alert(`Failed to add todo: ${error.message}`)
      }
    }
  }

  if (isError) {
    return (
      <div>
        <div>Collection error - data may be stale</div>
        <button onClick={() => todoCollection.cleanup()}>
          Restart Collection
        </button>
      </div>
    )
  }

  if (isLoading) {
    return <div>Loading todos...</div>
  }

  return (
    <div>
      <button onClick={() => handleAddTodo("New todo")}>Add Todo</button>
      {data?.map(todo => <div key={todo.id}>{todo.text}</div>)}
    </div>
  )
}
```

## See Also

- [Concepts](./concepts.md) - Core concepts and mutations guide
- [Quick Start](./quick-start.md) - Getting started with TanStack DB
- [React Guide](./react-guide.md) - React-specific patterns

## References

[1]: https://github.com/TanStack/db/blob/main/docs/guides/error-handling.md "TanStack DB Error Handling Guide"
