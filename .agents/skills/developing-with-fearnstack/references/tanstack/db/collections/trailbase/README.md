---
title: "TrailBase Collection"
description: "Package overview for @tanstack/trailbase-db-collection"
type: "meta"
tags: ["tanstack", "db", "trailbase-collection", "trailbase", "sqlite", "sync"]
category: "typescript"
subcategory: "data-management"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "npm"
    url: "https://www.npmjs.com/package/@tanstack/trailbase-db-collection"
  - name: "GitHub"
    url: "https://github.com/TanStack/db/tree/main/packages/trailbase-db-collection"
related: ["./guide.md", "./versions.md", "../README.md"]
version_log: "./versions.md"
current_version: "0.1.60"
---

# TrailBase Collection

**Package**: `@tanstack/trailbase-db-collection`

**Current Version**: 0.1.60

## Overview

The TrailBase Collection package provides real-time synchronization between TanStack DB and [TrailBase](https://trailbase.io/), a self-hosted application backend. TrailBase offers built-in SQLite storage, authentication, admin UIs, and sync functionality in a single executable.

This collection enables:

- Automatic data synchronization with TrailBase Record APIs
- Real-time subscriptions when `enable_subscriptions` is configured
- Optimistic updates with automatic rollback on errors
- Data transformation via parse/serialize functions

## Documentation

- [Guide](./guide.md) - Complete usage guide with configuration options, data transformation, real-time subscriptions, and examples
- [Version Log](./versions.md) - Version history and changelog

## See Also

- [Collections Overview](../README.md) - All TanStack DB collection types
