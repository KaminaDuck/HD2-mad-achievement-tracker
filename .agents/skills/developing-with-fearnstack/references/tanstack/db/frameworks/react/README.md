---
title: "React Adapter"
description: "Package overview for @tanstack/react-db"
type: "meta"
tags: ["tanstack", "db", "react", "hooks", "adapter"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "npm"
    url: "https://www.npmjs.com/package/@tanstack/react-db"
  - name: "GitHub"
    url: "https://github.com/TanStack/db/tree/main/packages/react-db"
related: ["./guide.md", "./versions.md", "../README.md"]
version_log: "./versions.md"
current_version: "0.1.60"
---

# @tanstack/react-db

The React adapter for TanStack DB, providing reactive hooks for client-side data management with collections, live queries, and optimistic mutations.

**Current Version:** 0.1.60

## Package Overview

`@tanstack/react-db` is the official React binding for TanStack DB. It provides React hooks that integrate seamlessly with the TanStack DB collection system, enabling fine-grained reactivity and automatic component updates when underlying data changes.

## Installation

```bash
npm install @tanstack/react-db
```

## React Hooks

The adapter provides three primary hooks:

### useLiveQuery

Creates live queries that automatically update components when data changes. Returns `{ data, isLoading }` with optional dependency array for external values.

### useLiveSuspenseQuery

Integrates with React Suspense for cleaner loading states. Data is guaranteed to be defined, eliminating manual loading checks.

### useLiveInfiniteQuery

Enables paginated data with live updates. Returns `{ data, pages, fetchNextPage, hasNextPage }` for handling infinite scroll patterns.

## Documentation

- [React Guide](./guide.md) - Complete guide to using TanStack DB with React
- [Version Log](./versions.md) - Version history and changelog

## Links

- [npm Package](https://www.npmjs.com/package/@tanstack/react-db)
- [GitHub Source](https://github.com/TanStack/db/tree/main/packages/react-db)
- [Official Documentation](https://tanstack.com/db/latest/docs/framework/react/overview)
