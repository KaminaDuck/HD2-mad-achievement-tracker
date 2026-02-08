---
title: "TanStack Router Overview"
description: "Fully type-safe routing for React and Solid applications"
type: "framework-guide"
tags: ["tanstack", "router", "react", "solid", "typescript", "routing", "spa", "type-safety"]
category: "typescript"
subcategory: "routing"
version: "1.0"
last_updated: "2025-11-02"
status: "stable"
sources:
  - name: "TanStack Router Home"
    url: "https://tanstack.com/router/latest"
  - name: "TanStack Router React Overview"
    url: "https://tanstack.com/router/latest/docs/framework/react/overview"
  - name: "TanStack Router GitHub"
    url: "https://github.com/tanstack/router"
related: ["react-guide.md", "routing-concepts.md", "../query/overview.md", "../form/overview.md"]
author: "unknown"
contributors: []
---

# TanStack Router Overview

TanStack Router is a fully type-safe routing solution built for React and Solid applications, emphasizing modern routing patterns while maintaining complete type safety without compromising developer experience. ([TanStack Router Home][1])

## What Is TanStack Router?

TanStack Router is **"a router for building React and Solid applications"** with comprehensive TypeScript support and type-safe navigation capabilities. ([React Overview][2]) The library distinguishes itself through its assertion that developers "can have your cake and eat it too"—combining type safety with developer-friendly APIs. ([TanStack Router Home][1])

It builds on established routing patterns while being "re-engineered from the ground up" for modern type safety standards. ([TanStack Router Home][1])

## Core Philosophy

TanStack Router treats routing as a comprehensive concern that goes beyond simple path matching. The framework provides:

- **Type-Safe Navigation**: 100% TypeScript support with fully typed APIs and auto-completed file paths during development ([TanStack Router Home][1])
- **State Management in URLs**: Search parameters function as a powerful state management solution—global, serializable, bookmarkable, and shareable ([React Overview][2])
- **First-Class Data Loading**: Parallel route loaders eliminate request waterfalls while maintaining type safety ([TanStack Router Home][1])
- **Performance by Default**: Automatic prefetching, built-in caching, and structural sharing for efficient state management ([TanStack Router Home][1])

## Key Features

### Type Safety & TypeScript

- 100% TypeScript support with fully typed APIs ([TanStack Router Home][1])
- Auto-completed file paths during development ([TanStack Router Home][1])
- Complete TypeScript inference without type loss ([React Overview][2])
- Type-safe navigation throughout the application ([React Overview][2])
- Structural sharing for efficient state management ([TanStack Router Home][1])
- Strict navigation enforcement ([TanStack Router Home][1])

### Routing Capabilities

- Nested and layout route support ([TanStack Router Home][1], [React Overview][2])
- Parallel route loaders that eliminate request waterfalls ([TanStack Router Home][1], [React Overview][2])
- Dynamic route handling with asynchronous elements ([TanStack Router Home][1])
- File-based routing generation ([React Overview][2])
- Code-based routing support ([React Overview][2])
- URL path parameters ([React Overview][2])
- Error boundaries for graceful failure handling ([TanStack Router Home][1], [React Overview][2])
- Route masking ([React Overview][2])

### Search Parameter Management

The platform includes "state-manager-grade search param APIs" with schemas, validation, type-safety, and pre/post manipulation capabilities—allowing URL-based state management comparable to traditional state managers. ([TanStack Router Home][1])

The search parameter system is described as potentially making "your state-manager jealous," suggesting it handles complex state management typically reserved for dedicated libraries. ([TanStack Router Home][1])

Features include:
- Type-safe JSON-based search parameter management ([React Overview][2])
- Custom search parameter serialization support ([React Overview][2])
- Search parameter middleware ([React Overview][2])
- Automatic parsing and serialization of JSON while maintaining type safety ([React Overview][2])

### Performance & Optimization

- Automatic prefetching mechanisms ([TanStack Router Home][1])
- Built-in data caching ([TanStack Router Home][1])
- Built-in SWR (Stale-While-Revalidate) caching for route loaders ([React Overview][2])
- Integration with client-side data caches like TanStack Query ([React Overview][2])
- Suspense and React transitions support ([TanStack Router Home][1])
- Pending element states during navigation ([TanStack Router Home][1])

### Data Loading Architecture

TanStack Router provides lightweight built-in caching with configurable lifecycle APIs. This design integrates seamlessly with external libraries like TanStack Query, SWR, Apollo, and Relay. ([React Overview][2])

### Additional Features

- Server-side rendering support ([React Overview][2])
- Inherited route context across route hierarchies ([React Overview][2])
- Dedicated DevTools for debugging and monitoring
- Zero external dependencies
- Lightweight bundle size (approximately 12KB) ([TanStack Router Home][1])

## Framework Support

TanStack Router supports both React and Solid.js frameworks, making it versatile across the JavaScript ecosystem. ([TanStack Router Home][1])

Each framework maintains framework-specific patterns while providing a consistent API surface.

## Project Statistics

**Community:**
- 33.2+ million NPM downloads
- 12,050+ GitHub stars
- 619 contributors
- 25,033 dependents

([TanStack Router Home][1])

**Technology:**
- Primary Language: TypeScript
- Bundle Size: ~12KB
- Zero dependencies
- MIT License

## When to Use TanStack Router

TanStack Router is ideal for applications that need:

- **Strong Type Safety**: Applications requiring compile-time guarantees for navigation and routing
- **Complex State Management**: Apps storing significant state in URL search parameters
- **Performance-Critical Applications**: Projects needing optimized data loading with minimal waterfalls
- **Large Codebases**: Projects benefiting from auto-completion and type inference across route hierarchies
- **Sophisticated Caching**: Integration with TanStack Query or other advanced caching solutions
- **Server-Side Rendering**: Applications requiring SSR or streaming SSR capabilities

## Routing Approaches

TanStack Router supports both file-based and code-based routing simultaneously, allowing flexibility based on project requirements. ([React Overview][2])

### File-Based Routing (Recommended)

Automatically generates routes from your file structure, offering optimal performance and developer experience. This approach provides "the best mix of performance, simplicity, and developer experience." ([TanStack Router Home][1])

### Code-Based Routing

Define routes programmatically while maintaining the same project scaffolding workflow. Both routing styles provide "full control over routing logic." ([TanStack Router Home][1])

## Integration with TanStack Ecosystem

TanStack Router integrates seamlessly with other TanStack libraries:

- **TanStack Query**: First-class integration for advanced data fetching and caching ([React Overview][2])
- **TanStack Form**: Compatible form state management
- **TanStack Table**: Works naturally with route-based data loading

## Getting Started

### Installation

```bash
npm install @tanstack/react-router
```

**Requirements:**
- React v18+ with `createRoot` support
- React-DOM v18+
- TypeScript v5.3+ (recommended)

### Quick Start

Use the `create-tsrouter-app` CLI tool for fastest scaffolding:

```bash
npx create-tsrouter-app@latest
```

The CLI guides you through configuration options including:
- File-based or code-based routing preference
- TypeScript support
- Tailwind CSS integration
- Toolchain selection
- Git initialization

## Design Principles

1. **Type Safety Without Compromise**: Every navigation, parameter, and search param is fully typed
2. **Performance by Default**: Built-in optimizations like prefetching and caching require no configuration
3. **Flexibility**: Support for both file-based and code-based routing approaches
4. **Integration-Friendly**: Works with existing data fetching libraries rather than replacing them
5. **Developer Experience**: Auto-completion, type inference, and helpful DevTools

## Unique Selling Points

- **Module-Level Type Registration**: Uses TypeScript declaration merging to make exported hooks and utilities type-aware across the entire application
- **Route Context**: Enables definition of context specific to routes, inherited by child routes—useful for authentication, theming, and global utilities ([React Overview][2])
- **Relative Navigation Model**: Every navigation involves an origin route and destination route, providing consistency and type safety
- **JSON-First Search Params**: Search params are automatically parsed into structured JSON with preserved data types (numbers, booleans, nested structures)

## Comparison with Other Routers

TanStack Router stands apart from traditional routers through:

- **Complete Type Safety**: Unlike React Router or Next.js App Router, every aspect is fully typed
- **Built-in Data Loading**: Parallel loaders with caching, unlike client-side-only routers
- **Search Param Sophistication**: JSON support and validation far beyond `URLSearchParams`
- **Performance Focus**: Automatic prefetching and optimistic navigation built-in
- **Framework Agnostic Core**: Works with React and Solid with consistent APIs

## Links

[1]: https://tanstack.com/router/latest "TanStack Router Home"
[2]: https://tanstack.com/router/latest/docs/framework/react/overview "TanStack Router React Overview"
[3]: https://github.com/tanstack/router "TanStack Router GitHub"
