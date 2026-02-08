---
title: "TanStack DB Svelte Guide"
description: "Svelte stores for reactive live queries with TanStack DB"
type: "framework-guide"
tags: ["tanstack", "db", "svelte", "stores", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "Svelte Adapter Overview"
    url: "https://tanstack.com/db/latest/docs/framework/svelte/overview"
related: ["../react/guide.md", "../../concepts.md", "../../overview.md"]
version_log: "./versions.md"
---

# TanStack DB Svelte Guide

Svelte stores for reactive live queries with TanStack DB.

## Installation

```bash
npm install @tanstack/svelte-db
```

For TanStack Query integration (QueryCollection):

```bash
npm install @tanstack/db @tanstack/svelte-db
```

## createLiveQuery

The `createLiveQuery` function creates a Svelte store that automatically updates when underlying data changes. Access the store value using the `$` prefix in Svelte components.

### Basic Usage

```svelte
<script>
import { createLiveQuery } from '@tanstack/svelte-db'
import { eq } from '@tanstack/db'
import { todosCollection } from './collections'

const todos = createLiveQuery((q) =>
  q.from({ todos: todosCollection })
   .where(({ todos }) => eq(todos.completed, false))
   .select(({ todos }) => ({ id: todos.id, text: todos.text }))
)
</script>

{#if $todos.isLoading}
  <p>Loading...</p>
{:else}
  <ul>
    {#each $todos.data as todo (todo.id)}
      <li>{todo.text}</li>
    {/each}
  </ul>
{/if}
```

### Store Return Values

The store provides the following reactive properties:

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T[]` | The query results array |
| `isLoading` | `boolean` | True during initial data fetch |
| `status` | `string` | Query status ('pending', 'ready', 'error') |

### Reactive Dependencies

When using reactive values in queries, pass them as dependencies:

```svelte
<script>
import { createLiveQuery } from '@tanstack/svelte-db'
import { eq } from '@tanstack/db'
import { todosCollection } from './collections'

let showCompleted = false

// Query updates when showCompleted changes
$: todos = createLiveQuery(
  (q) =>
    q.from({ todos: todosCollection })
     .where(({ todos }) => eq(todos.completed, showCompleted)),
  [showCompleted]
)
</script>

<label>
  <input type="checkbox" bind:checked={showCompleted} />
  Show completed
</label>

<ul>
  {#each $todos.data as todo (todo.id)}
    <li>{todo.text}</li>
  {/each}
</ul>
```

## Mutations

Mutations are performed directly on collections, same as other frameworks:

```svelte
<script>
import { todosCollection } from './collections'

function addTodo(text) {
  todosCollection.insert({
    id: crypto.randomUUID(),
    text,
    completed: false
  })
}

function toggleTodo(id) {
  todosCollection.update(id, (draft) => {
    draft.completed = !draft.completed
  })
}

function deleteTodo(id) {
  todosCollection.delete(id)
}
</script>
```

## Query Syntax

The query syntax is the same across all TanStack DB framework adapters. For detailed documentation on:

- Filtering with `where()`, `eq()`, `gt()`, `like()`, etc.
- Joins with `leftJoin()`, `innerJoin()`, etc.
- Aggregations with `groupBy()`, `count()`, `sum()`, etc.
- Ordering with `orderBy()`, `limit()`, `offset()`

See the [Concepts Guide](../../concepts.md).

## Learn More

- [TanStack DB Concepts](../../concepts.md) - Query syntax, mutations, schemas
- [React Guide](../react/guide.md) - React hooks reference
- [TanStack DB Overview](../../overview.md) - Introduction and architecture
