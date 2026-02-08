---
title: Hono Fundamentals
description: Core Hono concepts - app creation, routing, context, and request handling
---

# Hono Fundamentals

Hono is an ultrafast, lightweight web framework built on Web Standards. It's the backend foundation of Fearnstack, running on Bun with TypeScript-first design.

## Why Hono?

- **Ultrafast** - One of the fastest routers available (~14KB minified)
- **Multi-runtime** - Works on Bun, Deno, Node.js, Cloudflare Workers
- **Web Standards** - Built on Fetch API, Request/Response objects
- **TypeScript First** - Full type support with excellent inference
- **RPC Support** - Type-safe client-server communication

## Installation

```bash
bun add hono @hono/zod-validator
```

## Creating a Hono App

```typescript
// src/server/index.ts
import { Hono } from "hono";

const app = new Hono();

app.get("/", (c) => c.text("Hello Hono!"));
app.get("/json", (c) => c.json({ message: "Hello!" }));

export default app;
```

## Running with Bun

```typescript
// src/server/serve.ts
import app from "./index";

const server = Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

console.log(`Server running at http://localhost:${server.port}`);
```

## HTTP Methods

```typescript
const app = new Hono();

// Standard methods
app.get("/posts", (c) => c.json(posts));
app.post("/posts", (c) => c.json({ created: true }, 201));
app.put("/posts/:id", (c) => c.json({ updated: true }));
app.patch("/posts/:id", (c) => c.json({ patched: true }));
app.delete("/posts/:id", (c) => c.json({ deleted: true }));

// Match all methods
app.all("/api/*", (c) => c.text("API endpoint"));

// Custom methods
app.on("CUSTOM", "/path", (c) => c.text("Custom method"));
```

## The Context Object

The `Context` (`c`) provides request data and response methods:

```typescript
app.get("/user/:id", async (c) => {
  // Path parameters
  const id = c.req.param("id");

  // Query parameters
  const page = c.req.query("page");
  const filters = c.req.queries("filter"); // Array of values

  // Headers
  const auth = c.req.header("Authorization");

  // Request body
  const json = await c.req.json();
  const text = await c.req.text();
  const formData = await c.req.formData();

  // Set response headers
  c.header("X-Custom-Header", "value");

  // Set status
  c.status(200);

  // Return response
  return c.json({ id, page });
});
```

## Response Helpers

```typescript
app.get("/examples", (c) => {
  // JSON response
  return c.json({ data: "value" });

  // JSON with status
  return c.json({ created: true }, 201);

  // Text response
  return c.text("Hello");

  // HTML response
  return c.html("<h1>Hello</h1>");

  // Redirect
  return c.redirect("/other-path");

  // No content
  return c.body(null, 204);

  // Raw Response object
  return new Response("Custom response");
});
```

## Routing

### Path Parameters

```typescript
// Single parameter
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ id });
});

// Multiple parameters
app.get("/posts/:postId/comments/:commentId", (c) => {
  const { postId, commentId } = c.req.param();
  return c.json({ postId, commentId });
});

// Optional parameters
app.get("/users/:id?", (c) => {
  const id = c.req.param("id") ?? "default";
  return c.json({ id });
});
```

### Wildcards

```typescript
// Match any path under /api/
app.get("/api/*", (c) => {
  return c.json({ path: c.req.path });
});
```

### Route Grouping

```typescript
// Group routes with shared prefix
const api = new Hono();

api.get("/users", (c) => c.json([]));
api.get("/posts", (c) => c.json([]));

// Mount at /api
app.route("/api", api);
// Creates: /api/users, /api/posts
```

## Request Body Parsing

```typescript
// JSON
app.post("/json", async (c) => {
  const body = await c.req.json<{ name: string }>();
  return c.json({ received: body.name });
});

// Form data
app.post("/form", async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"]; // File upload
  return c.json({ filename: file?.name });
});

// Raw body
app.post("/raw", async (c) => {
  const blob = await c.req.blob();
  const arrayBuffer = await c.req.arrayBuffer();
  return c.json({ size: arrayBuffer.byteLength });
});
```

## Error Handling

### HTTPException

```typescript
import { HTTPException } from "hono/http-exception";

app.get("/protected", (c) => {
  const auth = c.req.header("Authorization");

  if (!auth) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  return c.json({ data: "protected" });
});
```

### Global Error Handler

```typescript
app.onError((err, c) => {
  console.error(`Error: ${err.message}`);

  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  return c.json({ error: "Internal Server Error" }, 500);
});
```

### Not Found Handler

```typescript
app.notFound((c) => {
  return c.json({ error: "Not Found", path: c.req.path }, 404);
});
```

## Environment Variables

Access environment variables through context:

```typescript
// With typed env
type Env = {
  DATABASE_URL: string;
  API_KEY: string;
};

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  const dbUrl = c.env.DATABASE_URL; // Typed!
  return c.json({ connected: true });
});
```

With Bun, use `process.env` or `Bun.env`:

```typescript
const app = new Hono();

app.get("/", (c) => {
  const apiKey = process.env.API_KEY;
  return c.json({ hasKey: !!apiKey });
});
```

## Project Structure

Recommended structure for Fearnstack apps:

```
src/
├── server/
│   ├── index.ts        # Main Hono app export
│   ├── serve.ts        # Bun.serve entry point
│   ├── routes/
│   │   ├── users.ts    # User routes
│   │   ├── posts.ts    # Post routes
│   │   └── index.ts    # Route aggregation
│   ├── middleware/
│   │   └── auth.ts     # Custom middleware
│   └── services/
│       └── db.ts       # Database access
```

### Route Organization

```typescript
// src/server/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const users = new Hono()
  .get("/", (c) => c.json([]))
  .get("/:id", (c) => c.json({ id: c.req.param("id") }))
  .post(
    "/",
    zValidator("json", z.object({ name: z.string() })),
    (c) => c.json({ created: true }, 201)
  );

export { users };

// src/server/routes/index.ts
import { Hono } from "hono";
import { users } from "./users";

const routes = new Hono()
  .route("/users", users);

export { routes };

// src/server/index.ts
import { Hono } from "hono";
import { routes } from "./routes";

const app = new Hono()
  .route("/api", routes);

export type AppType = typeof app;
export default app;
```

## Presets

Choose the right Hono preset:

| Preset | Use Case |
|--------|----------|
| `hono` | Default, best for Bun/Node long-running servers |
| `hono/quick` | Fast startup, per-request initialization |
| `hono/tiny` | Smallest bundle, resource-constrained |

```typescript
// Default (recommended for Fearnstack)
import { Hono } from "hono";

// Minimal size
import { Hono } from "hono/tiny";
```

## Testing

Use the built-in test helper:

```typescript
import { testClient } from "hono/testing";
import app from "./index";

describe("API", () => {
  const client = testClient(app);

  it("should return users", async () => {
    const res = await client.api.users.$get();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

## Next Steps

- [Hono RPC](hono-rpc.md) - Type-safe client-server communication
- [Hono Middleware](hono-middleware.md) - CORS, auth, validation
- [Hono Streaming](hono-streaming.md) - SSE and streaming responses
