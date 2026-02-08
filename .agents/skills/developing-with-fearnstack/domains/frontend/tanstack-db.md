---
title: TanStack DB
description: Client-side database with real-time sync and multiple backends
---

# TanStack DB

TanStack DB is a reactive client-first data store for Fearnstack applications, providing collections, live queries, and optimistic mutations with sub-millisecond performance.

## Why TanStack DB?

- **Normalized Data** - Load once into collections, query anywhere
- **Sub-millisecond Queries** - ~0.7ms updates for 100K item collections
- **Optimistic Mutations** - Instant UI updates before server confirms
- **Multiple Backends** - LocalStorage, Query, Electric, PowerSync, RxDB
- **Live Queries** - Automatic reactivity with joins and aggregations

## Installation

```bash
bun add @tanstack/db @tanstack/react-db
```

## Core Concepts

### Collections

Typed object sets that store and sync data:

```typescript
import { createCollection } from "@tanstack/db";
import { z } from "zod";

const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.number(),
});

type Todo = z.infer<typeof todoSchema>;

const todosCollection = createCollection<Todo>({
  name: "todos",
  primaryKey: "id",
  schema: todoSchema,
});
```

### Live Queries

Reactive queries that update automatically:

```typescript
import { useLiveQuery } from "@tanstack/react-db";

function TodoList() {
  const activeTodos = useLiveQuery(
    todosCollection
      .query()
      .where("completed", "==", false)
      .orderBy("createdAt", "desc")
  );

  return (
    <ul>
      {activeTodos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

### Mutations

Optimistic updates with automatic sync:

```typescript
function AddTodoButton() {
  const handleAdd = async () => {
    // Insert executes instantly (optimistic)
    await todosCollection.insert({
      id: crypto.randomUUID(),
      title: "New Todo",
      completed: false,
      createdAt: Date.now(),
    });
    // Backend sync happens in background
  };

  return <button onClick={handleAdd}>Add Todo</button>;
}
```

## Collection Types

### LocalOnlyCollection

In-memory storage, no persistence:

```typescript
import { createLocalOnlyCollection } from "@tanstack/db";

const sessionCollection = createLocalOnlyCollection<Session>({
  name: "session",
  primaryKey: "id",
});
```

### LocalStorageCollection

Persistent browser storage:

```typescript
import { createLocalStorageCollection } from "@tanstack/db";

const settingsCollection = createLocalStorageCollection<Settings>({
  name: "settings",
  primaryKey: "key",
});
```

**⚠️ IMPORTANT: LocalStorage Hydration Warning**

LocalStorageCollections auto-hydrate from localStorage on creation. Don't insert default records during app initialization - it races with hydration and overwrites persisted data.

```typescript
// ❌ BAD - races with hydration
const collection = createLocalStorageCollection<Todo>({ name: "todos", primaryKey: "id" });
collection.insert({ id: "default", title: "Default todo" }); // Overwrites saved data!

// ✅ GOOD - insert lazily, not eagerly
function addDefaultTodoIfEmpty() {
  const todos = collection.query().exec();
  if (todos.length === 0) {
    collection.insert({ id: "default", title: "Default todo" });
  }
}
```

**Pattern:** Insert default records lazily (on first user action or when empty), not eagerly (on app startup).

### QueryCollection

Backed by TanStack Query for REST APIs:

```typescript
import { createQueryCollection } from "@tanstack/query-db-collection";

const usersCollection = createQueryCollection<User>({
  name: "users",
  primaryKey: "id",
  queryKey: ["users"],
  queryFn: async () => {
    const res = await fetch("/api/users");
    return res.json();
  },
  mutationFn: async (mutation) => {
    // Handle inserts, updates, deletes
    if (mutation.type === "insert") {
      await fetch("/api/users", {
        method: "POST",
        body: JSON.stringify(mutation.data),
      });
    }
  },
});
```

### ElectricCollection

Real-time sync with ElectricSQL:

```typescript
import { createElectricCollection } from "@tanstack/electric-db-collection";

const todosCollection = createElectricCollection<Todo>({
  name: "todos",
  primaryKey: "id",
  electric: electricInstance,
  table: "todos",
});
```

## React Integration

### useLiveQuery

Subscribe to reactive query results:

```typescript
import { useLiveQuery } from "@tanstack/react-db";

function Dashboard() {
  // All queries update automatically when data changes
  const totalTodos = useLiveQuery(
    todosCollection.query().count()
  );

  const completedTodos = useLiveQuery(
    todosCollection.query().where("completed", "==", true).count()
  );

  const recentTodos = useLiveQuery(
    todosCollection
      .query()
      .orderBy("createdAt", "desc")
      .limit(5)
  );

  return (
    <div>
      <p>Progress: {completedTodos} / {totalTodos}</p>
      <h3>Recent</h3>
      {recentTodos.map((todo) => (
        <div key={todo.id}>{todo.title}</div>
      ))}
    </div>
  );
}
```

### useLiveSuspenseQuery

With React Suspense:

```typescript
import { useLiveSuspenseQuery } from "@tanstack/react-db";
import { Suspense } from "react";

function TodoList() {
  const todos = useLiveSuspenseQuery(todosCollection.query());

  return (
    <ul>
      {todos.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TodoList />
    </Suspense>
  );
}
```

## Query Operations

### Filtering

```typescript
// Equality
collection.query().where("status", "==", "active")

// Comparison
collection.query().where("age", ">=", 18)
collection.query().where("price", "<", 100)

// Multiple conditions (AND)
collection.query()
  .where("status", "==", "active")
  .where("priority", ">=", 3)

// In array
collection.query().where("category", "in", ["work", "personal"])
```

### Sorting

```typescript
// Single sort
collection.query().orderBy("createdAt", "desc")

// Multiple sorts
collection.query()
  .orderBy("priority", "desc")
  .orderBy("createdAt", "asc")
```

### Pagination

```typescript
collection.query()
  .orderBy("createdAt", "desc")
  .limit(10)
  .offset(20)
```

### Aggregations

```typescript
// Count
const count = useLiveQuery(collection.query().count());

// First/Last
const first = useLiveQuery(collection.query().first());
const last = useLiveQuery(collection.query().last());
```

## Joins

Query across collections:

```typescript
const usersCollection = createCollection<User>({ name: "users", primaryKey: "id" });
const postsCollection = createCollection<Post>({ name: "posts", primaryKey: "id" });

function UserPosts({ userId }: { userId: string }) {
  const userWithPosts = useLiveQuery(
    usersCollection
      .query()
      .where("id", "==", userId)
      .join(postsCollection, "id", "authorId")
  );

  return (
    <div>
      {userWithPosts.map(({ user, posts }) => (
        <div key={user.id}>
          <h2>{user.name}</h2>
          {posts.map((post) => (
            <article key={post.id}>{post.title}</article>
          ))}
        </div>
      ))}
    </div>
  );
}
```

## Mutations

### Insert

```typescript
await collection.insert({
  id: crypto.randomUUID(),
  title: "New Item",
  createdAt: Date.now(),
});
```

### Update

```typescript
await collection.update(
  { id: itemId },
  { completed: true }
);

// Or update many
await collection.updateMany(
  { completed: false },
  { completed: true }
);
```

### Delete

```typescript
await collection.delete({ id: itemId });

// Or delete many
await collection.deleteMany({ completed: true });
```

### Upsert

```typescript
await collection.upsert(
  { id: "unique-id" },
  { id: "unique-id", title: "Title", completed: false }
);
```

## Data Flow Model

TanStack DB implements unidirectional data flow:

```
User Action → Optimistic Update → UI Updates Immediately
                    ↓
             Background Sync → Server
                    ↓
             Server Confirms → Replace Optimistic State
                    ↓
             (If error) → Rollback to Previous State
```

## Sync Modes

### Eager Mode (Default)

Load full collection upfront - best for smaller datasets:

```typescript
const collection = createQueryCollection({
  syncMode: "eager", // Default
  // ...
});
```

### On-Demand Mode

Load only what's queried - best for large datasets (>50K rows):

```typescript
const collection = createQueryCollection({
  syncMode: "on-demand",
  // ...
});
```

### Progressive Mode

Load subset immediately, sync rest in background:

```typescript
const collection = createQueryCollection({
  syncMode: "progressive",
  initialLimit: 100,
  // ...
});
```

## With Hono Backend

```typescript
// Frontend: Create collection backed by Hono API
const todosCollection = createQueryCollection<Todo>({
  name: "todos",
  primaryKey: "id",
  queryKey: ["todos"],
  queryFn: async () => {
    const res = await client.api.todos.$get();
    return res.json();
  },
  mutationFn: async (mutation) => {
    switch (mutation.type) {
      case "insert":
        await client.api.todos.$post({ json: mutation.data });
        break;
      case "update":
        await client.api.todos[":id"].$patch({
          param: { id: mutation.key.id },
          json: mutation.changes,
        });
        break;
      case "delete":
        await client.api.todos[":id"].$delete({
          param: { id: mutation.key.id },
        });
        break;
    }
  },
});

// Component uses live queries
function TodoApp() {
  const todos = useLiveQuery(todosCollection.query());

  const handleToggle = async (id: string, completed: boolean) => {
    await todosCollection.update({ id }, { completed });
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li
          key={todo.id}
          onClick={() => handleToggle(todo.id, !todo.completed)}
        >
          {todo.title}
        </li>
      ))}
    </ul>
  );
}
```

## When to Use TanStack DB

**Use TanStack DB for:**
- Real-time data synchronization
- Complex client-side querying with joins
- Offline-first applications
- Large datasets with fine-grained reactivity
- Reducing API endpoint complexity

**Use TanStack Query instead for:**
- Simple data fetching without complex queries
- Server-rendered applications
- Single-source data without cross-collection relationships

## Next Steps

- [TanStack Query](tanstack-query.md) - Simpler data fetching
- [TanStack AI](tanstack-ai.md) - LLM integration
- [Database Sync](../../integration/database-sync.md) - Backend sync patterns
