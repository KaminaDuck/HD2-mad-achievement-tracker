---
title: TanStack Query
description: Async state management and data fetching with caching
---

# TanStack Query

TanStack Query handles all async state management in Fearnstack - fetching, caching, synchronizing, and updating server data with minimal configuration.

## Why TanStack Query?

Server state is fundamentally different from client state:
- Exists remotely beyond your control
- Requires async APIs for access
- Can change without your knowledge
- May become stale if not refreshed

Query handles this complexity automatically with zero-configuration caching, background updates, and request deduplication.

## Installation

```bash
bun add @tanstack/react-query
bun add -D @tanstack/react-query-devtools
```

## Setup

```typescript
// src/main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Basic Usage

### useQuery

Fetch and cache data:

```typescript
import { useQuery } from "@tanstack/react-query";

function UserList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("http://localhost:3001/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json() as Promise<User[]>;
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {data?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### useMutation

Perform write operations:

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

function CreateUserForm() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newUser: CreateUser) => {
      const res = await fetch("http://localhost:3001/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (!res.ok) throw new Error("Failed to create user");
      return res.json() as Promise<User>;
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    mutation.mutate({
      name: formData.get("name") as string,
      email: formData.get("email") as string,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Name" required />
      <input name="email" type="email" placeholder="Email" required />
      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create User"}
      </button>
      {mutation.error && <p className="error">{mutation.error.message}</p>}
    </form>
  );
}
```

## Query Keys

Keys identify and organize cached data:

```typescript
// Simple key
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: fetchAllUsers,
});

// Parameterized key
const { data } = useQuery({
  queryKey: ["users", userId],
  queryFn: () => fetchUser(userId),
});

// Complex key with filters
const { data } = useQuery({
  queryKey: ["users", { page, filter, sort }],
  queryFn: () => fetchUsers({ page, filter, sort }),
});
```

### Key Matching for Invalidation

```typescript
// Invalidate all user queries
queryClient.invalidateQueries({ queryKey: ["users"] });

// Invalidate specific user
queryClient.invalidateQueries({ queryKey: ["users", userId] });

// Invalidate with fuzzy matching
queryClient.invalidateQueries({
  queryKey: ["users"],
  predicate: (query) => query.queryKey[1]?.filter === "active",
});
```

## Optimistic Updates

Update UI immediately before server confirms:

```typescript
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (updatedTodo) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ["todos"] });

    // Snapshot previous value
    const previousTodos = queryClient.getQueryData<Todo[]>(["todos"]);

    // Optimistically update
    queryClient.setQueryData<Todo[]>(["todos"], (old) =>
      old?.map((todo) =>
        todo.id === updatedTodo.id ? { ...todo, ...updatedTodo } : todo
      )
    );

    // Return context for rollback
    return { previousTodos };
  },
  onError: (err, variables, context) => {
    // Rollback on error
    queryClient.setQueryData(["todos"], context?.previousTodos);
  },
  onSettled: () => {
    // Refetch to ensure consistency
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

## Query Options Pattern

Create reusable, type-safe query configurations:

```typescript
// src/queries/users.ts
import { queryOptions } from "@tanstack/react-query";

export const userQueries = {
  all: () =>
    queryOptions({
      queryKey: ["users"],
      queryFn: fetchAllUsers,
    }),

  detail: (userId: string) =>
    queryOptions({
      queryKey: ["users", userId],
      queryFn: () => fetchUser(userId),
    }),

  byFilter: (filter: UserFilter) =>
    queryOptions({
      queryKey: ["users", { filter }],
      queryFn: () => fetchUsersByFilter(filter),
    }),
};

// Usage
function UserPage({ userId }: { userId: string }) {
  const { data } = useQuery(userQueries.detail(userId));
  return <div>{data?.name}</div>;
}
```

## Integration with Hono RPC

Type-safe fetching with Hono client:

```typescript
// src/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "../../../server";

export const client = hc<AppType>("http://localhost:3001");

// src/queries/todos.ts
import { queryOptions } from "@tanstack/react-query";
import { client } from "../lib/api";

export const todoQueries = {
  all: () =>
    queryOptions({
      queryKey: ["todos"],
      queryFn: async () => {
        const res = await client.api.todos.$get();
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json(); // Fully typed!
      },
    }),

  byId: (id: string) =>
    queryOptions({
      queryKey: ["todos", id],
      queryFn: async () => {
        const res = await client.api.todos[":id"].$get({ param: { id } });
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      },
    }),
};
```

## Dependent Queries

Chain queries that depend on each other:

```typescript
function UserPosts({ userId }: { userId: string }) {
  // First query
  const { data: user } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
  });

  // Dependent query - only runs when user exists
  const { data: posts } = useQuery({
    queryKey: ["posts", { userId }],
    queryFn: () => fetchPostsByUser(userId),
    enabled: !!user, // Only fetch when user is loaded
  });

  return (
    <div>
      <h1>{user?.name}'s Posts</h1>
      {posts?.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
```

## Infinite Queries

Pagination with infinite scroll:

```typescript
import { useInfiniteQuery } from "@tanstack/react-query";

function InfiniteUserList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["users", "infinite"],
    queryFn: async ({ pageParam = 0 }) => {
      const res = await fetch(`/api/users?page=${pageParam}&limit=20`);
      return res.json() as Promise<{ users: User[]; nextPage: number | null }>;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.users.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      ))}

      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? "Loading..."
          : hasNextPage
          ? "Load More"
          : "No more users"}
      </button>
    </div>
  );
}
```

## Suspense Mode

Use with React Suspense:

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";

function UserList() {
  // This suspends until data is ready
  const { data } = useSuspenseQuery({
    queryKey: ["users"],
    queryFn: fetchUsers,
  });

  return (
    <ul>
      {data.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

function App() {
  return (
    <Suspense fallback={<div>Loading users...</div>}>
      <UserList />
    </Suspense>
  );
}
```

## Prefetching

Preload data before navigation:

```typescript
// Prefetch on hover
function UserLink({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const prefetch = () => {
    queryClient.prefetchQuery(userQueries.detail(userId));
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId }}
      onMouseEnter={prefetch}
    >
      View User
    </Link>
  );
}

// Prefetch in route loader
export const Route = createFileRoute("/users/$userId")({
  loader: ({ context: { queryClient }, params }) => {
    return queryClient.ensureQueryData(userQueries.detail(params.userId));
  },
});
```

## Common Patterns

### Polling

```typescript
const { data } = useQuery({
  queryKey: ["notifications"],
  queryFn: fetchNotifications,
  refetchInterval: 30000, // Poll every 30 seconds
  refetchIntervalInBackground: false, // Pause when tab inactive
});
```

### Retry Configuration

```typescript
const { data } = useQuery({
  queryKey: ["users"],
  queryFn: fetchUsers,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});
```

### Placeholder Data

```typescript
const { data } = useQuery({
  queryKey: ["users", userId],
  queryFn: () => fetchUser(userId),
  placeholderData: (previousData) => previousData, // Keep old data while fetching
});
```

## DevTools

The Query DevTools show cache state, query status, and timing:

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} position="bottom" />
      )}
    </QueryClientProvider>
  );
}
```

## Next Steps

- [TanStack Form](tanstack-form.md) - Form state management
- [Type-Safe APIs](../../integration/type-safe-apis.md) - Hono RPC integration
- [Frontend-Backend Integration](../../integration/frontend-backend.md) - Full patterns
