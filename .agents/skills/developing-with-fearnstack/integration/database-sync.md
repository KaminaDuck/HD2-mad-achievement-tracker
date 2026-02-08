---
title: Database Sync Integration
description: Syncing TanStack DB client-side state with backend databases
---

# Database Sync Integration

TanStack DB provides client-side collections that can sync with backend databases. This guide covers different sync strategies from query-backed collections to real-time sync with WebSockets.

## Sync Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT                                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  TanStack DB    │───▶│  Sync Layer     │───▶│  UI Components  │  │
│  │  Collections    │◀───│  (mutations)    │◀───│  (reactive)     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
│           │                     │                                    │
│           │  LocalStorage       │  HTTP/WS                          │
│           ▼                     ▼                                    │
│    ┌───────────┐         ┌───────────┐                              │
│    │  Offline  │         │  Server   │                              │
│    │  Cache    │         │  API      │                              │
│    └───────────┘         └───────────┘                              │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SERVER                                       │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐  │
│  │  Hono API       │───▶│  Business       │───▶│  Database       │  │
│  │  Endpoints      │◀───│  Logic          │◀───│  (Postgres)     │  │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Collection Types

### LocalOnly Collections

No sync—data lives only in browser:

```typescript
// src/client/collections/preferences.ts
import { createLocalStorageCollection } from "@tanstack/db";
import { z } from "zod";

const preferencesSchema = z.object({
  id: z.string(),
  theme: z.enum(["light", "dark"]),
  fontSize: z.number(),
  notifications: z.boolean(),
});

export const preferencesCollection = createLocalStorageCollection({
  name: "preferences",
  schema: preferencesSchema,
  primaryKey: "id",
});

// Usage - stays local
preferencesCollection.insert({
  id: "user-prefs",
  theme: "dark",
  fontSize: 14,
  notifications: true,
});
```

### Query-Backed Collections

Sync via TanStack Query:

```typescript
// src/client/collections/users.ts
import { createQueryBackedCollection } from "@tanstack/db";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { client } from "../lib/api";
import { userSchema } from "@/shared/schemas/user";

export const usersCollection = createQueryBackedCollection({
  name: "users",
  schema: userSchema,
  primaryKey: "id",

  // Fetch all users
  useQuery: () =>
    useQuery({
      queryKey: ["users"],
      queryFn: async () => {
        const res = await client.api.users.$get();
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      },
    }),

  // Create user
  useInsertMutation: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (data) => {
        const res = await client.api.users.$post({ json: data });
        if (!res.ok) throw new Error("Failed to create");
        return res.json();
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
      },
    });
  },

  // Update user
  useUpdateMutation: () => {
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
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.setQueryData(["users", data.id], data);
      },
    });
  },

  // Delete user
  useDeleteMutation: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (id) => {
        const res = await client.api.users[":id"].$delete({
          param: { id },
        });
        if (!res.ok) throw new Error("Failed to delete");
      },
      onSuccess: (_, id) => {
        queryClient.invalidateQueries({ queryKey: ["users"] });
        queryClient.removeQueries({ queryKey: ["users", id] });
      },
    });
  },
});
```

## Optimistic Updates

### With TanStack Query

```typescript
// src/client/mutations/users.ts
export function useUpdateUserOptimistic() {
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

    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["users"] });

      // Snapshot current state
      const previousUsers = queryClient.getQueryData(["users"]);

      // Optimistically update
      queryClient.setQueryData(["users"], (old: User[]) =>
        old.map((user) =>
          user.id === newData.id ? { ...user, ...newData } : user
        )
      );

      return { previousUsers };
    },

    // Rollback on error
    onError: (err, newData, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(["users"], context.previousUsers);
      }
    },

    // Refetch after mutation
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
```

### With React 19 useOptimistic

```tsx
// src/client/components/UserList.tsx
import { useOptimistic, useTransition } from "react";

function UserList({ users }: { users: User[] }) {
  const [isPending, startTransition] = useTransition();
  const [optimisticUsers, addOptimisticUser] = useOptimistic(
    users,
    (state, newUser: User) => [...state, newUser]
  );

  const handleAddUser = async (data: CreateUser) => {
    // Show optimistic update immediately
    const tempUser = { ...data, id: `temp-${Date.now()}` };
    startTransition(() => {
      addOptimisticUser(tempUser);
    });

    // Actually create
    await client.api.users.$post({ json: data });
  };

  return (
    <ul>
      {optimisticUsers.map((user) => (
        <li key={user.id} className={user.id.startsWith("temp-") ? "pending" : ""}>
          {user.name}
        </li>
      ))}
    </ul>
  );
}
```

## Real-Time Sync Patterns

### WebSocket Integration

```typescript
// src/server/routes/sync.ts
import { Hono } from "hono";
import { upgradeWebSocket } from "hono/ws";

const sync = new Hono()
  .get(
    "/",
    upgradeWebSocket((c) => ({
      onOpen: (event, ws) => {
        console.log("Client connected");
        // Subscribe to database changes
        subscribeToChanges((change) => {
          ws.send(JSON.stringify(change));
        });
      },
      onMessage: (event, ws) => {
        const message = JSON.parse(event.data as string);
        handleClientMessage(message, ws);
      },
      onClose: () => {
        console.log("Client disconnected");
        unsubscribeFromChanges();
      },
    }))
  );

export { sync };
```

### Client WebSocket Handler

```typescript
// src/client/lib/sync.ts
import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useSyncConnection() {
  const wsRef = useRef<WebSocket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/api/sync`);

    ws.onmessage = (event) => {
      const change = JSON.parse(event.data);

      switch (change.type) {
        case "insert":
          queryClient.setQueryData([change.collection], (old: any[]) =>
            old ? [...old, change.data] : [change.data]
          );
          break;
        case "update":
          queryClient.setQueryData([change.collection], (old: any[]) =>
            old?.map((item) =>
              item.id === change.data.id ? change.data : item
            )
          );
          break;
        case "delete":
          queryClient.setQueryData([change.collection], (old: any[]) =>
            old?.filter((item) => item.id !== change.id)
          );
          break;
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, [queryClient]);

  return wsRef;
}
```

### Polling Strategy

```typescript
// src/client/queries/users.ts
export const userQueries = {
  all: () =>
    queryOptions({
      queryKey: ["users"],
      queryFn: async () => {
        const res = await client.api.users.$get();
        return res.json();
      },
      // Poll every 30 seconds
      refetchInterval: 30000,
      // Only poll when window is focused
      refetchIntervalInBackground: false,
    }),
};
```

## Offline-First Patterns

### Mutation Queue

```typescript
// src/client/lib/offline-queue.ts
interface QueuedMutation {
  id: string;
  type: "insert" | "update" | "delete";
  collection: string;
  data: unknown;
  timestamp: number;
}

class OfflineQueue {
  private queue: QueuedMutation[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    window.addEventListener("online", () => this.processQueue());
    window.addEventListener("offline", () => (this.isOnline = false));

    // Load persisted queue
    const saved = localStorage.getItem("offline-queue");
    if (saved) this.queue = JSON.parse(saved);
  }

  add(mutation: Omit<QueuedMutation, "id" | "timestamp">) {
    const item = {
      ...mutation,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    this.queue.push(item);
    this.persist();

    if (this.isOnline) {
      this.processQueue();
    }
  }

  private async processQueue() {
    this.isOnline = true;

    while (this.queue.length > 0) {
      const mutation = this.queue[0];

      try {
        await this.executeMutation(mutation);
        this.queue.shift();
        this.persist();
      } catch (error) {
        console.error("Failed to sync mutation:", error);
        break; // Stop processing on error
      }
    }
  }

  private async executeMutation(mutation: QueuedMutation) {
    switch (mutation.collection) {
      case "users":
        if (mutation.type === "insert") {
          await client.api.users.$post({ json: mutation.data as any });
        } else if (mutation.type === "update") {
          const { id, ...data } = mutation.data as any;
          await client.api.users[":id"].$patch({ param: { id }, json: data });
        } else if (mutation.type === "delete") {
          await client.api.users[":id"].$delete({
            param: { id: mutation.data as string },
          });
        }
        break;
    }
  }

  private persist() {
    localStorage.setItem("offline-queue", JSON.stringify(this.queue));
  }
}

export const offlineQueue = new OfflineQueue();
```

### Using the Queue

```typescript
// src/client/hooks/useOfflineCreate.ts
import { offlineQueue } from "../lib/offline-queue";

export function useOfflineCreate(collection: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      // Try online first
      if (navigator.onLine) {
        const res = await client.api[collection].$post({ json: data });
        if (!res.ok) throw new Error("Failed");
        return res.json();
      }

      // Queue for later
      const tempId = `offline-${crypto.randomUUID()}`;
      offlineQueue.add({ type: "insert", collection, data: { ...data, id: tempId } });

      return { ...data, id: tempId, _offline: true };
    },
    onSuccess: (data) => {
      // Add to local cache
      queryClient.setQueryData([collection], (old: any[]) =>
        old ? [...old, data] : [data]
      );
    },
  });
}
```

## Backend Requirements

### API Design for Sync

```typescript
// src/server/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const users = new Hono()
  // List with pagination and filtering
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        since: z.coerce.date().optional(), // For delta sync
        cursor: z.string().optional(),
        limit: z.coerce.number().default(50),
      })
    ),
    async (c) => {
      const { since, cursor, limit } = c.req.valid("query");

      const where: any = {};
      if (since) {
        where.updatedAt = { gte: since };
      }
      if (cursor) {
        where.id = { gt: cursor };
      }

      const items = await db.users.findMany({
        where,
        take: limit + 1,
        orderBy: { id: "asc" },
      });

      const hasMore = items.length > limit;
      const data = hasMore ? items.slice(0, -1) : items;
      const nextCursor = hasMore ? data[data.length - 1].id : null;

      return c.json({
        items: data,
        nextCursor,
        hasMore,
      });
    }
  )

  // Batch operations
  .post(
    "/batch",
    zValidator(
      "json",
      z.object({
        operations: z.array(
          z.union([
            z.object({
              type: z.literal("insert"),
              data: createUserSchema,
            }),
            z.object({
              type: z.literal("update"),
              id: z.string().uuid(),
              data: updateUserSchema,
            }),
            z.object({
              type: z.literal("delete"),
              id: z.string().uuid(),
            }),
          ])
        ),
      })
    ),
    async (c) => {
      const { operations } = c.req.valid("json");
      const results = [];

      for (const op of operations) {
        switch (op.type) {
          case "insert":
            results.push(await db.users.create({ data: op.data }));
            break;
          case "update":
            results.push(await db.users.update({ where: { id: op.id }, data: op.data }));
            break;
          case "delete":
            await db.users.delete({ where: { id: op.id } });
            results.push({ deleted: op.id });
            break;
        }
      }

      return c.json({ results });
    }
  );
```

### Version Tracking

```typescript
// Add version field to models
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  version: z.number(), // Incremented on each update
  updatedAt: z.date(),
});

// Backend: Conflict detection
.patch("/:id", async (c) => {
  const { id } = c.req.param();
  const { version, ...data } = await c.req.json();

  const current = await db.users.findUnique({ where: { id } });

  if (current && current.version !== version) {
    return c.json({
      error: "Conflict",
      serverVersion: current.version,
      serverData: current,
    }, 409);
  }

  const updated = await db.users.update({
    where: { id },
    data: { ...data, version: version + 1, updatedAt: new Date() },
  });

  return c.json(updated);
})
```

## Complete Collaborative Example

```tsx
// src/client/pages/TodosPage.tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSyncConnection } from "../lib/sync";

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  updatedAt: string;
}

export function TodosPage() {
  // Real-time sync
  useSyncConnection();

  const queryClient = useQueryClient();
  const { data: todos = [], isLoading } = useQuery({
    queryKey: ["todos"],
    queryFn: async () => {
      const res = await client.api.todos.$get();
      return res.json();
    },
  });

  const createTodo = useMutation({
    mutationFn: async (text: string) => {
      const res = await client.api.todos.$post({ json: { text } });
      return res.json();
    },
    onMutate: async (text) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old = []) => [
        ...old,
        { id: `temp-${Date.now()}`, text, completed: false, updatedAt: "" },
      ]);

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });

  const toggleTodo = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const res = await client.api.todos[":id"].$patch({
        param: { id },
        json: { completed },
      });
      return res.json();
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData<Todo[]>(["todos"]);

      queryClient.setQueryData<Todo[]>(["todos"], (old = []) =>
        old.map((todo) => (todo.id === id ? { ...todo, completed } : todo))
      );

      return { previous };
    },
    onError: (_, __, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["todos"], context.previous);
      }
    },
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const input = form.elements.namedItem("text") as HTMLInputElement;
          createTodo.mutate(input.value);
          input.value = "";
        }}
      >
        <input name="text" placeholder="Add todo..." />
        <button type="submit">Add</button>
      </form>

      <ul>
        {todos.map((todo) => (
          <li
            key={todo.id}
            onClick={() => toggleTodo.mutate({ id: todo.id, completed: !todo.completed })}
            style={{ textDecoration: todo.completed ? "line-through" : "none" }}
          >
            {todo.text}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Related Documentation

- [TanStack DB](../domains/frontend/tanstack-db.md) - Client-side database
- [TanStack Query](../domains/frontend/tanstack-query.md) - Data fetching
- [Frontend-Backend](./frontend-backend.md) - API integration
