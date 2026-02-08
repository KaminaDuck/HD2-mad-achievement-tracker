---
title: "Vue Adapter"
description: "Package overview for @tanstack/vue-db"
type: "meta"
tags: ["tanstack", "db", "vue", "composables", "adapter"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "npm"
    url: "https://www.npmjs.com/package/@tanstack/vue-db"
  - name: "GitHub"
    url: "https://github.com/TanStack/db/tree/main/packages/vue-db"
related: ["./guide.md", "./versions.md", "../README.md"]
version_log: "./versions.md"
current_version: "0.0.92"
---

# @tanstack/vue-db

Vue adapter for TanStack DB providing reactive composables for live queries.

**Current Version:** 0.0.92

## Overview

The `@tanstack/vue-db` package provides Vue 3 composables for integrating TanStack DB into Vue applications. It enables reactive data management with automatic UI updates when underlying collection data changes.

## Installation

```bash
npm install @tanstack/vue-db
```

## Key Composables

| Composable | Description |
|------------|-------------|
| `useLiveQuery` | Creates a live query that automatically updates when data changes |

## Quick Example

```vue
<script setup>
import { useLiveQuery } from '@tanstack/vue-db'
import { eq } from '@tanstack/db'

const { data, isLoading } = useLiveQuery((q) =>
  q.from({ todos: todosCollection })
   .where(({ todos }) => eq(todos.completed, false))
   .select(({ todos }) => ({ id: todos.id, text: todos.text }))
)
</script>

<template>
  <div v-if="isLoading">Loading...</div>
  <ul v-else>
    <li v-for="todo in data" :key="todo.id">{{ todo.text }}</li>
  </ul>
</template>
```

## Documentation

- [Vue Adapter Guide](./guide.md) - Complete usage guide with examples
- [Version History](./versions.md) - Package changelog

## Links

- [npm Package](https://www.npmjs.com/package/@tanstack/vue-db)
- [GitHub Source](https://github.com/TanStack/db/tree/main/packages/vue-db)
