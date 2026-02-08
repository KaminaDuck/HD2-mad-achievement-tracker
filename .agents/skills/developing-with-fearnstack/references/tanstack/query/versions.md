---
title: "TanStack Query Version Log"
description: "Version history and changelog for TanStack Query"
type: "meta"
tags: ["changelog", "versions", "tanstack", "query", "react-query"]
category: "typescript"
subcategory: "data-fetching"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/TanStack/query/releases"
  - name: "TanStack Query v5 Announcement"
    url: "https://tanstack.com/blog/announcing-tanstack-query-v5"
related: []
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "5.90.12"
---

# TanStack Query Version Log

**Current version documented:** 5.90.12
**Last checked:** 2025-12-23

[Official Release Notes](https://github.com/TanStack/query/releases)

---

## Current Major: v5.x

### v5.90.12 (2025-12-04)
Maintenance release.
- Updated React and Next.js dependencies (#9944)
- Core library: @tanstack/query-core@5.90.12
- React bindings: @tanstack/react-query@5.90.12

[Release Notes](https://github.com/TanStack/query/releases/tag/v5.90.12)

### v5.0.0 (2023-10-16) **BREAKING**
Major release with significant improvements.

**New Features:**
- **1st class Suspense support:** `useSuspenseQuery`, `useSuspenseInfiniteQuery`, `useSuspenseQueries` - no longer experimental
- **Simplified optimistic updates:** Leverage returned variables from `useMutation` without manual cache updates
- **Sharable mutation state:** New `useMutationState` hook for accessing mutation state across components (#2304)
- **Streaming with RSC:** Experimental `react-query-next-experimental` adapter for Next.js suspense streaming
- **Improved Infinite Queries:** Prefetch multiple pages at once, `maxPages` option to limit cached pages
- **New DevTools:** Framework-agnostic rewrite with UI revamp, cache inline editing, light mode
- **Fine-grained persistence:** New `experimental_createPersister` plugin for per-query persistence
- **`queryOptions` API:** Type-safe way to share query definitions between hooks and imperative methods

**Breaking Changes:**
- Unified API - removed all overloads, always pass one object to hooks
- Renamed `cacheTime` to `gcTime` (garbage collection time)
- Merged `keepPreviousData` into `placeholderData`
- Renamed `loading` state to `pending`
- Removed callbacks (`onSuccess`, `onError`, `onSettled`) from `useQuery`
- ~20% smaller bundle size than v4

[Release Notes](https://github.com/TanStack/query/releases/tag/v5.0.0) | [Announcement](https://tanstack.com/blog/announcing-tanstack-query-v5) | [Migration Guide](https://tanstack.com/query/latest/docs/framework/react/guides/migrating-to-v5)

---

## Previous Major Versions

### v4.0.0 (2022-07-18) **BREAKING**
Rebranding from React Query to TanStack Query.
- Framework-agnostic core
- Added Vue Query, Solid Query, Svelte Query
- Improved caching strategies
- Better mutation handling

[Release Notes](https://github.com/TanStack/query/releases/tag/v4.0.0) | [Migration Guide](https://tanstack.com/query/v4/docs/framework/react/guides/migrating-to-react-query-4)

### v3.0.0 (2020-12-14) **BREAKING**
Major rewrite with improved developer experience.
- New caching model
- Improved devtools
- Better TypeScript support
- Simplified API

[Release Notes](https://github.com/TanStack/query/releases/tag/v3.0.0)

### v2.0.0 (2020-03-15)
Introduced mutations and query invalidation.

[Release Notes](https://github.com/TanStack/query/releases/tag/v2.0.0)

### v1.0.0 (2019-11-08)
Initial stable release as React Query.
- Core query caching
- Automatic refetching
- Pagination support

[Release Notes](https://github.com/TanStack/query/releases/tag/v1.0.0)

---

## Architecture Notes

TanStack Query provides powerful async state management with intelligent caching, background synchronization, request deduplication, and optimistic updates. The v5 release focuses on simplifying APIs while maintaining full type safety. The library is framework-agnostic with adapters for React, Vue, Solid, Svelte, and Angular.
