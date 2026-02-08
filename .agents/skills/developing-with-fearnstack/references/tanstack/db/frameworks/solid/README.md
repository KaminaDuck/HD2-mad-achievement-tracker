---
title: "Solid Adapter"
description: "Package overview for @tanstack/solid-db"
type: "meta"
tags: ["tanstack", "db", "solid", "signals", "adapter"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "npm"
    url: "https://www.npmjs.com/package/@tanstack/solid-db"
  - name: "GitHub"
    url: "https://github.com/TanStack/db/tree/main/packages/solid-db"
related: ["./guide.md", "./versions.md", "../README.md"]
version_log: "./versions.md"
current_version: "0.1.59"
---

# Solid Adapter

**Package:** `@tanstack/solid-db`
**Current Version:** 0.1.59

SolidJS signals for reactive live queries with TanStack DB. This adapter integrates TanStack DB with Solid's fine-grained reactivity system.

## Overview

The Solid adapter provides:

- **SolidJS signals** - Live queries return signals that automatically update when data changes
- **Fine-grained reactivity** - Leverages Solid's efficient reactive primitives
- **Familiar API** - Uses `createLiveQuery` pattern consistent with Solid conventions

## Installation

```bash
npm install @tanstack/solid-db
```

## Quick Example

```tsx
import { createLiveQuery } from '@tanstack/solid-db'
import { For } from 'solid-js'

function TodoList() {
  const todos = createLiveQuery((q) =>
    q.from({ todos: todosCollection })
  )

  return (
    <ul>
      <For each={todos().data}>
        {(todo) => <li>{todo.text}</li>}
      </For>
    </ul>
  )
}
```

## Documentation

- [Integration Guide](./guide.md) - Complete guide with usage patterns and examples
- [Version History](./versions.md) - Changelog and version details

## Related Adapters

- [React Adapter](../react/) - React hooks integration
- [Vue Adapter](../vue/) - Vue composables integration
- [Framework Overview](../README.md) - All available adapters
