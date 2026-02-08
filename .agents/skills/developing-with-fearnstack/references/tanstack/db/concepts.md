---
title: "TanStack DB Concepts"
description: "Deep-dive into live queries, mutations, schemas, and collections"
type: "concept-guide"
tags: ["tanstack", "db", "live-queries", "mutations", "schemas", "collections", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "Live Queries Guide"
    url: "https://tanstack.com/db/latest/docs/guides/live-queries"
  - name: "Mutations Guide"
    url: "https://tanstack.com/db/latest/docs/guides/mutations"
  - name: "Schemas Guide"
    url: "https://tanstack.com/db/latest/docs/guides/schemas"
  - name: "TanStack DB Overview"
    url: "https://tanstack.com/db/latest/docs/overview"
related: ["./overview.md", "./frameworks/react/guide.md", "./error-handling.md"]
author: "unknown"
contributors: []
---

# TanStack DB Concepts

Deep-dive into the core concepts powering TanStack DB: live queries, mutations, schemas, and collection types.

## Live Queries

Live queries represent a declarative approach to data querying with automatic reactivity. All queries are **live** by default, meaning they automatically update when the underlying data changes. ([Live Queries Guide][1])

### How Live Queries Work

The differential dataflow engine powers incremental computation. Rather than re-executing entire queries when data changes, the system: ([Live Queries Guide][1])

1. **Compiles queries into optimized pipelines** that execute incrementally
2. **Automatically deduplicates subqueries** when reused within a query
3. **Maintains live collections** that stream updates without full recalculation
4. **Supports nested composition** through subqueries and collection reuse

> "The query builder doesn't perform operations in the order of method calls - instead, it composes your query into an optimal incremental pipeline." ([Live Queries Guide][1])

### Query Operations

#### Filtering

The `where` clause uses declarative expressions with functions like `eq()`, `gt()`, `like()`, and logical operators (`and()`, `or()`): ([Live Queries Guide][1])

```typescript
q.from({ users: usersCollection })
 .where(({ users }) => eq(users.active, true))
 .where(({ users }) => gt(users.age, 18))
```

Combine conditions with `and()` and `or()`:

```typescript
q.from({ users: usersCollection })
 .where(({ users }) => and(
   eq(users.active, true),
   or(
     eq(users.role, 'admin'),
     eq(users.role, 'moderator')
   )
 ))
```

#### Projections

The `select` method transforms data. Rename fields, create computed properties, and use built-in functions: ([Live Queries Guide][1])

```typescript
q.from({ users: usersCollection })
 .select(({ users }) => ({
   id: users.id,
   fullName: concat(users.firstName, ' ', users.lastName),
   displayName: upper(users.username)
 }))
```

#### Joins

Four join types are supported: `leftJoin()`, `rightJoin()`, `innerJoin()`, and `fullJoin()`: ([Live Queries Guide][1])

```typescript
q.from({ todos: todosCollection })
 .leftJoin({ users: usersCollection }, ({ todos, users }) =>
   eq(todos.userId, users.id)
 )
 .select(({ todos, users }) => ({
   id: todos.id,
   text: todos.text,
   userName: users.name
 }))
```

#### Aggregations

Use `groupBy()` with aggregate functions (`count()`, `sum()`, `avg()`, `min()`, `max()`): ([Live Queries Guide][1])

```typescript
q.from({ todos: todosCollection })
 .groupBy(({ todos }) => todos.userId)
 .select(({ todos }) => ({
   userId: todos.userId,
   totalTodos: count(todos.id),
   completedCount: sum(todos.completed ? 1 : 0)
 }))
```

When aggregates appear without grouping, the entire result set is treated as a single group.

#### Ordering and Pagination

`orderBy()`, `limit()`, and `offset()` control result presentation: ([Live Queries Guide][1])

```typescript
q.from({ todos: todosCollection })
 .orderBy(({ todos }) => todos.createdAt, 'desc')
 .limit(10)
 .offset(20)
```

> "Ordering is performed incrementally for optimal performance." ([Live Queries Guide][1])

### Performance Characteristics

- **Incremental Evaluation**: Queries execute as optimized pipelines rather than materializing intermediate results ([Live Queries Guide][1])
- **Automatic Deduplication**: The same subquery used multiple times is executed only once ([Live Queries Guide][1])
- **Intermediate Caching**: Live query results are collections that update automatically ([Live Queries Guide][1])

### Reusable Filters

Create callback functions accepting `Ref<T>` types for composable, type-safe filters: ([Live Queries Guide][1])

```typescript
const isActive = <T extends { active: boolean }>(ref: Ref<T>) =>
  eq(ref.active, true)

// Usage
q.from({ users: usersCollection })
 .where(({ users }) => isActive(users))
```

---

## Mutations

TanStack DB implements a **unidirectional data flow pattern** extending beyond the client to include server synchronization. ([Mutations Guide][2])

### Mutation Lifecycle

The system follows this lifecycle: ([Mutations Guide][2])

1. **Optimistic State Applied**: Changes are immediately applied to the local collection
2. **Handler Invocation**: The appropriate persistence handler executes
3. **Backend Persistence**: Data is saved to your server
4. **Sync Back**: Server writes sync back to the collection
5. **Optimistic Replaced**: Local optimistic state is replaced by confirmed server state

### Insert Operations

```typescript
// Single item
todoCollection.insert({ id: "1", text: "Buy groceries", completed: false })

// Multiple items
todoCollection.insert([
  { id: "1", text: "Buy groceries", completed: false },
  { id: "2", text: "Walk dog", completed: false }
])

// With metadata
todoCollection.insert(item, { metadata: { source: "import" } })

// Non-optimistic (wait for server confirmation)
todoCollection.insert(item, { optimistic: false })
```

([Mutations Guide][2])

### Update Operations

Updates use a draft pattern for immutable modifications: ([Mutations Guide][2])

```typescript
// Single item with draft pattern
todoCollection.update(todo.id, (draft) => {
  draft.completed = true
})

// Multiple items
todoCollection.update([todo1.id, todo2.id], (drafts) => {
  drafts.forEach(d => d.completed = true)
})

// With metadata
todoCollection.update(id, { metadata: { reason: "user update" } }, (draft) => {
  draft.text = "Updated"
})
```

### Delete Operations

```typescript
// Single item
todoCollection.delete(todo.id)

// Multiple items
todoCollection.delete([todo1.id, todo2.id])

// Non-optimistic
todoCollection.delete(id, { optimistic: false })
```

([Mutations Guide][2])

### Transaction Support

#### Automatic Transactions

Collection write operations automatically create and manage transactions: ([Mutations Guide][2])

```typescript
const tx = todoCollection.insert({ id: "1", text: "New todo", completed: false })
// Returns a Transaction object for tracking
await tx.isPersisted.promise
```

#### Manual Transactions

For complex workflows or multi-step operations: ([Mutations Guide][2])

```typescript
import { createTransaction } from "@tanstack/react-db"

const tx = createTransaction({
  autoCommit: false,
  mutationFn: async ({ transaction }) => {
    await api.batchUpdate(transaction.mutations)
  }
})

// Apply mutations without immediate commit
tx.mutate(() => {
  todoCollection.update(id1, draft => { draft.status = "reviewed" })
  todoCollection.update(id2, draft => { draft.status = "reviewed" })
})

// User reviews, then commits
await tx.commit()
// Or cancel: tx.rollback()
```

### Transaction States

Monitor transaction progress: ([Mutations Guide][2])

- **pending**: Initial state, optimistic mutations applicable
- **persisting**: Being written to backend
- **completed**: Successfully persisted
- **failed**: Error occurred, changes rolled back

### Rollback and Error Handling

Automatic rollback occurs when handlers throw errors: ([Mutations Guide][2])

```typescript
const tx = todoCollection.insert({
  id: "1",
  text: "Task",
  completed: false
})

try {
  await tx.isPersisted.promise
  console.log("Success!")
} catch (error) {
  // Optimistic state automatically rolled back
  console.error("Save failed:", error)
}
```

### Mutation Merging

When multiple mutations affect the same item in a transaction, TanStack DB intelligently merges them: ([Mutations Guide][2])

| Combination | Result |
|-------------|--------|
| insert + update | insert (preserves insertion) |
| insert + delete | removed (cancels out) |
| update + delete | delete (delete dominates) |
| update + update | union of changes |

### Advanced Patterns

#### Custom Actions for Intent-Based Mutations

```typescript
const likePost = createOptimisticAction<string>({
  onMutate: (postId) => {
    postCollection.update(postId, draft => {
      draft.likeCount += 1
      draft.likedByMe = true
    })
  },
  mutationFn: async (postId) => {
    await api.posts.like(postId)
    await postCollection.utils.refetch()
  }
})

likePost(postId)
```

([Mutations Guide][2])

#### Paced Mutations with Debounce

```typescript
const mutate = usePacedMutations<string>({
  onMutate: (text) => {
    formCollection.update(formId, (draft) => {
      draft.content = text
    })
  },
  mutationFn: async ({ transaction }) => {
    await api.forms.save(transaction.mutations)
  },
  strategy: debounceStrategy({ wait: 500 })
})
```

([Mutations Guide][2])

---

## Schemas

TanStack DB uses schemas for data validation and type safety, validating client-side mutations (insert/update operations) through schema definitions. ([Schemas Guide][3])

### Supported Schema Libraries

TanStack DB supports any **StandardSchema v1** compatible library: ([Schemas Guide][3])

- **Zod** (primary examples in documentation)
- **Valibot**
- **ArkType**
- **Effect Schema**

### TInput vs TOutput

The schema establishes a transformation boundary: ([Schemas Guide][3])

- **TInput**: The type users provide when calling `insert()` or `update()`
- **TOutput**: The type stored in the collection and returned from queries

> "TInput must be a superset of TOutput" when using transformations. ([Schemas Guide][3])

### Validation Patterns

Common validation approaches: ([Schemas Guide][3])

```typescript
const todoSchema = z.object({
  // Basic types
  id: z.string(),
  text: z.string().min(1).max(500),
  completed: z.boolean(),
  priority: z.number().int().positive().max(10),

  // Enum validation
  status: z.enum(['pending', 'active', 'completed']),

  // Optional/nullable
  description: z.string().optional(),
  deletedAt: z.date().nullable(),

  // Arrays
  tags: z.array(z.string()).max(5),

  // Custom validation
  email: z.string().email().refine(
    (val) => val.endsWith('@company.com'),
    'Must be a company email'
  )
})
```

### Transformations

Common transformations: ([Schemas Guide][3])

```typescript
const todoSchema = z.object({
  id: z.string(),
  text: z.string(),
  completed: z.boolean(),

  // String to Date
  created_at: z.string().transform(val => new Date(val)),

  // String to Number (from form inputs)
  quantity: z.string().transform(val => parseInt(val, 10)),

  // JSON String to Object
  settings: z.string().transform(val => JSON.parse(val)),
})
```

#### Computed Fields

Add derived properties automatically: ([Schemas Guide][3])

```typescript
const userSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
}).transform(data => ({
  ...data,
  full_name: `${data.first_name} ${data.last_name}`
}))
```

### Default Values

Three approaches for defaults: ([Schemas Guide][3])

```typescript
const todoSchema = z.object({
  id: z.string(),
  text: z.string(),

  // Literal default
  completed: z.boolean().default(false),

  // Function default (dynamic)
  created_at: z.date().default(() => new Date()),

  // Combined with transformation
  updated_at: z.string()
    .default(() => new Date().toISOString())
    .transform(val => new Date(val)),
})
```

### Error Handling

When validation fails, a `SchemaValidationError` is thrown containing: ([Schemas Guide][3])

- `type`: The operation type ('insert' or 'update')
- `message`: Summary of validation failures
- `issues`: Array with `path` and `message` for each validation error

```typescript
try {
  todosCollection.insert({ text: '' }) // Invalid: empty text
} catch (error) {
  if (error instanceof SchemaValidationError) {
    console.log(error.issues)
    // [{ path: ['text'], message: 'String must have at least 1 character' }]
  }
}
```

### Important Caveat

> "Schemas validate client changes only" — they do not automatically validate data loaded from servers or sync layers. ([Schemas Guide][3])

---

## Collection Types

TanStack DB provides different collection types for various data loading patterns. ([TanStack DB Overview][4])

### Fetch Collections

#### QueryCollection

Integrates with TanStack Query for REST API data: ([TanStack DB Overview][4])

```typescript
import { createQueryCollection } from '@tanstack/db'

const todosCollection = createQueryCollection({
  id: 'todos',
  schema: todoSchema,
  getId: (todo) => todo.id,
  queryFn: async () => {
    const response = await fetch('/api/todos')
    return response.json()
  },
  onInsert: async ({ transaction }) => {
    // Handle inserts
  },
  onUpdate: async ({ transaction }) => {
    // Handle updates
  },
  onDelete: async ({ transaction }) => {
    // Handle deletes
  }
})
```

### Sync Collections

For real-time synchronized data: ([TanStack DB Overview][4])

| Type | Backend | Use Case |
|------|---------|----------|
| ElectricCollection | ElectricSQL | PostgreSQL sync |
| TrailBaseCollection | TrailBase | TrailBase backend |
| RxDBCollection | RxDB | Offline-first persistence |
| PowerSyncCollection | PowerSync | SQLite sync |

### Local Collections

For client-only data: ([TanStack DB Overview][4])

#### LocalStorageCollection

Persistent local storage:

```typescript
import { createLocalStorageCollection } from '@tanstack/db'

const preferencesCollection = createLocalStorageCollection({
  id: 'preferences',
  schema: preferencesSchema,
  getId: (pref) => pref.key
})
```

#### LocalOnlyCollection

In-memory state (lost on refresh):

```typescript
import { createLocalOnlyCollection } from '@tanstack/db'

const tempCollection = createLocalOnlyCollection({
  id: 'temp',
  schema: tempSchema,
  getId: (item) => item.id
})
```

### Sync Modes

Collections support different loading strategies: ([TanStack DB Overview][4])

| Mode | Behavior | Best For |
|------|----------|----------|
| Eager | Full collection loading | Small datasets (<10k rows) |
| On-demand | Query-driven loading | Large datasets (>50k rows) |
| Progressive | Immediate subset + background sync | Balanced UX |

---

## Links

**Official Documentation:**
- [Live Queries Guide](https://tanstack.com/db/latest/docs/guides/live-queries)
- [Mutations Guide](https://tanstack.com/db/latest/docs/guides/mutations)
- [Schemas Guide](https://tanstack.com/db/latest/docs/guides/schemas)

**Related Guides:**
- [TanStack DB Overview](overview.md)
- [TanStack DB React Guide](react-guide.md)

[1]: https://tanstack.com/db/latest/docs/guides/live-queries "Live Queries Guide"
[2]: https://tanstack.com/db/latest/docs/guides/mutations "Mutations Guide"
[3]: https://tanstack.com/db/latest/docs/guides/schemas "Schemas Guide"
[4]: https://tanstack.com/db/latest/docs/overview "TanStack DB Overview"
