---
title: Hono RPC
description: Type-safe RPC with Hono client for end-to-end type safety
---

# Hono RPC

Hono RPC enables type-safe client-server communication by sharing API specifications through TypeScript types. The client automatically infers input and output types from your server routes.

## Why Hono RPC?

- **End-to-End Type Safety** - Types flow from server to client automatically
- **Zero Code Generation** - No build step required
- **Full Inference** - Request params, body, and response all typed
- **TanStack Query Integration** - Works seamlessly with Query

## Prerequisites

For RPC types to work properly, ensure `"strict": true` is set in both client and server `tsconfig.json` files.

## Server Setup

Define routes with validators and export the app type:

```typescript
// src/server/index.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// Define schemas
const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

const app = new Hono()
  .get("/api/users", async (c) => {
    const users = await getUsers();
    return c.json(users);
  })
  .get("/api/users/:id", async (c) => {
    const id = c.req.param("id");
    const user = await getUser(id);
    if (!user) {
      return c.json({ error: "Not found" }, 404);
    }
    return c.json(user);
  })
  .post("/api/users", zValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json");
    const user = await createUser(data);
    return c.json(user, 201);
  });

// Export the app type for the client
export type AppType = typeof app;
export default app;
```

## Client Setup

Create a typed client using `hc`:

```typescript
// src/client/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "../../../server";

// Create typed client
export const client = hc<AppType>("http://localhost:3001");

// Make typed requests
async function example() {
  // GET request - response is typed!
  const res = await client.api.users.$get();
  if (res.ok) {
    const users = await res.json(); // User[]
    console.log(users);
  }

  // POST request with typed body
  const createRes = await client.api.users.$post({
    json: {
      name: "Alice",
      email: "alice@example.com",
    },
  });

  if (createRes.ok) {
    const user = await createRes.json(); // User
    console.log(user);
  }
}
```

## Path Parameters

```typescript
// Server
const app = new Hono()
  .get("/api/posts/:postId/comments/:commentId", (c) => {
    const { postId, commentId } = c.req.param();
    return c.json({ postId, commentId });
  });

// Client - params must be strings
const res = await client.api.posts[":postId"].comments[":commentId"].$get({
  param: {
    postId: "123",
    commentId: "456",
  },
});
```

## Query Parameters

```typescript
// Server
const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
  search: z.string().optional(),
});

const app = new Hono()
  .get("/api/users", zValidator("query", querySchema), (c) => {
    const { page, limit, search } = c.req.valid("query");
    return c.json({ page, limit, search });
  });

// Client - query values must be strings
const res = await client.api.users.$get({
  query: {
    page: "2",
    limit: "20",
    search: "alice",
  },
});
```

## Status Code Handling

Handle different response status codes with type narrowing:

```typescript
// Server
const app = new Hono()
  .get("/api/users/:id", async (c) => {
    const id = c.req.param("id");
    const user = await getUser(id);

    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json(user, 200);
  });

// Client
const res = await client.api.users[":id"].$get({
  param: { id: "123" },
});

if (res.status === 404) {
  const data = await res.json(); // { error: string }
  console.error(data.error);
} else if (res.ok) {
  const user = await res.json(); // User
  console.log(user.name);
}
```

## Integration with TanStack Query

Use Hono RPC with Query for caching and state management:

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
    }),
};

// Usage in component
function UserList() {
  const { data: users, isLoading } = useQuery(userQueries.all());

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

## Mutations with Query

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
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// Usage
function CreateUserForm() {
  const mutation = useCreateUser();

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
      <input name="name" required />
      <input name="email" type="email" required />
      <button disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Create User"}
      </button>
    </form>
  );
}
```

## Type Inference Helpers

### InferRequestType

Extract request types from endpoints:

```typescript
import type { InferRequestType } from "hono/client";

type CreateUserRequest = InferRequestType<typeof client.api.users.$post>["json"];
// { name: string; email: string }
```

### InferResponseType

Extract response types:

```typescript
import type { InferResponseType } from "hono/client";

type UsersResponse = InferResponseType<typeof client.api.users.$get>;
// User[]

// With specific status code
type User200 = InferResponseType<typeof client.api.users.$get, 200>;
type User404 = InferResponseType<typeof client.api.users.$get, 404>;
```

## Request Configuration

### Custom Headers

```typescript
// Per-request headers
const res = await client.api.users.$get(undefined, {
  headers: {
    Authorization: "Bearer token123",
  },
});

// Global headers
const authenticatedClient = hc<AppType>("http://localhost:3001", {
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});
```

### With Credentials (Cookies)

```typescript
const client = hc<AppType>("http://localhost:3001", {
  init: {
    credentials: "include",
  },
});
```

### Abort Requests

```typescript
const controller = new AbortController();

const res = await client.api.users.$get(undefined, {
  init: {
    signal: controller.signal,
  },
});

// Later, to cancel:
controller.abort();
```

## File Uploads

```typescript
// Server
const uploadSchema = z.object({
  file: z.instanceof(File),
  description: z.string().optional(),
});

const app = new Hono()
  .post("/api/upload", zValidator("form", uploadSchema), async (c) => {
    const { file, description } = c.req.valid("form");
    const url = await uploadFile(file);
    return c.json({ url, name: file.name, description });
  });

// Client
const file = new File([blob], "photo.jpg", { type: "image/jpeg" });

const res = await client.api.upload.$post({
  form: {
    file,
    description: "Profile photo",
  },
});
```

## URL Access

Get URL without making a request:

```typescript
// Get URL object
const url = client.api.users.$url();
console.log(url.pathname); // "/api/users"

// With parameters
const userUrl = client.api.users[":id"].$url({
  param: { id: "123" },
});
console.log(userUrl.pathname); // "/api/users/123"
```

## Larger Applications

### Route Organization

```typescript
// src/server/routes/users.ts
import { Hono } from "hono";

export const users = new Hono()
  .get("/", (c) => c.json([]))
  .post("/", (c) => c.json({ created: true }, 201))
  .get("/:id", (c) => c.json({ id: c.req.param("id") }));

// src/server/routes/posts.ts
import { Hono } from "hono";

export const posts = new Hono()
  .get("/", (c) => c.json([]))
  .post("/", (c) => c.json({ created: true }, 201));

// src/server/index.ts
import { Hono } from "hono";
import { users } from "./routes/users";
import { posts } from "./routes/posts";

const app = new Hono()
  .route("/api/users", users)
  .route("/api/posts", posts);

export type AppType = typeof app;
export default app;
```

## Performance Tips

### Compile Types

For large APIs, pre-compile types:

```typescript
// src/client/lib/client-typed.ts
import { hc } from "hono/client";
import type { AppType } from "../../../server";

export type Client = ReturnType<typeof hc<AppType>>;

export const createClient = (baseUrl: string): Client =>
  hc<AppType>(baseUrl);
```

### Version Matching

Ensure Hono versions match between frontend and backend to avoid type issues.

## Next Steps

- [Hono Middleware](hono-middleware.md) - Authentication and validation
- [Type-Safe APIs](../../integration/type-safe-apis.md) - End-to-end patterns
- [TanStack Query](../frontend/tanstack-query.md) - Client-side caching
