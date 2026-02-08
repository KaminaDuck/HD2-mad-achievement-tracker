---
title: Caching Strategies
description: Advanced caching patterns with TanStack Query and TanStack DB
---

# Caching Strategies

This guide covers multi-layer caching strategies for Fearnstack applications, from browser cache to server cache.

## Caching Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CACHING LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│  Browser Cache     HTTP responses cached by browser             │
│         ↓                                                        │
│  TanStack Query    In-memory cache with stale/fresh states      │
│         ↓                                                        │
│  TanStack DB       Persistent client-side database              │
│         ↓                                                        │
│  Server Cache      Redis/in-memory server cache                 │
│         ↓                                                        │
│  Database          Primary data source                          │
└─────────────────────────────────────────────────────────────────┘
```

## TanStack Query Caching

### Cache Structure

Query cache is keyed by query key arrays:

```typescript
// These are different cache entries:
["users"]                    // All users
["users", "list"]            // User list
["users", { role: "admin" }] // Filtered users
["users", "123"]             // Single user
["users", "123", "posts"]    // User's posts
```

### Stale vs Fresh Data

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,     // Fresh for 1 minute
      gcTime: 1000 * 60 * 10,   // Keep in cache for 10 minutes
    },
  },
});

// States:
// Fresh: Data is current, won't refetch
// Stale: Data may be outdated, will refetch in background
// Inactive: No components using this query
// Garbage collected: Removed from cache after gcTime
```

### Stale Time Strategies

```typescript
// Strategy 1: Short-lived data (prices, status)
const stockQuery = queryOptions({
  queryKey: ["stock", symbol],
  queryFn: fetchStock,
  staleTime: 1000,          // Stale after 1 second
  refetchInterval: 5000,    // Poll every 5 seconds
});

// Strategy 2: Medium-lived data (user lists, posts)
const usersQuery = queryOptions({
  queryKey: ["users"],
  queryFn: fetchUsers,
  staleTime: 1000 * 60 * 5, // Fresh for 5 minutes
});

// Strategy 3: Long-lived data (user profile, settings)
const profileQuery = queryOptions({
  queryKey: ["profile"],
  queryFn: fetchProfile,
  staleTime: Infinity,      // Never stale (until invalidated)
});
```

### Cache Invalidation Patterns

```typescript
// Invalidate specific query
queryClient.invalidateQueries({ queryKey: ["users", userId] });

// Invalidate by prefix (all users)
queryClient.invalidateQueries({ queryKey: ["users"], exact: false });

// Invalidate multiple related queries
const invalidateUserData = (userId: string) => {
  queryClient.invalidateQueries({ queryKey: ["users", userId] });
  queryClient.invalidateQueries({ queryKey: ["users", userId, "posts"] });
  queryClient.invalidateQueries({ queryKey: ["users", userId, "comments"] });
};

// Invalidate on mutation success
const createPost = useMutation({
  mutationFn: createPostApi,
  onSuccess: (data, variables) => {
    // Invalidate user's posts
    queryClient.invalidateQueries({
      queryKey: ["users", variables.authorId, "posts"]
    });
    // Invalidate global posts list
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  },
});
```

### Optimistic Updates with Cache

```typescript
const updateUser = useMutation({
  mutationFn: updateUserApi,
  onMutate: async (newData) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["users", newData.id] });

    // Snapshot previous value
    const previousUser = queryClient.getQueryData(["users", newData.id]);

    // Optimistically update cache
    queryClient.setQueryData(["users", newData.id], (old) => ({
      ...old,
      ...newData,
    }));

    // Also update in list
    queryClient.setQueryData(["users"], (old: User[]) =>
      old?.map((u) => (u.id === newData.id ? { ...u, ...newData } : u))
    );

    return { previousUser };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    if (context?.previousUser) {
      queryClient.setQueryData(["users", newData.id], context.previousUser);
    }
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});
```

### Cache Persistence

```typescript
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Only persist certain queries
      return query.queryKey[0] === "user" || query.queryKey[0] === "settings";
    },
  },
});
```

## TanStack DB Caching

### Collection Caching

```typescript
// LocalStorage-backed collection (persistent)
const todosCollection = createLocalStorageCollection({
  name: "todos",
  primaryKey: "id",
  schema: todoSchema,
});

// Data persists across page reloads
// Hydrates automatically on app start
```

### Sync Strategies

```typescript
// Strategy 1: Query-backed (hybrid)
const usersCollection = createQueryBackedCollection({
  name: "users",
  useQuery: () => useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
    staleTime: 1000 * 60 * 5,
  }),
  useInsertMutation: () => useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  }),
});

// Strategy 2: Offline-first (optimistic)
const offlineCollection = createLocalStorageCollection({
  name: "offline-items",
  schema: itemSchema,
  primaryKey: "id",
});

// Queue mutations for sync
function useOfflineMutation() {
  return {
    create: (item: Item) => {
      offlineCollection.insert({ ...item, _pending: true });
      queueSync("create", item);
    },
  };
}
```

### LocalStorage Hydration

Remember the hydration race condition:

```typescript
// ❌ Inserts before hydration completes
const collection = createLocalStorageCollection({ ... });
collection.insert(defaultData); // Overwrites persisted data!

// ✅ Wait for hydration
function useCollectionWithDefaults() {
  const items = collection.useQuery({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (items === undefined) return; // Still hydrating
    if (!initialized && items.length === 0) {
      collection.insert(defaultData);
      setInitialized(true);
    }
  }, [items, initialized]);

  return items;
}
```

## Multi-Layer Caching

### Browser + Query + DB

```typescript
// Layer 1: Browser HTTP cache (static assets)
// Handled by Cache-Control headers

// Layer 2: Query cache (API responses)
const { data } = useQuery({
  queryKey: ["data"],
  queryFn: fetchData,
  staleTime: 60000,
});

// Layer 3: DB cache (persistent client state)
const dbData = collection.useQuery({});

// Sync between layers
useEffect(() => {
  if (data) {
    // Update DB from query result
    data.forEach((item) => collection.upsert(item));
  }
}, [data]);
```

### Read-Through Pattern

```typescript
// Check DB first, fall back to API
function useDataWithFallback(id: string) {
  const dbItem = collection.useQuery({ where: { id } })?.[0];

  const { data: apiItem } = useQuery({
    queryKey: ["items", id],
    queryFn: () => fetchItem(id),
    enabled: !dbItem, // Only fetch if not in DB
    staleTime: Infinity,
  });

  // Update DB when API returns
  useEffect(() => {
    if (apiItem) {
      collection.upsert(apiItem);
    }
  }, [apiItem]);

  return dbItem || apiItem;
}
```

## Server Caching

### Hono with In-Memory Cache

```typescript
// Simple in-memory cache
const cache = new Map<string, { data: unknown; expires: number }>();

function withCache(key: string, ttl: number) {
  return async (c: Context, next: Next) => {
    const cached = cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return c.json(cached.data);
    }

    await next();

    // Cache the response
    const body = await c.res.clone().json();
    cache.set(key, { data: body, expires: Date.now() + ttl });
  };
}

app.get("/api/stats", withCache("stats", 60000), async (c) => {
  const stats = await computeExpensiveStats();
  return c.json(stats);
});
```

### Redis Caching

```typescript
import { Redis } from "ioredis";

const redis = new Redis();

async function getCached<T>(key: string, ttl: number, fetcher: () => Promise<T>): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const data = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(data));
  return data;
}

app.get("/api/users/:id", async (c) => {
  const { id } = c.req.param();

  const user = await getCached(
    `user:${id}`,
    300, // 5 minutes
    () => db.users.findUnique({ where: { id } })
  );

  if (!user) return c.json({ error: "Not found" }, 404);
  return c.json(user);
});
```

## Cache Invalidation Strategies

### Time-Based

```typescript
// Query: staleTime + gcTime
staleTime: 60000,  // Refresh after 1 minute
gcTime: 300000,    // Remove from cache after 5 minutes inactive

// Server: TTL
redis.setex(key, 300, data); // Expires after 5 minutes
```

### Event-Based

```typescript
// Invalidate on mutation
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["users"] });
};

// Invalidate on WebSocket event
ws.onmessage = (event) => {
  const { type, key } = JSON.parse(event.data);
  if (type === "invalidate") {
    queryClient.invalidateQueries({ queryKey: key });
  }
};
```

### Manual Invalidation

```typescript
// Admin action to clear cache
app.post("/api/admin/clear-cache", authMiddleware, async (c) => {
  await redis.flushdb();
  return c.json({ success: true });
});
```

## Offline Support

### Offline Detection

```typescript
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
```

### Offline Mutations Queue

```typescript
const mutationQueue: Array<{ key: string; data: unknown }> = [];

function queueMutation(key: string, data: unknown) {
  mutationQueue.push({ key, data });
  localStorage.setItem("mutation-queue", JSON.stringify(mutationQueue));
}

async function syncMutations() {
  const queue = JSON.parse(localStorage.getItem("mutation-queue") || "[]");

  for (const mutation of queue) {
    try {
      await executeMutation(mutation);
      queue.shift();
      localStorage.setItem("mutation-queue", JSON.stringify(queue));
    } catch {
      break; // Stop on error, retry later
    }
  }
}

// Sync when coming back online
window.addEventListener("online", syncMutations);
```

## Caching Checklist

| Layer | Strategy | When to Use |
|-------|----------|-------------|
| Browser | HTTP Cache | Static assets, CDN |
| Query | staleTime | API responses |
| Query | gcTime | Memory management |
| Query | Persist | Offline support |
| DB | LocalStorage | Client state |
| DB | Query-backed | Hybrid sync |
| Server | In-memory | Hot data |
| Server | Redis | Distributed cache |

## Related Docs

- [TanStack Query](../domains/frontend/tanstack-query.md) - Query caching
- [TanStack DB](../domains/frontend/tanstack-db.md) - Client database
- [Database Sync](../integration/database-sync.md) - Sync patterns
- [Performance](./performance.md) - Optimization
