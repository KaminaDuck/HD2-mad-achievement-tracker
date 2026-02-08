---
title: "TanStack DB Version Log"
description: "Version history and changelog for TanStack DB core package"
type: "meta"
tags: ["changelog", "versions", "tanstack", "db", "reactive", "client-database"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "beta"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/TanStack/db/releases"
  - name: "TanStack DB 0.1 Announcement"
    url: "https://tanstack.com/blog/tanstack-db-0.1-the-embedded-client-database-for-tanstack-query"
related: ["./README.md", "./collections/README.md", "./frameworks/README.md"]
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "0.5.16"
---

# TanStack DB Version Log

**Package:** @tanstack/db
**Current version:** 0.5.16
**Last checked:** 2025-12-23

[Official Release Notes](https://github.com/TanStack/db/releases)

---

## Subpackage Version Logs

For collection and framework adapter versions, see their respective version logs:

### Collections
- [Electric Collection](./collections/electric/versions.md) - @tanstack/electric-db-collection
- [PowerSync Collection](./collections/powersync/versions.md) - @tanstack/powersync-db-collection
- [Query Collection](./collections/query/versions.md) - @tanstack/query-db-collection
- [RxDB Collection](./collections/rxdb/versions.md) - @tanstack/rxdb-db-collection
- [TrailBase Collection](./collections/trailbase/versions.md) - @tanstack/trailbase-db-collection
- [LocalStorage Collection](./collections/localstorage/versions.md) - Part of @tanstack/react-db
- [LocalOnly Collection](./collections/localonly/versions.md) - Part of @tanstack/react-db

### Framework Adapters
- [React](./frameworks/react/versions.md) - @tanstack/react-db
- [Vue](./frameworks/vue/versions.md) - @tanstack/vue-db
- [Svelte](./frameworks/svelte/versions.md) - @tanstack/svelte-db
- [Solid](./frameworks/solid/versions.md) - @tanstack/solid-db
- [Angular](./frameworks/angular/versions.md) - @tanstack/angular-db

---

## Core Package (@tanstack/db)

### Current Major: v0.5.x

#### v0.5.16 (2025-12-23)
Infinite query deletion fix.
- **Fixed:** `useLiveInfiniteQuery` not updating when deleting an item from a partial page with DESC order (#970)
- Root cause: `biggestObservedValue` was incorrectly set to the full row object instead of the indexed value

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Fdb%400.5.16)

#### v0.5.15 (2025-12-19)
Maintenance release with internal improvements.

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Fdb%400.5.15)

#### v0.5.9 (2025-12-01)
Duplicate key detection fix.
- **Fixed:** Bulk insert not detecting duplicate keys within the same batch (#929)
- Now throws `DuplicateKeyError` when duplicate keys are detected in a single bulk insert

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Fdb%400.5.9)

#### v0.5.0 (2025-11-12) **BREAKING**
3-valued logic and expression helpers.

**Breaking Change:**
- Implement 3-valued logic (true/false/unknown) for all comparison and logical operators (#765)
- Queries with null/undefined values now behave consistently with SQL databases
- `eq(anything, null)` now evaluates to `null` (UNKNOWN) and is filtered out - use `isNull()` instead

**New Features:**
- **New:** Expression helper utilities for parsing `LoadSubsetOptions` in `queryFn` (#763)
- **New:** `parseLoadSubsetOptions`, `parseWhereExpression`, `parseOrderByExpression`, `extractSimpleComparisons` functions
- **New:** Predicate comparison and merging utilities for predicate push-down (#763)
- **Fixed:** Uint8Array/Buffer comparison now works by content instead of reference (#779)

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Fdb%400.5.0)

---

### Previous Minor: v0.2.x - v0.4.x

#### v0.2.1 (2025-09-09)
Query builder function exports.
- Export `isUndefined` and `isNull` query builder functions (#515)

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Fdb%400.2.1)

#### v0.2.0 (2025-09-08) **BREAKING**
Enhanced ref system with nested optional properties.

**Breaking Change:**
- Code that previously ignored optionality now requires proper optional chaining syntax
- `employees.profile.bio` must now be `employees.profile?.bio`

**New Features:**
- **New:** Full support for deeply nested optional objects
- **New:** `isUndefined`, `isNull` query functions for proper null/undefined checks
- **Fixed:** `count` aggregate function now evaluates only non-null field values like SQL (#453)
- **Fixed:** `distinct` not applied to queries using a join (#510)
- **Fixed:** Too much data loaded when lazy collection of a join contains offset/limit (#508)
- **Improved:** `select` with better spread (`...obj`) support and nested projection (#389)

[Release Notes](https://github.com/TanStack/db/releases/tag/%40tanstack%2Fdb%400.2.0)

#### v0.1.0 (2025-07-29)
Initial beta release.

**Core Features:**
- **Collections:** Wrap existing `useQuery` calls (REST, tRPC, GraphQL, WebSocket)
- **Live queries:** Declare what data you need; DB streams only changed rows in <1ms
- **Transactions:** Optimistic mutations with automatic rollback on failure
- **Differential dataflow:** Only recomputes what changed (0.7ms to update 1 row in 100k collection)

**Performance:**
- Sub-millisecond queries across large datasets
- Enables "load everything once" architecture (20MB+ datasets)
- Eliminates re-render cascades from optimistic updates

**Query Builder:**
- Type-safe query DSL with `from()`, `where()`, `innerJoin()`
- Cross-collection joins with incremental computation
- Filter, sort, aggregate operations

[Release Notes](https://github.com/TanStack/db/releases) | [Announcement](https://tanstack.com/blog/tanstack-db-0.1-the-embedded-client-database-for-tanstack-query)

---

## Architecture Notes

TanStack DB uses differential dataflow (similar to Materialize-style streaming SQL) to keep query results updated incrementally. It maintains a normalized collection store in memory and only recomputes the parts of queries that changed. This enables loading larger datasets upfront and navigating instantly without API calls. Works with any data source through pluggable collection creators.

---

## Upgrade Guides

### Upgrading to v0.5.0

The 3-valued logic change affects queries with null/undefined values:

```typescript
// Before v0.5.0 - returned rows where age = null
q.from(...).where(({ person }) => eq(person.age, null))

// v0.5.0+ - use isNull() instead
q.from(...).where(({ person }) => isNull(person.age))

// Before v0.5.0 - returned rows where age < 18 OR age = null
q.from(...).where(({ person }) => lt(person.age, 18))

// v0.5.0+ - explicitly include nulls if needed
q.from(...).where(({ person }) => or(lt(person.age, 18), isNull(person.age)))
```

### Upgrading to v0.2.0

Add optional chaining when accessing nested optional properties:

```typescript
// Before v0.2.0
employees.profile.bio // Worked but type-unsafe

// v0.2.0+
employees.profile?.bio // Required syntax
```
