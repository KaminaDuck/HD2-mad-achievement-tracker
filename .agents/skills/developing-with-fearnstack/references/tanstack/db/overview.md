---
title: "TanStack DB Overview"
description: "Reactive client-first store for API data management"
type: "framework-guide"
tags: ["tanstack", "db", "react", "data-management", "collections", "live-queries", "optimistic-mutations", "typescript"]
category: "typescript"
subcategory: "data-management"
version: "0.5.15"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "TanStack DB Overview"
    url: "https://tanstack.com/db/latest/docs/overview"
  - name: "TanStack DB Home"
    url: "https://tanstack.com/db/latest"
  - name: "TanStack DB GitHub"
    url: "https://github.com/TanStack/db"
  - name: "TanStack API Index Docs"
    url: "https://tanstack.com/db/latest/docs/reference/index"
related: ["./frameworks/react/guide.md", "./concepts.md", "./api-index.md", "./versions.md"]
author: "unknown"
contributors: []
---

# TanStack DB Overview

TanStack DB is "the reactive client store for your API" - a library designed to help developers build fast, modern applications by addressing common performance and architectural challenges in client-side data management. ([TanStack DB Home][2])

## What is TanStack DB?

TanStack DB is a client-first data management library that keeps applications "reactive, consistent and blazing fast" through collections, live queries, and optimistic mutations. ([TanStack DB Home][2]) It emphasizes normalized data architecture while providing sub-millisecond query performance.

## Core Problems It Solves

The library addresses three primary challenges: ([TanStack DB Overview][1])

1. **Endpoint sprawl prevention** - Loading data into normalized collections eliminates the need for multiple view-specific API endpoints
2. **Performance optimization** - Sub-millisecond live queries and real-time reactivity keep applications responsive
3. **Instant interactions** - Optimistic writes happen immediately on the client before server confirmation

## Key Features

### Collections

Typed object sets that sync/load data and support cross-collection querying with live queries and optimistic mutations. ([TanStack DB Home][2]) Collections decouple data loading from component binding, enabling reusable data sources.

### Live Queries

Reactive queries powered by differential dataflow (d2ts) with join, filter, and aggregation support. ([TanStack DB Home][2]) Performance benchmarks show ~0.7ms updates for single-row changes in 100,000-item collections. ([TanStack DB Overview][1])

### Optimistic Mutations

Batch local changes across collections with automatic backend sync and rollback management. ([TanStack DB Home][2]) Insert, update, and delete operations execute instantly on the client before server confirmation.

### Three Sync Modes

TanStack DB supports different data loading approaches optimized for various scenarios: ([TanStack DB Overview][1])

- **Eager mode** (default): Full collection loading for smaller datasets
- **On-demand mode**: Query-driven loading for large datasets (>50k rows)
- **Progressive mode**: Immediate subset with background synchronization

### Schema Validation

Collections support Standard Schema-compatible validators including: ([TanStack DB Overview][1])

- Zod
- Valibot
- ArkType
- Effect

This enables runtime validation, type transformations, and default values.

## Collection Types

### Fetch Collections

- **QueryCollection** - TanStack Query integration for REST APIs ([TanStack DB Overview][1])

### Sync Collections

- **ElectricCollection** - ElectricSQL integration ([TanStack DB Overview][1])
- **TrailBaseCollection** - TrailBase backend ([TanStack DB Overview][1])
- **RxDBCollection** - RxDB persistence ([TanStack DB Overview][1])
- **PowerSyncCollection** - PowerSync SQLite ([TanStack DB Overview][1])

### Local Collections

- **LocalStorageCollection** - Persistent local storage ([TanStack DB Overview][1])
- **LocalOnlyCollection** - In-memory state ([TanStack DB Overview][1])

## Framework Support

TanStack DB works with: ([TanStack DB Overview][1])

- React (with useLiveQuery and useLiveSuspenseQuery hooks)
- Vue
- Angular
- Solid
- Svelte

Each framework has dedicated adapters maintaining consistent API patterns.

## Data Flow Model

TanStack DB implements unidirectional data flow with: ([TanStack DB Overview][1])

1. **Inner optimistic loop** - Instant local updates
2. **Outer server synchronization loop** - Background persistence

Local changes are applied immediately as optimistic state, then persisted to your backend, and finally the optimistic state is replaced by the confirmed server state once it syncs back.

## Project Statistics

**Community:** ([TanStack DB Home][2], [TanStack DB GitHub][3])
- 1.1+ million NPM downloads
- 3,400+ GitHub stars
- 56 contributors
- MIT License

**Technology:** ([TanStack DB GitHub][3])
- Primary Language: TypeScript (99.9%)
- Latest Release: @tanstack/query-db-collection@1.0.6 (December 2025)
- Status: **BETA**

## Ecosystem Integration

TanStack DB operates within a broader TanStack ecosystem that includes: ([TanStack DB GitHub][3])

- TanStack Query (asynchronous state management)
- TanStack Router (type-safe routing)
- TanStack Table (headless datagrids)
- TanStack Virtual (virtualized rendering)
- TanStack Form (type-safe form state)

## Architecture Philosophy

The project emphasizes keeping backends simple while enabling sophisticated client-side querying through normalized data patterns. ([TanStack DB Overview][1]) Rather than duplicating server queries, TanStack DB loads data into normalized collections and performs complex queries entirely on the client.

## When to Use TanStack DB

**Ideal for:**
- Applications requiring real-time data synchronization
- Projects with complex client-side querying needs
- Multi-collection data relationships with joins
- Offline-first or optimistic UI patterns
- Applications with large datasets requiring fine-grained reactivity
- Teams wanting to reduce API endpoint complexity

**Consider alternatives if:**
- Simple data fetching without complex queries (use TanStack Query instead)
- Server-side rendering without client interactivity
- Applications without cross-collection relationships
- Projects requiring server-authoritative data only

## Getting Started

Install the core package and framework adapter:

```bash
npm install @tanstack/db @tanstack/react-db
```

See the [React Guide](react-guide.md) for detailed setup instructions and the [Concepts](concepts.md) for deep-dives on live queries, mutations, and schemas.

## Links

**Official Documentation:**
- [TanStack DB Documentation](https://tanstack.com/db/latest)
- [TanStack DB Overview](https://tanstack.com/db/latest/docs/overview)

**Repository:**
- [GitHub Repository](https://github.com/TanStack/db)

**Community:**
- [Discord Community](https://discord.com/invite/tanstack)
- [GitHub Discussions](https://github.com/TanStack/db/discussions)

[1]: https://tanstack.com/db/latest/docs/overview "TanStack DB Overview"
[2]: https://tanstack.com/db/latest "TanStack DB Home"
[3]: https://github.com/TanStack/db "TanStack DB GitHub Repository"
