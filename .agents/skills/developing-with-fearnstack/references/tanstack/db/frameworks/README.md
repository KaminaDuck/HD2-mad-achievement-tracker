---
title: "TanStack DB Framework Adapters"
description: "Index of all TanStack DB framework adapters"
type: "meta"
tags: ["tanstack", "db", "frameworks", "adapters", "index"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "TanStack DB Docs"
    url: "https://tanstack.com/db/latest/docs/framework"
related: ["../README.md", "../concepts.md", "../quick-start.md"]
parent_reference: "../README.md"
---

# TanStack DB Framework Adapters

TanStack DB provides framework-specific adapters that integrate with each framework's reactivity system. All adapters share the same query syntax and collection APIs - only the integration pattern differs.

## Available Adapters

| Framework | Package | Version | Primitives |
|-----------|---------|---------|------------|
| [React](./react/) | `@tanstack/react-db` | 0.1.60 | Hooks (`useLiveQuery`, `useLiveSuspenseQuery`, `useLiveInfiniteQuery`) |
| [Vue](./vue/) | `@tanstack/vue-db` | 0.0.92 | Composables (`useLiveQuery`) |
| [Svelte](./svelte/) | `@tanstack/svelte-db` | 0.1.59 | Stores (`createLiveQuery`) |
| [Solid](./solid/) | `@tanstack/solid-db` | 0.1.59 | Signals (`createLiveQuery`) |
| [Angular](./angular/) | `@tanstack/angular-db` | 0.1.42 | Observables/Signals (`injectLiveQuery`) |

## Shared Concepts

All framework adapters share:

- **Query Syntax**: Same `from()`, `where()`, `select()`, `orderBy()`, `innerJoin()` API
- **Collection Types**: Same collection options (Query, Electric, PowerSync, RxDB, etc.)
- **Optimistic Mutations**: Same `insert()`, `update()`, `delete()` methods
- **Transactions**: Same `createTransaction()` API

The only difference is how results are delivered to your components (hooks, composables, stores, signals, or observables).

## Quick Comparison

### React
```tsx
import { useLiveQuery } from '@tanstack/react-db'

function TodoList() {
  const { data } = useLiveQuery((q) =>
    q.from({ todos: todosCollection })
  )
  return <ul>{data.map(t => <li key={t.id}>{t.text}</li>)}</ul>
}
```

### Vue
```vue
<script setup>
import { useLiveQuery } from '@tanstack/vue-db'

const { data } = useLiveQuery((q) =>
  q.from({ todos: todosCollection })
)
</script>
```

### Svelte
```svelte
<script>
import { createLiveQuery } from '@tanstack/svelte-db'

const todos = createLiveQuery((q) =>
  q.from({ todos: todosCollection })
)
</script>

{#each $todos.data as todo}
  <li>{todo.text}</li>
{/each}
```

### Solid
```tsx
import { createLiveQuery } from '@tanstack/solid-db'

function TodoList() {
  const todos = createLiveQuery((q) =>
    q.from({ todos: todosCollection })
  )
  return <ul><For each={todos().data}>{t => <li>{t.text}</li>}</For></ul>
}
```

### Angular
```typescript
import { injectLiveQuery } from '@tanstack/angular-db'

@Component({...})
export class TodoList {
  todos = injectLiveQuery((q) =>
    q.from({ todos: todosCollection })
  )
}
```

## Learn More

- [Core Concepts](../concepts.md) - Query syntax, optimistic mutations, transactions
- [Quick Start](../quick-start.md) - Get started with TanStack DB
- [Collections](../collections/) - Collection types and integrations
