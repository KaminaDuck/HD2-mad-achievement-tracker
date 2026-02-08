---
title: "TanStack Router Reference Index"
description: "Fully type-safe routing for React and Solid applications"
type: "meta"
tags: ["index", "tanstack", "router", "react", "typescript", "routing"]
category: "typescript"
subcategory: "routing"
version: "1.0"
last_updated: "2025-11-02"
status: "stable"
sources: []
related: ["overview.md", "react-guide.md", "routing-concepts.md", "versions.md", "../query/README.md", "../form/README.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# TanStack Router Reference Index

Comprehensive reference documentation for TanStack Router, a fully type-safe routing solution for React and Solid applications with first-class TypeScript support, advanced data loading, and URL-based state management.

## Documentation Files

### [Overview](overview.md)
Introduction to TanStack Router covering core philosophy, key features, framework support, project statistics, type safety, routing capabilities, search parameter management, data loading architecture, performance features, and when to use the library.

### [React Guide](react-guide.md)
Complete guide to using TanStack Router with React including:
- Installation and project setup
- Type safety and TypeScript integration
- Data loading with loaders and caching
- Search parameters with validation
- Navigation APIs and patterns
- Route preloading strategies
- DevTools installation and usage
- Server-side rendering (SSR)
- Best practices and common patterns
- Troubleshooting guide

### [Routing Concepts](routing-concepts.md)
Detailed explanation of TanStack Router concepts including:
- Anatomy of routes and root routes
- Basic routes and index routes
- Dynamic route segments
- Splat/catch-all routes
- Optional path parameters
- Layout routes and pathless layout routes
- Non-nested routes
- File exclusion patterns
- Pathless route group directories

## Related TanStack References

- [TanStack Query Overview](../query/overview.md) - Data fetching and caching
- [TanStack Query React Guide](../query/react-guide.md) - Using Query with React
- [TanStack Form Overview](../form/overview.md) - Form state management
- [TanStack Form React Guide](../form/react-guide.md) - Using Form with React

## External Resources

- [Official Documentation](https://tanstack.com/router/latest)
- [GitHub Repository](https://github.com/TanStack/router)
- [React Quick Start](https://tanstack.com/router/latest/docs/framework/react/quick-start)
- [Discord Community](https://discord.com/invite/tanstack)
- [DevTools](https://tanstack.com/router/latest/docs/framework/react/devtools)

## Key Features

- **100% Type-Safe**: Complete TypeScript inference for routes, navigation, and search params
- **File-Based Routing**: Automatic route generation from file structure
- **Advanced Data Loading**: Parallel loaders with built-in SWR caching
- **URL State Management**: Type-safe JSON search parameters with validation
- **Performance**: Auto-prefetching, code-splitting, and optimistic navigation
- **DevTools**: Visual debugging for route matching and data loading
- **SSR Support**: Full server-side rendering with streaming capabilities

## Quick Start

```bash
# Install TanStack Router
npm install @tanstack/react-router

# Create new project with CLI
npx create-tsrouter-app@latest

# Install DevTools (development)
npm install @tanstack/react-router-devtools
```

## Requirements

- React v18+ with `createRoot` support
- React-DOM v18+
- TypeScript v5.3+ (recommended)

## Project Statistics

- 33.2+ million NPM downloads
- 12,050+ GitHub stars
- 619 contributors
- ~12KB bundle size
- Zero dependencies
