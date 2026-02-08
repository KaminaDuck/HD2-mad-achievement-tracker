---
title: "LocalOnly Collection"
description: "Package overview for LocalOnly Collection (part of @tanstack/react-db)"
type: "meta"
tags: ["tanstack", "db", "localonly-collection", "in-memory", "ui-state", "temporary"]
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

# LocalOnly Collection

## Package

Part of `@tanstack/react-db` (not a separate npm package)

## Current Version

0.1.60 (follows @tanstack/react-db versioning)

## Description

LocalOnly Collection provides in-memory state management for temporary UI data that does not need to persist across browser sessions or synchronize across tabs. It is included in the core TanStack DB package and does not require a separate installation.

LocalOnly collections are ideal for:

- Temporary UI state (modals, sidebars, tooltips)
- Form draft data during the current session
- Client-side computed or derived data
- Wizard/multi-step form state
- In-memory caches that reset on page reload

Unlike LocalStorage or Query collections, LocalOnly collections store data purely in memory. When the page is refreshed or the browser is closed, all data is lost. This makes them the fastest collection type with zero persistence overhead.

## Documentation

- [Integration Guide](./guide.md) - Complete usage guide with examples
- [Version History](./versions.md) - Version changelog and notes
