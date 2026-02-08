---
title: "Svelte Adapter"
description: "Package overview for @tanstack/svelte-db"
type: "meta"
tags: ["tanstack", "db", "svelte", "stores", "adapter"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "npm"
    url: "https://www.npmjs.com/package/@tanstack/svelte-db"
  - name: "GitHub"
    url: "https://github.com/TanStack/db/tree/main/packages/svelte-db"
related: ["./guide.md", "./versions.md", "../README.md"]
version_log: "./versions.md"
current_version: "0.1.59"
---

# Svelte Adapter

The `@tanstack/svelte-db` package provides Svelte stores for reactive live queries with TanStack DB.

## Package Information

| Property | Value |
|----------|-------|
| Package | `@tanstack/svelte-db` |
| Current Version | 0.1.59 |
| Framework | Svelte 4/5 |
| Primitives | Stores (`createLiveQuery`) |

## Installation

```bash
npm install @tanstack/svelte-db
```

## Quick Example

```svelte
<script>
import { createLiveQuery } from '@tanstack/svelte-db'
import { todosCollection } from './collections'

const todos = createLiveQuery((q) =>
  q.from({ todos: todosCollection })
)
</script>

{#if $todos.isLoading}
  <p>Loading...</p>
{:else}
  <ul>
    {#each $todos.data as todo}
      <li>{todo.text}</li>
    {/each}
  </ul>
{/if}
```

## Documentation

- [Guide](./guide.md) - Complete usage guide with examples
- [Version History](./versions.md) - Package version changelog

## Related

- [Framework Adapters Overview](../README.md)
- [TanStack DB Concepts](../../concepts.md)
- [TanStack DB Overview](../../overview.md)
