---
title: Performance Optimization
description: Optimizing Fearnstack applications for speed and efficiency
---

# Performance Optimization

This guide covers performance optimization across the Fearnstack—from React rendering to Hono response times.

## Performance Philosophy

1. **Measure first** - Profile before optimizing
2. **Optimize the right thing** - Focus on bottlenecks
3. **Don't optimize prematurely** - React 19 + Query handle most cases
4. **User perception matters** - Loading states > raw speed

## React Performance

### React Compiler Benefits

React 19's compiler automatically handles most memoization:

```tsx
// ❌ Old: Manual memoization everywhere
const MemoizedComponent = React.memo(function Component({ data }) {
  const computed = useMemo(() => expensiveCalc(data), [data]);
  const handler = useCallback(() => doSomething(data), [data]);
  return <div>{computed}</div>;
});

// ✅ New: React Compiler handles this automatically
function Component({ data }) {
  const computed = expensiveCalc(data); // Compiler memoizes if needed
  const handler = () => doSomething(data);
  return <div>{computed}</div>;
}
```

### When to Still Use Manual Memoization

```tsx
// Extremely expensive calculations (100ms+)
const result = useMemo(() => {
  return items.reduce((acc, item) => {
    return veryExpensiveOperation(acc, item);
  }, initial);
}, [items]);

// Context values (prevents re-renders of all consumers)
const contextValue = useMemo(() => ({
  user,
  updateUser,
}), [user, updateUser]);
```

### Component Splitting

```tsx
// ❌ Large component re-renders entirely
function Dashboard() {
  const { data: stats } = useQuery(...);
  const { data: users } = useQuery(...);
  const { data: logs } = useQuery(...);

  return (
    <div>
      <StatsPanel stats={stats} />
      <UserList users={users} />
      <LogViewer logs={logs} />
    </div>
  );
}

// ✅ Split into independent components
function Dashboard() {
  return (
    <div>
      <StatsPanel /> {/* Fetches its own data */}
      <UserList />   {/* Independent updates */}
      <LogViewer />  {/* Doesn't affect others */}
    </div>
  );
}
```

### Suspense for Loading States

```tsx
// ✅ Concurrent rendering with Suspense
function App() {
  return (
    <Suspense fallback={<Skeleton />}>
      <Dashboard />
    </Suspense>
  );
}

// Queries inside can suspend
function Dashboard() {
  const { data } = useSuspenseQuery({
    queryKey: ["stats"],
    queryFn: fetchStats,
  });
  return <StatsPanel stats={data} />;
}
```

## TanStack Query Performance

### Stale Time Tuning

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes default
    },
  },
});

// Per-query overrides
const { data } = useQuery({
  queryKey: ["user", id],
  queryFn: fetchUser,
  staleTime: 1000 * 60 * 30, // User data rarely changes
});

const { data: ticker } = useQuery({
  queryKey: ["stock", symbol],
  queryFn: fetchStock,
  staleTime: 1000, // Refresh stock price frequently
});
```

### Background Refetching Control

```tsx
useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  refetchOnWindowFocus: false,    // Don't refetch on tab focus
  refetchOnMount: false,          // Use cached data on mount
  refetchOnReconnect: true,       // Refetch after network restore
  refetchInterval: false,         // Disable polling
});
```

### Prefetching

```tsx
// Prefetch on hover
function UserLink({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ["user", userId],
      queryFn: () => fetchUser(userId),
    });
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId }}
      onMouseEnter={handleMouseEnter}
    >
      View User
    </Link>
  );
}

// Prefetch in router loader
export const Route = createFileRoute("/users")({
  loader: async ({ context }) => {
    // Prefetch user list while loading route
    await context.queryClient.prefetchQuery(userQueries.all());
  },
});
```

### Pagination Optimization

```tsx
function InfiniteList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["items"],
    queryFn: ({ pageParam = 0 }) => fetchItems(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    // Keep previous pages in cache
    staleTime: Infinity,
  });

  // Flatten pages for rendering
  const items = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <VirtualList
      items={items}
      onEndReached={() => hasNextPage && fetchNextPage()}
    />
  );
}
```

## TanStack Router Performance

### Route Preloading

```tsx
// Preload on hover (default)
<Link to="/users/$userId" params={{ userId }} preload="intent">
  View User
</Link>

// Preload on render
<Link to="/users/$userId" params={{ userId }} preload="render">
  View User
</Link>

// Route-level preload config
export const Route = createFileRoute("/users/$userId")({
  preloadStaleTime: 30000, // Keep preloaded data for 30s
});
```

### Code Splitting

Routes are automatically code-split:

```
routes/
├── index.tsx           # Bundle: index
├── users.tsx           # Bundle: users
├── users.$userId.tsx   # Bundle: users.$userId
└── admin/
    └── dashboard.tsx   # Bundle: admin/dashboard
```

Force eager loading for critical routes:

```tsx
// In router config
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 30000,
});
```

## Hono Performance

### Middleware Optimization

```typescript
// ❌ Heavy middleware on all routes
app.use("*", async (c, next) => {
  await heavyOperation();
  await next();
});

// ✅ Apply only where needed
app.use("/api/protected/*", authMiddleware);
app.use("/api/admin/*", adminMiddleware);
```

### Response Compression

```typescript
import { compress } from "hono/compress";

app.use("*", compress());
```

### Connection Pooling

```typescript
// ❌ New connection per request
app.get("/users", async (c) => {
  const db = await createConnection();
  const users = await db.query("SELECT * FROM users");
  await db.close();
  return c.json(users);
});

// ✅ Connection pool
const pool = createPool({ max: 20 });

app.get("/users", async (c) => {
  const users = await pool.query("SELECT * FROM users");
  return c.json(users);
});
```

### Streaming Large Responses

```typescript
// ❌ Load all into memory
app.get("/export", async (c) => {
  const allData = await db.users.findMany(); // 1M rows
  return c.json(allData);
});

// ✅ Stream response
import { streamText } from "hono/streaming";

app.get("/export", (c) =>
  streamText(c, async (stream) => {
    await stream.write("[");
    let first = true;

    for await (const batch of db.users.cursor(1000)) {
      for (const user of batch) {
        if (!first) await stream.write(",");
        await stream.write(JSON.stringify(user));
        first = false;
      }
    }

    await stream.write("]");
  })
);
```

## Bun Performance

### Native APIs

```typescript
// ✅ Use Bun native APIs (faster than Node equivalents)
const file = Bun.file("data.json");
const content = await file.text();

const hash = Bun.hash("data");

const result = await $`ls -la`;
```

### Bundling Optimization

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  minify: true,           // Minify in production
  splitting: true,        // Code splitting
  sourcemap: "external",  // Source maps
  target: "browser",
});
```

## Measuring Performance

### React DevTools Profiler

1. Open React DevTools → Profiler tab
2. Click Record
3. Perform actions
4. Click Stop
5. Analyze render times and causes

### Query DevTools

```tsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Lighthouse

```bash
# Run Lighthouse audit
npx lighthouse http://localhost:3000 --view

# Key metrics:
# - First Contentful Paint (FCP)
# - Largest Contentful Paint (LCP)
# - Time to Interactive (TTI)
# - Cumulative Layout Shift (CLS)
```

### Custom Timing

```typescript
// Measure API response time
const start = performance.now();
const res = await fetch("/api/users");
const duration = performance.now() - start;
console.log(`API call: ${duration.toFixed(2)}ms`);

// Measure render time
useEffect(() => {
  const start = performance.now();
  return () => {
    console.log(`Render: ${(performance.now() - start).toFixed(2)}ms`);
  };
}, []);
```

## Performance Checklist

| Area | Check |
|------|-------|
| React | React Compiler enabled |
| React | Heavy components split |
| React | Suspense for loading |
| Query | Appropriate staleTime |
| Query | Prefetching critical data |
| Query | Background refetch controlled |
| Router | Routes code-split |
| Router | Preload on intent |
| Hono | Middleware scoped |
| Hono | Compression enabled |
| Hono | Connection pooling |
| Bun | Native APIs used |
| Bun | Minification enabled |

## Related Docs

- [React 19](../domains/frontend/react-19.md) - React Compiler
- [TanStack Query](../domains/frontend/tanstack-query.md) - Caching
- [Caching Strategies](./caching-strategies.md) - Advanced caching
- [Bun Bundler](../domains/runtime/bun-bundler.md) - Build optimization
