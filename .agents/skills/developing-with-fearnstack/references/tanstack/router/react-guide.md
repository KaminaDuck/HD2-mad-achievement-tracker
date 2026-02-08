---
title: "TanStack Router React Guide"
description: "Complete guide to using TanStack Router with React applications"
type: "framework-guide"
tags: ["tanstack", "router", "react", "typescript", "spa", "data-loading", "navigation", "type-safety"]
category: "typescript"
subcategory: "routing"
version: "1.0"
last_updated: "2025-11-02"
status: "stable"
sources:
  - name: "TanStack Router React Overview"
    url: "https://tanstack.com/router/latest/docs/framework/react/overview"
  - name: "TanStack Router Quick Start"
    url: "https://tanstack.com/router/latest/docs/framework/react/quick-start"
  - name: "TanStack Router Type Safety"
    url: "https://tanstack.com/router/latest/docs/framework/react/guide/type-safety"
  - name: "TanStack Router Data Loading"
    url: "https://tanstack.com/router/latest/docs/framework/react/guide/data-loading"
  - name: "TanStack Router Search Params"
    url: "https://tanstack.com/router/latest/docs/framework/react/guide/search-params"
  - name: "TanStack Router Navigation"
    url: "https://tanstack.com/router/latest/docs/framework/react/guide/navigation"
  - name: "TanStack Router Preloading"
    url: "https://tanstack.com/router/latest/docs/framework/react/guide/preloading"
  - name: "TanStack Router DevTools"
    url: "https://tanstack.com/router/latest/docs/framework/react/devtools"
  - name: "TanStack Router SSR"
    url: "https://tanstack.com/router/latest/docs/framework/react/guide/ssr"
related: ["overview.md", "routing-concepts.md", "../query/react-guide.md", "../form/react-guide.md"]
author: "unknown"
contributors: []
---

# TanStack Router React Guide

Complete guide to using TanStack Router with React applications, covering installation, configuration, data loading, navigation, type safety, and advanced patterns.

## Installation

### Requirements

- React v18+ with `createRoot` support
- React-DOM v18+
- TypeScript v5.3+ (recommended)

([Quick Start][2])

### Package Installation

```bash
npm install @tanstack/react-router
# or
pnpm add @tanstack/react-router
```

([Quick Start][2])

### DevTools Installation

```bash
npm install @tanstack/react-router-devtools
```

([DevTools][8])

## Project Setup

### Quick Start with CLI

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

([Quick Start][2])

### File-Based Routing Setup

File-based routing automatically generates routes from your file structure:

```bash
npx create-tsrouter-app@latest my-app --template file-router
cd my-app && npm run dev
```

This approach provides "the best mix of performance, simplicity, and developer experience." ([Quick Start][2])

### Code-Based Routing Setup

Define routes programmatically:

```bash
npx create-tsrouter-app@latest my-app
cd my-app && npm run dev
```

Both routing styles provide "full control over routing logic." ([Quick Start][2])

## Type Safety

### Core TypeScript Integration

TanStack Router is built with comprehensive TypeScript support that enables **full type inference piped through the entire routing experience**. The framework allows writing less explicit types while maintaining high confidence in code evolution. ([Type Safety][3])

### Module-Level Type Registration

The framework uses TypeScript declaration merging on a `Register` interface to make exported hooks and utilities type-aware:

> "For the types of your router to work with top-level exports like Link, useNavigate, useParams, etc. they must permeate the TypeScript module boundary and be registered right into the library."

([Type Safety][3])

This pattern enables top-level hooks to carry exact router-specific types.

### Route Definition Type Safety

- **File-based routing** automatically handles much type-safety through hierarchical structure ([Type Safety][3])
- **Code-based routing** requires explicit `getParentRoute` specification to preserve parent route types through the hierarchy ([Type Safety][3])
- Child routes must reference parents to maintain search params and context types from ancestor layouts ([Type Safety][3])

### Context-Based Type Hints

Components require `from` parameters to disambiguate their position in the route hierarchy. For example, the `useNavigate` hook needs awareness of which route context it operates within. The `strict: false` option provides relaxed typing for shared components across multiple routes. ([Type Safety][3])

### Router Context Typing

`createRootRouteWithContext<T>()` enforces type contracts throughout the entire route tree, requiring matching context object shapes at router instantiation. ([Type Safety][3])

### Type Safety Best Practices

Performance optimization strategies include:

- **Minimize loader type inference** by using async functions that implicitly return `Promise<void>` ([Type Safety][3])
- **Narrow route references** using `from` or `to` parameters rather than relying on union types across all routes ([Type Safety][3])
- **Prefer object syntax** over tuples in `addChildren()` for complex route trees ([Type Safety][3])
- **Avoid broad type annotations** like bare `LinkProps`; use `as const satisfies` for precise inference instead ([Type Safety][3])

## Data Loading

### Core Concept

TanStack Router treats data loading as a first-class routing concern. When a route is navigated to, the framework executes a coordinated sequence that matches routes, preloads dependencies, and loads data—all before rendering components. ([Data Loading][4])

### Loading Lifecycle

The router follows this execution sequence:

1. **Route Matching** (top-down): Validates path parameters and search parameters
2. **Route Pre-Loading** (serial): Executes `beforeLoad` hooks and error handling
3. **Route Loading** (parallel): Fetches component code and data via `loader` functions

([Data Loading][4])

### Loader Functions

Route loaders are simple functions that fetch and return data:

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
})
```

([Data Loading][4])

Loaders receive a context object containing:
- **params**: Path parameters
- **deps**: Dependencies from `loaderDeps`
- **context**: Router and route context objects
- **abortController**: Signal for cancelling outdated requests
- **preload**: Boolean indicating preload vs. normal load
- **cause**: "enter", "stay", or "preload"

([Data Loading][4])

### Built-In Caching Strategy

TanStack Router includes a **Stale-While-Revalidate (SWR)** caching system:

- Data is cached based on route pathname and explicit dependencies
- By default, `staleTime` is **0ms** (always revalidate)
- Preloaded data stays fresh for **30 seconds** by default
- Cached data is garbage collected after **30 minutes** (`gcTime`)

([Data Loading][4])

This means previously visited routes display instantly while fresh data loads in the background.

### Controlling Cache Behavior

**Key Configuration Options:**

- `loaderDeps`: Specify search params or other dependencies affecting cache keys
- `staleTime`: How long (in milliseconds) data remains fresh before revalidation
- `gcTime`: How long cached data persists when unused
- `shouldReload`: Function-based logic for conditional reloading

([Data Loading][4])

Example with pagination:

```tsx
export const Route = createFileRoute('/posts')({
  loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  loader: ({ deps: { offset, limit } }) =>
    fetchPosts({ offset, limit }),
})
```

([Data Loading][4])

### Consuming Loader Data

Access loaded data via the `useLoaderData` hook:

```tsx
const posts = Route.useLoaderData()
```

Or from nested components using `getRouteApi`:

```tsx
const routeApi = getRouteApi('/posts')
const data = routeApi.useLoaderData()
```

([Data Loading][4])

### Integration with External Caches

For applications needing sophisticated caching (like TanStack Query):

- Disable router caching by setting `staleTime: Infinity`
- Set `defaultPreloadStaleTime: 0` to trigger loader functions on every event
- Let external caching libraries handle deduplication and persistence

([Data Loading][4])

### Error Handling

Routes support three error-handling mechanisms:

1. **onError**: Callback executed when loader fails
2. **errorComponent**: Custom UI for displaying errors with retry capability
3. **onCatch**: Catches boundary errors during rendering

([Data Loading][4])

The framework provides sensible defaults, including a built-in `ErrorComponent` for uncaught errors.

### Performance Features

- **Suspense Integration**: Loaders suspend component rendering until data resolves ([Data Loading][4])
- **Parallel Loading**: Multiple route loaders execute simultaneously ([Data Loading][4])
- **Preloading**: Routes can be preloaded before navigation using the `preload` option ([Data Loading][4])
- **Pending UI**: Optional `pendingComponent` displays after 1 second (configurable) ([Data Loading][4])
- **Abort Support**: Cancels in-flight requests when routes become obsolete ([Data Loading][4])

## Search Parameters

### Core Philosophy

TanStack Router treats search parameters as **application state living in the URL**, moving beyond traditional `URLSearchParams` limitations. The framework enables developers to store complex data structures (nested arrays, objects) with proper type safety and validation. ([Search Params][5])

### JSON-First Architecture

Search params are automatically parsed into structured JSON. For example:

```
/shop?pageIndex=3&includeCategories=%5B%22electronics%22%2C%22gifts%22%5D
```

Converts to properly typed JSON with preserved data types (numbers, booleans, nested structures). ([Search Params][5])

### Validation & Type Safety

Routes define a `validateSearch` option that receives raw params and returns a typed object:

```tsx
validateSearch: (search: Record<string, unknown>): ProductSearch => {
  return {
    page: Number(search?.page ?? 1),
    filter: (search.filter as string) || '',
    sort: (search.sort as ProductSearchSortOptions) || 'newest',
  }
}
```

([Search Params][5])

**Notable quote:** "Search params represent application state, so inevitably, we will expect them to have the same DX as other state managers." ([Search Params][5])

### Validation Library Support

The framework supports multiple validation libraries through adapters:

- **Zod**: Via `@tanstack/zod-adapter` with `zodValidator()`
- **Valibot**: Direct support through Standard Schema implementation
- **Arktype & Effect/Schema**: Standard Schema compliant

([Search Params][5])

### Reading Search Params

Three approaches available:

1. **In Components**: `useSearch()` hook with typed results
2. **In Route Configuration**: Access via `beforeLoad` options
3. **Outside Routes**: `getRouteApi()` for code-split components

([Search Params][5])

### Writing Search Params

Modifications happen through:

- `<Link search={(prev) => ({...prev, newParam: value})} />`
- `useNavigate()` with search option
- `router.navigate({ search: {...} })`

([Search Params][5])

### Search Middlewares

Transform params before URL generation using `retainSearchParams()` and `stripSearchParams()` for common patterns like preserving root-level params or removing default values. ([Search Params][5])

### Design Advantages

The approach addresses limitations where "URLSearchParams modifications are tightly coupled with pathname" by enabling independent search param updates without pathname changes. ([Search Params][5])

## Navigation

### Core Navigation Concepts

TanStack Router implements a **relative navigation model** where every navigation involves an origin route (`from`) and destination route (`to`). The framework emphasizes that "every navigation within an app is relative, even if you aren't using explicit relative path syntax." ([Navigation][6])

### Navigation APIs

#### Link Component

The primary navigation method generates actual `<a>` tags with valid `href` attributes, supporting cmd/ctrl+click functionality:

```tsx
<Link to="/about">About</Link>
```

([Navigation][6])

Supports dynamic parameters, relative paths, and optional parameters with intuitive syntax.

#### useNavigate Hook

Returns an imperative `navigate` function for side-effect-based navigation:

```tsx
const navigate = useNavigate({ from: '/posts/$postId' })
navigate({ to: '/posts/$postId', params: { postId } })
```

([Navigation][6])

#### Navigate Component

Triggers immediate navigation on component mount without rendering output. ([Navigation][6])

#### router.navigate Method

Universal navigation API available anywhere your router instance exists, bypassing hook constraints. ([Navigation][6])

### Key Navigation Features

**Type Safety**: Automatically validates path parameters and search params at compile-time based on route definitions. ([Navigation][6])

**Search Params**: Can be updated individually using function syntax: `search={(prev) => ({ ...prev, page: 2 })}` without supplying complete state. ([Navigation][6])

**Optional Parameters**: Using `{-$paramName}` syntax enables flexible routing with parameter inheritance or removal strategies. ([Navigation][6])

**Link Preloading**: `preload="intent"` automatically loads routes on hover, improving perceived performance when combined with caching libraries. ([Navigation][6])

**Active States**: Links expose `activeProps`, `inactiveProps`, and `data-status` attributes for styling based on navigation state. ([Navigation][6])

## Preloading

### Overview

Preloading enables loading routes before user navigation occurs, improving perceived performance by preparing resources in advance. ([Preloading][7])

### Preloading Strategies

TanStack Router supports three approaches:

1. **Intent-Based**: Uses hover and touch events on `<Link>` components to trigger preloading when users show navigation intent
2. **Viewport Visibility**: Leverages the Intersection Observer API to preload links visible in the viewport
3. **Render-Based**: Immediately preloads dependencies when a `<Link>` component renders

([Preloading][7])

### Memory Management

"Unused preloaded data is removed after 30 seconds by default" via the `defaultPreloadMaxAge` option. When a route transitions from preloaded to active navigation, the cached version becomes the router's pending match state. ([Preloading][7])

### Configuration

**Default Setup:**
```tsx
const router = createRouter({
  defaultPreload: 'intent',
  defaultPreloadDelay: 50, // milliseconds
  defaultPreloadStaleTime: 30000
})
```

([Preloading][7])

**Per-Route Customization:**
Individual routes can override defaults using `preloadStaleTime` in route options. ([Preloading][7])

### External Library Integration

When using React Query or similar caching solutions, set `defaultPreloadStaleTime: 0` to bypass TanStack Router's built-in caching and allow your library to manage data freshness independently. ([Preloading][7])

### Manual Preloading

Use `router.preloadRoute()` for programmatic control or `router.loadRouteChunk()` to preload only JavaScript bundles without triggering full route loaders. ([Preloading][7])

## DevTools

### Installation

The DevTools are available as a separate package:

```bash
npm install @tanstack/react-router-devtools
```

([DevTools][8])

### Core Features

**Visualization & Debugging**: The DevTools provide "dedicated devtools" that help visualize the internal mechanics of TanStack Router and can "save you hours of debugging." ([DevTools][8])

**Production Flexibility**: By default, DevTools hide in production environments. However, developers can import `TanStackRouterDevtoolsInProd` to enable them in production builds when needed. ([DevTools][8])

### Deployment Modes

**Floating Mode**: Renders as a fixed, floating element with a toggleable corner button. Settings persist in localStorage across page reloads. ([DevTools][8])

**Fixed Mode**: Using `TanStackRouterDevtoolsPanel`, developers can control precise positioning and integrate with Shadow DOM targets. ([DevTools][8])

**Embedded Mode**: Allows direct embedding as a standard component with custom styling via className and inline styles. ([DevTools][8])

### Integration Patterns

- **Automatic Detection**: Place DevTools inside root routes for automatic router instance connection ([DevTools][8])
- **Manual Binding**: Pass the router instance explicitly via the `router` prop for flexible positioning ([DevTools][8])
- **Customization**: Configure button positions, panel styling, and container elements through extensive props ([DevTools][8])

## Server-Side Rendering (SSR)

### Overview

TanStack Router provides comprehensive server-side rendering support through dedicated utilities for both streaming and non-streaming scenarios. ([SSR][9])

### SSR Setup

#### Router Creation

The router must be created consistently across server and client using a shared factory function:

```tsx
export function createRouter() {
  return createTanstackRouter({ routeTree })
}
```

([SSR][9])

#### Non-Streaming SSR

**Server-side rendering** involves two approaches:

1. **Using `defaultRenderHandler`**: Automatically manages hydration/dehydration
2. **Using `renderRouterToString`**: Provides manual control with custom providers

([SSR][9])

Both require the `RouterServer` component to implement automatic memory-based history on the server.

#### Streaming SSR

For modern applications with deferred data, use `defaultStreamHandler` or `renderRouterToStream` to incrementally send markup as it renders. ([SSR][9])

### Key SSR Features

**Automatic Loader Dehydration**: "Resolved loader data fetched by routes is automatically dehydrated and rehydrated" when following standard SSR patterns. ([SSR][9])

**Server History**: The framework automatically uses `createMemoryHistory` on the server instead of browser history, handling the lack of `window` object. ([SSR][9])

**Data Serialization**: Built-in support for common types including `undefined`, `Date`, `Error`, and `FormData`. ([SSR][9])

### Client Hydration

Hydration is straightforward—create the router and render with `RouterClient`:

```tsx
hydrateRoot(document, <RouterClient router={router} />)
```

([SSR][9])

### Important Notes

⚠️ The APIs are experimental and subject to change until TanStack Start reaches stable status. Complex data types like `Map` or `Set` may require custom serializers. ([SSR][9])

## Best Practices

### Type Safety

1. Use `from` parameters to provide route context for better type inference
2. Leverage `createRootRouteWithContext<T>()` for type-safe router context
3. Minimize broad union types in loader return values
4. Use Standard Schema-compliant validators (Zod, Valibot) for search params

### Data Loading

1. Specify `loaderDeps` for cache key dependencies
2. Configure appropriate `staleTime` for your use case
3. Use external caching (TanStack Query) for complex scenarios
4. Implement error boundaries for graceful degradation
5. Leverage parallel loading by avoiding sequential data dependencies

### Search Parameters

1. Validate search params with schema libraries
2. Use search param middlewares for common transformations
3. Store complex state in search params for shareability
4. Avoid coupling search param updates with pathname changes

### Navigation

1. Use `<Link>` components for navigable elements (better a11y)
2. Enable `preload="intent"` for perceived performance improvements
3. Leverage relative navigation for maintainability
4. Use type-safe navigation APIs to catch errors at compile-time

### Performance

1. Enable preloading strategies appropriate for your application
2. Configure garbage collection times based on memory constraints
3. Use code-splitting with lazy loading for large applications
4. Implement proper cache invalidation strategies

### Development

1. Install and use DevTools during development
2. Monitor route matching and loader execution
3. Validate search param schemas early
4. Test navigation paths with different parameter combinations

## Common Patterns

### Protected Routes

```tsx
export const Route = createFileRoute('/dashboard')({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: '/login' })
    }
  },
})
```

### Pagination with Search Params

```tsx
export const Route = createFileRoute('/users')({
  validateSearch: (search) => ({
    page: Number(search?.page ?? 1),
    pageSize: Number(search?.pageSize ?? 20),
  }),
  loaderDeps: ({ search: { page, pageSize } }) => ({ page, pageSize }),
  loader: ({ deps: { page, pageSize } }) =>
    fetchUsers({ page, pageSize }),
})
```

### TanStack Query Integration

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params, context: { queryClient } }) => {
    return queryClient.ensureQueryData({
      queryKey: ['posts', params.postId],
      queryFn: () => fetchPost(params.postId),
    })
  },
})
```

### Error Handling with Retry

```tsx
export const Route = createFileRoute('/data')({
  errorComponent: ({ error, reset }) => (
    <div>
      <p>Error: {error.message}</p>
      <button onClick={reset}>Retry</button>
    </div>
  ),
})
```

## Troubleshooting

### Type Errors

**Issue**: Types not working with top-level exports

**Solution**: Ensure your router is properly registered with TypeScript module augmentation and you're using `from` parameters in components.

### Cache Issues

**Issue**: Stale data displayed after navigation

**Solution**: Review `loaderDeps` to ensure all relevant dependencies are included in cache keys, or adjust `staleTime` configuration.

### Navigation Not Working

**Issue**: Type errors on navigation

**Solution**: Verify route definitions match navigation parameters and check that parent routes are properly referenced in child routes.

### SSR Hydration Mismatch

**Issue**: Content differs between server and client

**Solution**: Ensure router creation is consistent and loader data is properly dehydrated/rehydrated.

## Links

[1]: https://tanstack.com/router/latest/docs/framework/react/overview "React Overview"
[2]: https://tanstack.com/router/latest/docs/framework/react/quick-start "Quick Start"
[3]: https://tanstack.com/router/latest/docs/framework/react/guide/type-safety "Type Safety"
[4]: https://tanstack.com/router/latest/docs/framework/react/guide/data-loading "Data Loading"
[5]: https://tanstack.com/router/latest/docs/framework/react/guide/search-params "Search Params"
[6]: https://tanstack.com/router/latest/docs/framework/react/guide/navigation "Navigation"
[7]: https://tanstack.com/router/latest/docs/framework/react/guide/preloading "Preloading"
[8]: https://tanstack.com/router/latest/docs/framework/react/devtools "DevTools"
[9]: https://tanstack.com/router/latest/docs/framework/react/guide/ssr "SSR"
