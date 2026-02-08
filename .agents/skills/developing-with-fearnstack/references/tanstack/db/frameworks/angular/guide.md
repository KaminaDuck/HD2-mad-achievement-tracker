---
title: "TanStack DB Angular Guide"
description: "Angular observables and signals for reactive live queries with TanStack DB"
type: "framework-guide"
tags: ["tanstack", "db", "angular", "observables", "signals", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "Angular Adapter Overview"
    url: "https://tanstack.com/db/latest/docs/framework/angular/overview"
related: ["../react/guide.md", "../../concepts.md", "../../overview.md"]
version_log: "./versions.md"
---

# TanStack DB Angular Guide

Angular adapter for reactive live queries using observables and signals with TanStack DB.

## Installation

```bash
npm install @tanstack/angular-db
```

([Angular Adapter Overview][1])

## Basic Usage

### injectLiveQuery

The `injectLiveQuery` function creates a live query that automatically updates when data changes. It returns an observable-based result:

```typescript
import { Component } from '@angular/core';
import { injectLiveQuery } from '@tanstack/angular-db';
import { eq } from '@tanstack/db';
import { todosCollection } from './collections';

@Component({
  selector: 'app-todo-list',
  template: `
    @if (todos.isLoading()) {
      <div>Loading...</div>
    } @else {
      <ul>
        @for (todo of todos.data(); track todo.id) {
          <li>{{ todo.text }}</li>
        }
      </ul>
    }
  `
})
export class TodoListComponent {
  todos = injectLiveQuery((q) =>
    q.from({ todos: todosCollection })
     .where(({ todos }) => eq(todos.completed, false))
     .select(({ todos }) => ({ id: todos.id, text: todos.text }))
  );
}
```

([Angular Adapter Overview][1])

## Query Syntax

For comprehensive documentation on writing queries (filtering, joins, aggregations, ordering, etc.), see the [Concepts Guide](../../concepts.md). The query syntax is the same across all frameworks.

## Learn More

- [Concepts Guide](../../concepts.md) - Live queries, mutations, schemas
- [React Guide](../react/guide.md) - React adapter documentation
- [Vue Guide](../vue/guide.md) - Vue adapter documentation

## References

[1]: https://tanstack.com/db/latest/docs/framework/angular/overview "Angular Adapter Overview"
