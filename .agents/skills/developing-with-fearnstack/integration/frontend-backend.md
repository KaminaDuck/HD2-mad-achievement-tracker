---
title: Frontend-Backend Integration
description: Connecting React frontend to Hono backend with type-safe RPC and TanStack Query
---

# Frontend-Backend Integration

This guide covers the full-stack type-safe promise: connect your React frontend to your Hono backend with complete type inference from API definition to UI consumption.

## Integration Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   React     │────▶│  Hono RPC    │────▶│   Hono      │
│  Frontend   │◀────│   Client     │◀────│   Backend   │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │                    │
       ▼                   ▼                    ▼
  TanStack Query    Type Inference      Zod Validation
```

**The Promise**: Define your API once in Hono, get:
- Type-safe client methods
- Automatic request/response typing
- IDE autocomplete across the stack
- Runtime validation on both ends

## Setting Up the Backend

### Hono App with RPC Routes

Create a Hono app with typed routes:

```typescript
// src/server/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
});

const createUserSchema = userSchema.omit({ id: true });

const users = new Hono()
  .get("/", async (c) => {
    const users = await db.users.findMany();
    return c.json(users);
  })
  .get("/:id", async (c) => {
    const { id } = c.req.param();
    const user = await db.users.findUnique({ where: { id } });
    if (!user) return c.json({ error: "Not found" }, 404);
    return c.json(user);
  })
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json");
    const user = await db.users.create({ data: { ...data, id: crypto.randomUUID() } });
    return c.json(user, 201);
  })
  .patch("/:id", zValidator("json", createUserSchema.partial()), async (c) => {
    const { id } = c.req.param();
    const data = c.req.valid("json");
    const user = await db.users.update({ where: { id }, data });
    return c.json(user);
  })
  .delete("/:id", async (c) => {
    const { id } = c.req.param();
    await db.users.delete({ where: { id } });
    return c.json({ success: true });
  });

export { users };
```

### Main App and Type Export

```typescript
// src/server/index.ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { users } from "./routes/users";

const app = new Hono()
  .use("*", cors())
  .basePath("/api")
  .route("/users", users);

// CRITICAL: Export the app type for client generation
export type AppType = typeof app;

export default app;
```

## Generating the RPC Client

### Creating the Type-Safe Client

```typescript
// src/client/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@/server";

// Create type-safe client
export const client = hc<AppType>(import.meta.env.VITE_API_URL || "http://localhost:3001");

// The client is fully typed:
// client.api.users.$get()     - GET /api/users
// client.api.users.$post()    - POST /api/users
// client.api.users[":id"].$get()    - GET /api/users/:id
// client.api.users[":id"].$patch()  - PATCH /api/users/:id
// client.api.users[":id"].$delete() - DELETE /api/users/:id
```

### Type Inference Deep Dive

```typescript
// The client infers:
// - Request body types from zValidator schemas
// - Response types from c.json() calls
// - URL parameters from route patterns

const response = await client.api.users.$post({
  json: {
    name: "Alice",   // Required, min 2 chars
    email: "alice@example.com",  // Required, valid email
    // id omitted - not in createUserSchema
  },
});

// response is typed as Response
const user = await response.json();
// user is inferred as { id: string; name: string; email: string }
```

## Integrating with TanStack Query

### QueryClient Setup

```typescript
// src/client/lib/query.ts
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Query Options Factory

Create reusable query options:

```typescript
// src/client/queries/users.ts
import { queryOptions } from "@tanstack/react-query";
import { client } from "../lib/api";

export const userQueries = {
  all: () =>
    queryOptions({
      queryKey: ["users"],
      queryFn: async () => {
        const res = await client.api.users.$get();
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      },
    }),

  byId: (userId: string) =>
    queryOptions({
      queryKey: ["users", userId],
      queryFn: async () => {
        const res = await client.api.users[":id"].$get({
          param: { id: userId },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        return res.json();
      },
      enabled: !!userId,
    }),
};
```

### Using Queries in Components

```tsx
// src/client/components/UserList.tsx
import { useQuery } from "@tanstack/react-query";
import { userQueries } from "../queries/users";

function UserList() {
  const { data: users, isLoading, error } = useQuery(userQueries.all());

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name} - {user.email}</li>
      ))}
    </ul>
  );
}
```

### Mutations with Query Integration

```typescript
// src/client/mutations/users.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/api";

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; email: string }) => {
      const res = await client.api.users.$post({ json: data });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; email?: string }) => {
      const res = await client.api.users[":id"].$patch({
        param: { id },
        json: data,
      });
      if (!res.ok) throw new Error("Failed to update user");
      return res.json();
    },
    onSuccess: (data) => {
      // Update specific user in cache
      queryClient.setQueryData(["users", data.id], data);
      // Invalidate list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.api.users[":id"].$delete({
        param: { id },
      });
      if (!res.ok) throw new Error("Failed to delete user");
      return res.json();
    },
    onSuccess: (_, deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ["users", deletedId] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

## Request/Response Patterns

### Error Handling

```typescript
// Backend: Consistent error responses
app.onError((err, c) => {
  console.error(err);
  return c.json(
    {
      error: err.message || "Internal server error",
      code: "INTERNAL_ERROR",
    },
    500
  );
});

// Frontend: Handle errors in mutations
const createUser = useCreateUser();

const handleSubmit = async (data: FormData) => {
  try {
    await createUser.mutateAsync(data);
    toast.success("User created!");
  } catch (error) {
    if (error instanceof Error) {
      toast.error(error.message);
    }
  }
};
```

### Loading States

```tsx
function CreateUserButton() {
  const createUser = useCreateUser();

  return (
    <button
      onClick={() => createUser.mutate({ name: "New User", email: "new@example.com" })}
      disabled={createUser.isPending}
    >
      {createUser.isPending ? "Creating..." : "Create User"}
    </button>
  );
}
```

## Optimistic Updates

```typescript
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }) => {
      const res = await client.api.users[":id"].$patch({
        param: { id },
        json: data,
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },

    // Optimistically update the cache
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users", newData.id] });

      // Snapshot previous value
      const previousUser = queryClient.getQueryData(["users", newData.id]);

      // Optimistically update
      queryClient.setQueryData(["users", newData.id], (old: any) => ({
        ...old,
        ...newData,
      }));

      return { previousUser };
    },

    // Rollback on error
    onError: (err, newData, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(["users", newData.id], context.previousUser);
      }
    },

    // Refetch after success or error
    onSettled: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["users", data.id] });
      }
    },
  });
}
```

## Cache Invalidation Patterns

### Targeted Invalidation

```typescript
// Invalidate specific queries
queryClient.invalidateQueries({ queryKey: ["users"] });
queryClient.invalidateQueries({ queryKey: ["users", userId] });

// Invalidate by prefix
queryClient.invalidateQueries({ queryKey: ["users"], exact: false });

// Refetch immediately
queryClient.refetchQueries({ queryKey: ["users"] });
```

### Related Data Invalidation

```typescript
// When updating a user, also invalidate related data
onSuccess: (data) => {
  queryClient.invalidateQueries({ queryKey: ["users"] });
  queryClient.invalidateQueries({ queryKey: ["posts", { authorId: data.id }] });
  queryClient.invalidateQueries({ queryKey: ["comments", { authorId: data.id }] });
},
```

## Complete CRUD Example

```tsx
// src/client/pages/UsersPage.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userQueries } from "../queries/users";
import { useCreateUser, useUpdateUser, useDeleteUser } from "../mutations/users";

export function UsersPage() {
  const { data: users, isLoading } = useQuery(userQueries.all());
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const handleCreate = () => {
    createUser.mutate({
      name: "New User",
      email: `user${Date.now()}@example.com`,
    });
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <button onClick={handleCreate} disabled={createUser.isPending}>
        {createUser.isPending ? "Creating..." : "Add User"}
      </button>

      <ul>
        {users?.map((user) => (
          <li key={user.id}>
            <span>{user.name} ({user.email})</span>
            <button
              onClick={() => updateUser.mutate({ id: user.id, name: `${user.name} (edited)` })}
              disabled={updateUser.isPending}
            >
              Edit
            </button>
            <button
              onClick={() => deleteUser.mutate(user.id)}
              disabled={deleteUser.isPending}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Testing Integration

### Testing API Calls

```typescript
// src/client/queries/users.test.ts
import { describe, it, expect, mock } from "bun:test";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { userQueries } from "./users";

const wrapper = ({ children }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe("userQueries", () => {
  it("fetches users", async () => {
    const { result } = renderHook(
      () => useQuery(userQueries.all()),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toHaveLength(2);
  });
});
```

### Testing with Hono Test Client

```typescript
// src/server/routes/users.test.ts
import { describe, it, expect } from "bun:test";
import { testClient } from "hono/testing";
import app from "../index";

describe("Users API", () => {
  const client = testClient(app);

  it("creates a user", async () => {
    const res = await client.api.users.$post({
      json: { name: "Test User", email: "test@example.com" },
    });

    expect(res.status).toBe(201);
    const user = await res.json();
    expect(user.name).toBe("Test User");
  });
});
```

## Related Documentation

- [Hono RPC](../domains/backend/hono-rpc.md) - RPC client details
- [TanStack Query](../domains/frontend/tanstack-query.md) - Query patterns
- [Type-Safe APIs](./type-safe-apis.md) - End-to-end type safety
