---
title: "TanStack DB Reference Index"
description: "Reactive client-first store for API data management"
type: "meta"
tags: ["index", "tanstack", "db", "react", "data-management", "collections", "live-queries"]
category: "typescript"
subcategory: "data-management"
version: "0.5.16"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "TanStack DB Official Docs"
    url: "https://tanstack.com/db/latest"
  - name: "TanStack DB GitHub"
    url: "https://github.com/TanStack/db"
related: ["./overview.md", "./frameworks/react/guide.md", "./concepts.md", "./versions.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# TanStack DB Reference Index

Comprehensive reference documentation for TanStack DB, a reactive client-first store for managing API data with collections, live queries, and optimistic mutations.

## Core Documentation

### [Overview](./overview.md)
Introduction to TanStack DB covering core philosophy, key features, collection types, framework support, project statistics, and when to use the library.

### [Concepts](./concepts.md)
Deep-dive into TanStack DB core concepts including:
- Live queries (filtering, joins, aggregations, ordering)
- Mutations (insert, update, delete, transactions)
- Schema validation
- Collection architecture

### [Quick Start](./quick-start.md)
Get up and running with TanStack DB quickly.

### [Installation](./installation.md)
Installation instructions for all packages.

### [Error Handling](./error-handling.md)
Error handling patterns and best practices.

### [API Reference](./api-index.md)
API documentation and function reference.

---

## Collections

[**Collections Overview**](./collections/README.md) - Index of all collection types.

### Server-Synced Collections
| Collection | Package | Guide |
|------------|---------|-------|
| Query | `@tanstack/query-db-collection` | [Guide](./collections/query/guide.md) |
| Electric | `@tanstack/electric-db-collection` | [Guide](./collections/electric/guide.md) |
| PowerSync | `@tanstack/powersync-db-collection` | [Guide](./collections/powersync/guide.md) |
| RxDB | `@tanstack/rxdb-db-collection` | [Guide](./collections/rxdb/guide.md) |
| TrailBase | `@tanstack/trailbase-db-collection` | [Guide](./collections/trailbase/guide.md) |

### Local Collections
| Collection | Package | Guide |
|------------|---------|-------|
| LocalStorage | Part of `@tanstack/react-db` | [Guide](./collections/localstorage/guide.md) |
| LocalOnly | Part of `@tanstack/react-db` | [Guide](./collections/localonly/guide.md) |

---

## Framework Adapters

[**Framework Adapters Overview**](./frameworks/README.md) - Index of all framework adapters.

| Framework | Package | Guide |
|-----------|---------|-------|
| React | `@tanstack/react-db` | [Guide](./frameworks/react/guide.md) |
| Vue | `@tanstack/vue-db` | [Guide](./frameworks/vue/guide.md) |
| Svelte | `@tanstack/svelte-db` | [Guide](./frameworks/svelte/guide.md) |
| Solid | `@tanstack/solid-db` | [Guide](./frameworks/solid/guide.md) |
| Angular | `@tanstack/angular-db` | [Guide](./frameworks/angular/guide.md) |

---

## Version History

[**Version Log**](./versions.md) - Core package changelog and links to subpackage version logs.

---

## Related TanStack References

- [TanStack AI Overview](../ai/overview.md)
- [TanStack Query Overview](../query/overview.md)
- [TanStack Form Overview](../form/overview.md)
- [TanStack Router Overview](../router/overview.md)

## External Resources

- [Official Documentation](https://tanstack.com/db/latest)
- [GitHub Repository](https://github.com/TanStack/db)
- [Discord Community](https://discord.com/invite/tanstack)
- [NPM Package](https://www.npmjs.com/package/@tanstack/db)
