---
title: "TanStack Query React Guide"
description: "Complete guide to using TanStack Query with React"
type: "framework-guide"
tags: ["tanstack", "react", "query", "data-fetching", "caching", "hooks", "typescript"]
category: "typescript"
subcategory: "data-fetching"
version: "6.0.4"
last_updated: "2025-11-01"
status: "stable"
sources:
  - name: "React Quick Start"
    url: "https://tanstack.com/query/latest/docs/framework/react/quick-start"
  - name: "Queries Guide"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/queries"
  - name: "Mutations Guide"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/mutations"
  - name: "Query Keys"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-keys"
  - name: "Query Invalidation"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation"
  - name: "Caching Guide"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/caching"
  - name: "Paginated Queries"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries"
  - name: "Infinite Queries"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries"
  - name: "Dependent Queries"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries"
  - name: "Optimistic Updates"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates"
  - name: "SSR Guide"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/ssr"
  - name: "Suspense Guide"
    url: "https://tanstack.com/query/latest/docs/framework/react/guides/suspense"
related: ["overview.md"]
author: "unknown"
contributors: []
---

# TanStack Query React Guide

Comprehensive guide for using TanStack Query with React for powerful asynchronous state management and data fetching.

## Installation

```bash
npm install @tanstack/react-query
```

([React Quick Start][1])

## Core Concepts

TanStack Query revolves around three fundamental principles: ([React Quick Start][1])

1. **Queries** - Fetch and cache server data
2. **Mutations** - Modify server data
3. **Query Invalidation** - Refresh stale data after changes

## Basic Setup

Create and configure a QueryClient instance: ([React Quick Start][1])

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourComponent />
    </QueryClientProvider>
  )
}
```

## Queries

A query is a declarative dependency on asynchronous data tied to a unique key. ([Queries Guide][2])

### Basic Query Usage

To use queries, call `useQuery` with: ([Queries Guide][2])
- A unique query key
- A function returning a promise that resolves data or throws an error

```tsx
import { useQuery } from '@tanstack/react-query'

function Todos() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos
  })

  if (isLoading) return <div>Loading...</div>
  if (isError) return <div>Error: {error.message}</div>

  return (
    <ul>
      {data.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

([React Quick Start][1])

### Query States

Queries exist in three primary states: ([Queries Guide][2])

1. **Pending** (`isPending` or `status === 'pending'`) - No data available yet
2. **Error** (`isError` or `status === 'error'`) - Query encountered an error
3. **Success** (`isSuccess` or `status === 'success'`) - Data is available

Additional properties include:
- `error` - Available when in error state
- `data` - Available when successful
- `isFetching` - Indicates active fetching (including background refetches)

### Fetch Status

Beyond the primary status, queries include a `fetchStatus` property: ([Queries Guide][2])

- **Fetching** - Query is currently executing
- **Paused** - Query wants to fetch but is paused (network mode related)
- **Idle** - Query is inactive

**Key distinction:** ([Queries Guide][2])
- `status` answers: "Do we have data?"
- `fetchStatus` answers: "Is the queryFn running?"

The framework uses two state types because background refetches and stale-while-revalidate patterns create complex scenarios. A query can be in `pending` status without actively fetching, or in `success` status while fetching updated data.

### Best Practice

For most implementations, check states sequentially: first `isPending`, then `isError`, then assume success and access `data`. TypeScript will properly narrow types when these checks precede data access. ([Queries Guide][2])

## Query Keys

Query keys must be arrays at the top level. They can range from simple to complex: ([Query Keys][4])

- **Simple keys:** `['todos']` for generic resources
- **Complex keys:** `['todo', 5, { preview: true }]` for hierarchical data with parameters

As long as the query key is serializable using `JSON.stringify`, and unique to the query's data, you can use it. ([Query Keys][4])

### Deterministic Hashing

A critical feature is that query keys are hashed deterministically. This means object property order doesn't affect equality: ([Query Keys][4])

```tsx
['todos', { status, page }]
['todos', { page, status }]  // Same key
```

However, array item order matters: ([Query Keys][4])

```tsx
['todos', status, page]
['todos', page, status]  // Different keys
```

### Essential Design Principle

Include all variables that change in your query function within the query key. Adding dependent variables to your query key will ensure that queries are cached independently, and that any time a variable changes, queries will be refetched automatically. ([Query Keys][4])

### Organization

For larger applications, the docs recommend reviewing "Effective React Query Keys" and exploring the Query Key Factory Package from community resources. ([Query Keys][4])

## Caching

The caching system manages data through several key stages. ([Caching Guide][6])

### Initial Query Execution

When a query first mounts with a unique key, it enters a loading state and fetches data. Once received, data is cached under that key and marked as stale based on the configured `staleTime` (which defaults to 0, making data immediately stale). ([Caching Guide][6])

### Cached Data Reuse

When subsequent instances of the same query mount, they immediately receive cached data without loading indicators, then trigger background refetching to keep data fresh. ([Caching Guide][6])

### Key Configuration Parameters

**staleTime:** Determines how long cached data remains "fresh." The default is 0 milliseconds, meaning data is considered stale immediately after being cached. Increasing this value prevents unnecessary background refetches. ([Caching Guide][6])

**gcTime (Garbage Collection Time):** Controls how long inactive queries persist in cache after all instances unmount. The default is 5 minutes. Once this period expires without active query instances, the cached data is removed entirely. ([Caching Guide][6])

### Refetch Behavior

Cached data triggers background refetching when: ([Caching Guide][6])
- New query instances mount and find existing cache data
- The data is marked as stale
- User interactions trigger refetch (like window focus events)

All instances sharing the same query key receive status updates (`isFetching`, `isPending`) during refetches, regardless of which instance initiated the request.

### Cache Management Strategy

Data remains available through a window between unmounting all instances and garbage collection expiring—allowing rapid remounting to restore cached data without network requests. ([Caching Guide][6])

## Query Invalidation

Query invalidation is a mechanism to mark queries as stale and trigger refetches when you know data has become outdated. ([Query Invalidation][5])

### How Invalidation Works

When you call `invalidateQueries()`, two things happen: ([Query Invalidation][5])

1. **Stale Marking:** The query is marked as stale, overriding any configured `staleTime` settings
2. **Background Refetch:** If the query is currently rendered via `useQuery` or related hooks, it automatically refetches in the background

### Invalidation Patterns

**Basic Invalidation:** ([Query Invalidation][5])

```tsx
queryClient.invalidateQueries() // invalidate all queries
queryClient.invalidateQueries({ queryKey: ['todos'] }) // prefix matching
```

**Specific Invalidation:** ([Query Invalidation][5])

```tsx
queryClient.invalidateQueries({
  queryKey: ['todos', { type: 'done' }],
})
```

**Exact Matching:** ([Query Invalidation][5])

Use `exact: true` to invalidate only queries with no additional subkeys:

```tsx
queryClient.invalidateQueries({
  queryKey: ['todos'],
  exact: true,
})
```

**Predicate Functions:** ([Query Invalidation][5])

For maximum granularity, pass a function that receives each query instance:

```tsx
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'todos' && query.queryKey[1]?.version >= 10,
})
```

## Mutations

Mutations modify server data and trigger updates to query caches. ([React Quick Start][1])

### Basic Mutation Usage

```tsx
import { useMutation } from '@tanstack/react-query'

function AddTodo() {
  const mutation = useMutation({
    mutationFn: postTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <button onClick={() => mutation.mutate({ title: 'New Todo' })}>
      Add Todo
    </button>
  )
}
```

([React Quick Start][1])

### Mutation States

Mutations operate in four distinct states: ([Mutations Guide][3])

- **Idle/Fresh:** Initial or reset state
- **Pending:** Mutation actively running
- **Error:** Failed mutation with error details available
- **Success:** Completed mutation with data available

### Key Mutation Functions

The `useMutation` hook provides access to: ([Mutations Guide][3])

- `mutate()` - Triggers the mutation with variables
- `mutateAsync()` - Promise-based mutation for composing side effects
- `reset()` - Clears error and data from previous mutations

### Mutation Side Effects

The library supports lifecycle callbacks: ([Mutations Guide][3])

- **onMutate:** Fires before mutation executes; useful for optimistic updates
- **onSuccess:** Executes after successful completion
- **onError:** Handles failed mutations
- **onSettled:** Runs regardless of success or failure

These can be defined at the hook level or passed directly to `mutate()` calls.

### Variable Handling

Pass a single variable or object to `mutate()`. In React 16 and earlier, wrap `mutate` in an event handler rather than using it directly as a callback. ([Mutations Guide][3])

### Advanced Features

**Retry Logic:** Configure automatic retry attempts via the `retry` option. ([Mutations Guide][3])

**Mutation Scopes:** Serialize mutations with the same `scope.id` to run sequentially rather than in parallel. ([Mutations Guide][3])

**Persistence:** Mutations can be persisted to storage and resumed after offline periods using hydration functions. ([Mutations Guide][3])

## Paginated Queries

TanStack Query handles pagination by including page information in the query key. ([Paginated Queries][7])

### The `keepPreviousData` Solution

Use `placeholderData` with the `keepPreviousData` function to improve pagination UX. The data from the last successful fetch is available while new data is being requested, even though the query key has changed. ([Paginated Queries][7])

**Key Benefits:** ([Paginated Queries][7])

1. **Seamless transitions** - Previous page data remains visible while fetching new data
2. **State tracking** - The `isPlaceholderData` flag indicates whether you're viewing cached or fresh data
3. **Better UX** - Eliminates jarring loading states between page changes

### Implementation Example

```tsx
import { useQuery, keepPreviousData } from '@tanstack/react-query'

function Projects() {
  const [page, setPage] = useState(0)

  const { data, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['projects', page],
    queryFn: () => fetchProjects(page),
    placeholderData: keepPreviousData,
  })

  return (
    <div>
      {data.projects.map(project => <div key={project.id}>{project.name}</div>)}
      <button
        onClick={() => setPage(old => old - 1)}
        disabled={page === 0}
      >
        Previous
      </button>
      <button
        onClick={() => setPage(old => old + 1)}
        disabled={isPlaceholderData || !data.hasMore}
      >
        Next
      </button>
    </div>
  )
}
```

([Paginated Queries][7])

## Infinite Queries

TanStack Query's `useInfiniteQuery` hook enables "load more" and infinite scroll patterns. Rendering lists that can additively 'load more' data onto an existing set of data or 'infinite scroll' is also a very common UI pattern. ([Infinite Queries][8])

### Key API Features

**Data Structure:** ([Infinite Queries][8])
- `data.pages` - array containing fetched pages
- `data.pageParams` - array of page parameters used for each fetch

**Essential Functions:** ([Infinite Queries][8])
- `fetchNextPage()` - loads additional data (required)
- `fetchPreviousPage()` - loads earlier data (optional)

**Status Indicators:** ([Infinite Queries][8])
- `hasNextPage` - true when `getNextPageParam` returns a value
- `hasPreviousPage` - true when `getPreviousPageParam` returns a value
- `isFetchingNextPage` / `isFetchingPreviousPage` - distinguishes background refresh from load operations

### Pagination Strategy

The hook uses cursor-based pagination. You define `getNextPageParam` to calculate the next cursor from the last page's response. The getNextPageParam option is available for determining if there is more data to load. ([Infinite Queries][8])

### Implementation Example

```tsx
import { useInfiniteQuery } from '@tanstack/react-query'

function Projects() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['projects'],
    queryFn: ({ pageParam }) => fetchProjects(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  return (
    <div>
      {data.pages.map((page) => (
        page.projects.map(project => (
          <div key={project.id}>{project.name}</div>
        ))
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
          ? 'Load More'
          : 'Nothing more to load'}
      </button>
    </div>
  )
}
```

### Important Constraints

Only one simultaneous fetch per infinite query is supported. Remember, there can only be a single ongoing fetch for an InfiniteQuery. ([Infinite Queries][8])

To prevent conflicts, check `!isFetching` before triggering `fetchNextPage()` automatically.

### Page Limit Optimization

Use the `maxPages` option to restrict stored pages, reducing memory usage and refetch duration for large datasets. ([Infinite Queries][8])

## Dependent Queries

Dependent queries (also called serial queries) execute sequentially, where later queries wait for earlier ones to complete. Dependent (or serial) queries depend on previous ones to finish before they can execute. ([Dependent Queries][9])

### Implementation with `enabled` Option

The primary mechanism uses the `enabled` configuration flag. When set to a falsy value, the query remains inactive until the condition becomes truthy: ([Dependent Queries][9])

```tsx
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: getUserByEmail,
})

const userId = user?.id

const { data: projects } = useQuery({
  queryKey: ['projects', userId],
  queryFn: getProjectsByUser,
  enabled: !!userId, // Query waits for userId to exist
})
```

### Query States During Dependency

Before the dependency resolves: ([Dependent Queries][9])
- `status: 'pending'` and `fetchStatus: 'idle'`

Once enabled:
- `status: 'pending'` and `fetchStatus: 'fetching'`

After completion:
- `status: 'success'` and `fetchStatus: 'idle'`

### Dynamic Parallel Dependencies

For multiple dependent queries, `useQueries` can map over results from an initial query: ([Dependent Queries][9])

```tsx
const { data: userIds } = useQuery({
  queryKey: ['users'],
  queryFn: getUserIds
})

const usersMessages = useQueries({
  queries: userIds
    ? userIds.map(id => ({
        queryKey: ['messages', id],
        queryFn: () => getMessagesByUser(id),
      }))
    : []
})
```

### Performance Consideration

The docs note this creates a "request waterfall" that impacts performance. Serial execution takes roughly twice as long as parallel fetching. When feasible, restructuring backend APIs to enable parallel requests is preferable. ([Dependent Queries][9])

## Optimistic Updates

React Query provides two primary strategies for optimistically updating UI before mutations complete: UI-based updates using mutation variables, or cache-based updates using the `onMutate` callback. ([Optimistic Updates][10])

### UI-Based Approach

The simpler method leverages the `variables` property returned from `useMutation`. You render temporary UI elements while the mutation is pending: ([Optimistic Updates][10])

```tsx
const { isPending, variables, mutate } = useMutation({
  mutationFn: addTodo
})

return (
  <ul>
    {todos.map(todo => <li key={todo.id}>{todo.title}</li>)}
    {isPending && <li style={{ opacity: 0.5 }}>{variables.title}</li>}
  </ul>
)
```

This approach works best when the mutation and query live in the same component. For distributed components, use `useMutationState` with a `mutationKey` to access pending mutation variables across your application.

### Cache-Based Approach

The `onMutate` callback allows direct cache manipulation with automatic rollback capabilities. ([Optimistic Updates][10])

**Key Pattern:**
- **Cancel outgoing requests** to prevent overwrites
- **Snapshot previous state** for rollback
- **Update cache optimistically**
- **Return context** for error handlers to access during rollback

```tsx
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
    return { previousTodos }
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previousTodos)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

([Optimistic Updates][10])

### When to Use Each

- **UI approach:** Single display location, simpler code, no rollback complexity needed
- **Cache approach:** Multiple UI locations requiring synchronization, server error scenarios needing rollback

([Optimistic Updates][10])

## Server-Side Rendering

React Query's SSR approach involves three key phases: ([SSR Guide][11])

1. **Prefetching on server:** Create a `QueryClient` in your framework's loader function and use `await queryClient.prefetchQuery()` to fetch data before rendering
2. **Dehydration:** Convert the client cache to a serializable format using `dehydrate(queryClient)`
3. **Hydration:** Restore the cache on the client using `<HydrationBoundary state={dehydratedState}>`

### Key Setup Requirements

**Create QueryClient per request** (not globally): Creating the queryClient at the file root level makes the cache shared between all requests and means all data gets passed to all users. ([SSR Guide][11])

**Set appropriate `staleTime`** to avoid immediate client refetching: ([SSR Guide][11])

```tsx
new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60 * 1000 }
  }
})
```

### Framework Implementations

**Next.js Pages Router** uses `getServerSideProps` or `getStaticProps`. ([SSR Guide][11])

**Remix** follows similar patterns with the `loader` function. ([SSR Guide][11])

### Important Caveats

- Staleness is measured from server fetch time using UTC
- Failed queries retry on client (graceful degradation)
- Avoid setting `gcTime` to `0` on servers to prevent hydration errors
- Use secure serialization libraries (devalue, serialize-javascript) to prevent XSS vulnerabilities

([SSR Guide][11])

## Suspense Integration

React Query provides three dedicated hooks for Suspense integration: ([Suspense Guide][12])

- **useSuspenseQuery** - Standard suspense queries
- **useSuspenseInfiniteQuery** - For infinite/paginated data
- **useSuspenseQueries** - Multiple queries in suspense mode

### Key Benefits

Using suspense mode eliminates the need for manual status and error handling. Status states and error objects are not needed and are then replaced by usage of the React.Suspense component. ([Suspense Guide][12])

### TypeScript Advantage

With `useSuspenseQuery`, the `data` property is guaranteed to be defined at runtime, since loading and error states are handled by Suspense and Error Boundaries. ([Suspense Guide][12])

### Error Boundary Reset

Two approaches manage error recovery: ([Suspense Guide][12])

1. **QueryErrorResetBoundary component** - Wraps sections needing error reset capability
2. **useQueryErrorResetBoundary hook** - Provides reset functionality within closest boundary

### Fetch Patterns

- **Fetch-on-render:** Components trigger queries upon mounting (default behavior)
- **Render-as-you-fetch:** Prefetch queries before component mount via routing callbacks

([Suspense Guide][12])

### Implementation Example

```tsx
import { Suspense } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { ErrorBoundary } from 'react-error-boundary'

function TodoList() {
  const { data } = useSuspenseQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos
  })

  return <ul>{data.map(todo => <li key={todo.id}>{todo.title}</li>)}</ul>
}

function App() {
  return (
    <ErrorBoundary fallback={<div>Error loading todos</div>}>
      <Suspense fallback={<div>Loading...</div>}>
        <TodoList />
      </Suspense>
    </ErrorBoundary>
  )
}
```

## Best Practices

1. **Always provide unique query keys** - Include all variables that affect the query
2. **Use invalidation over refetch** - More declarative and handles multiple instances
3. **Set appropriate staleTime** - Balance between freshness and performance
4. **Leverage placeholderData for pagination** - Better UX during page transitions
5. **Use optimistic updates wisely** - Cache-based for complex scenarios, UI-based for simple ones
6. **Create QueryClient per request in SSR** - Prevent cache sharing between users
7. **Enable queries conditionally** - Use `enabled` for dependent queries
8. **Use Suspense for cleaner code** - Eliminates manual loading/error states
9. **Monitor with DevTools** - Debug query states and cache behavior
10. **Consider request waterfalls** - Restructure APIs to enable parallel fetching when possible

## Links

**Official Documentation:**
- [React Quick Start](https://tanstack.com/query/latest/docs/framework/react/quick-start)
- [Queries Guide](https://tanstack.com/query/latest/docs/framework/react/guides/queries)
- [Mutations Guide](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
- [Query Keys](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [Query Invalidation](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Caching Guide](https://tanstack.com/query/latest/docs/framework/react/guides/caching)
- [Paginated Queries](https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries)
- [Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [Dependent Queries](https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries)
- [Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [SSR Guide](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)
- [Suspense Guide](https://tanstack.com/query/latest/docs/framework/react/guides/suspense)

[1]: https://tanstack.com/query/latest/docs/framework/react/quick-start "React Quick Start"
[2]: https://tanstack.com/query/latest/docs/framework/react/guides/queries "Queries Guide"
[3]: https://tanstack.com/query/latest/docs/framework/react/guides/mutations "Mutations Guide"
[4]: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys "Query Keys"
[5]: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation "Query Invalidation"
[6]: https://tanstack.com/query/latest/docs/framework/react/guides/caching "Caching Guide"
[7]: https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries "Paginated Queries"
[8]: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries "Infinite Queries"
[9]: https://tanstack.com/query/latest/docs/framework/react/guides/dependent-queries "Dependent Queries"
[10]: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates "Optimistic Updates"
[11]: https://tanstack.com/query/latest/docs/framework/react/guides/ssr "SSR Guide"
[12]: https://tanstack.com/query/latest/docs/framework/react/guides/suspense "Suspense Guide"
