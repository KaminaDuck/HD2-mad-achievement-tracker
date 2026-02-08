---
title: "Bun HTTP Server"
description: "High-performance HTTP server with Bun.serve, routing, and HTML imports"
type: "api-reference"
tags: ["bun", "http", "server", "bun.serve", "routing", "web-server"]
category: "typescript"
subcategory: "http"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun HTTP Server Documentation"
    url: "https://bun.sh/docs/runtime/http/server"
related:
  - "../README.md"
  - "./routing.md"
  - "./websockets.md"
author: "unknown"
contributors: []
---

# Bun HTTP Server

Use `Bun.serve` to start a high-performance HTTP server in Bun. ([Bun Docs][1])

```typescript
const server = Bun.serve({
  routes: {
    // Static routes
    "/api/status": new Response("OK"),

    // Dynamic routes
    "/users/:id": req => {
      return new Response(`Hello User ${req.params.id}!`);
    },

    // Per-HTTP method handlers
    "/api/posts": {
      GET: () => new Response("List posts"),
      POST: async req => {
        const body = await req.json();
        return Response.json({ created: true, ...body });
      },
    },

    // Wildcard route
    "/api/*": Response.json({ message: "Not found" }, { status: 404 }),

    // Redirect
    "/blog/hello": Response.redirect("/blog/hello/world"),

    // Serve a file
    "/favicon.ico": Bun.file("./favicon.ico"),
  },

  // Fallback for unmatched routes
  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at ${server.url}`);
```

## Performance

`Bun.serve` can handle roughly **2.5x more requests per second** than Node.js on Linux.

| Runtime | Requests per second |
|---------|---------------------|
| Node 16 | ~64,000 |
| Bun | ~160,000 |

## HTML Imports

Full-stack applications with both server-side and client-side code:

```typescript
import myReactSinglePageApp from "./index.html";

Bun.serve({
  routes: {
    "/": myReactSinglePageApp,
  },
});
```

**Development (`bun --hot`):** Assets bundled on-demand with HMR.
**Production (`bun build`):** Pre-built manifest with zero runtime bundling.

## Configuration

### Port and Hostname

```typescript
Bun.serve({
  port: 8080,      // defaults to $BUN_PORT, $PORT, $NODE_PORT, or 3000
  hostname: "mydomain.com", // defaults to "0.0.0.0"
  fetch(req) {
    return new Response("Hello!");
  },
});

// Random available port
const server = Bun.serve({ port: 0, fetch(req) { ... } });
console.log(server.port);
```

### Default Port

```bash
bun --port=4002 server.ts
BUN_PORT=4002 bun server.ts
PORT=4002 bun server.ts
```

### Unix Domain Sockets

```typescript
Bun.serve({
  unix: "/tmp/my-socket.sock",
  fetch(req) {
    return new Response("Hello!");
  },
});

// Abstract namespace socket (Linux)
Bun.serve({
  unix: "\0my-abstract-socket",
  fetch(req) { ... },
});
```

### Idle Timeout

```typescript
Bun.serve({
  idleTimeout: 10, // 10 seconds
  fetch(req) {
    return new Response("Bun!");
  },
});
```

## Export Default Syntax

Alternative syntax using default export:

```typescript
import type { Serve } from "bun";

export default {
  fetch(req) {
    return new Response("Bun!");
  },
} satisfies Serve.Options<undefined>;
```

## Hot Route Reloading

Update routes without server restarts:

```typescript
const server = Bun.serve({
  routes: {
    "/api/version": () => Response.json({ version: "1.0.0" }),
  },
});

// Deploy new routes without downtime
server.reload({
  routes: {
    "/api/version": () => Response.json({ version: "2.0.0" }),
  },
});
```

## Server Lifecycle Methods

### server.stop()

```typescript
// Gracefully stop (waits for in-flight requests)
await server.stop();

// Force stop and close all active connections
await server.stop(true);
```

### server.ref() and server.unref()

```typescript
server.unref(); // Don't keep process alive
server.ref();   // Keep process alive (default)
```

### server.reload()

```typescript
server.reload({
  routes: { "/api/version": Response.json({ version: "v2" }) },
  fetch(req) { return new Response("v2"); },
});
```

## Per-Request Controls

### server.timeout(Request, seconds)

```typescript
Bun.serve({
  async fetch(req, server) {
    server.timeout(req, 60); // 60 second timeout
    await req.text();
    return new Response("Done!");
  },
});
```

### server.requestIP(Request)

```typescript
Bun.serve({
  fetch(req, server) {
    const address = server.requestIP(req);
    if (address) {
      return new Response(`Client IP: ${address.address}`);
    }
    return new Response("Unknown client");
  },
});
```

## Server Metrics

```typescript
const server = Bun.serve({
  fetch(req, server) {
    return new Response(
      `Active requests: ${server.pendingRequests}\n` +
      `Active WebSockets: ${server.pendingWebSockets}`
    );
  },
});

// WebSocket subscriber count
const chatUsers = server.subscriberCount("chat");
```

## REST API Example

```typescript
import { Database } from "bun:sqlite";

const db = new Database("posts.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )
`);

Bun.serve({
  routes: {
    "/api/posts": {
      GET: () => {
        const posts = db.query("SELECT * FROM posts").all();
        return Response.json(posts);
      },
      POST: async req => {
        const post = await req.json();
        const id = crypto.randomUUID();
        db.query(
          `INSERT INTO posts (id, title, content, created_at)
           VALUES (?, ?, ?, ?)`
        ).run(id, post.title, post.content, new Date().toISOString());
        return Response.json({ id, ...post }, { status: 201 });
      },
    },
    "/api/posts/:id": req => {
      const post = db.query("SELECT * FROM posts WHERE id = ?")
        .get(req.params.id);
      if (!post) {
        return new Response("Not Found", { status: 404 });
      }
      return Response.json(post);
    },
  },
  error(error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  },
});
```

---

[1]: https://bun.sh/docs/runtime/http/server "Bun HTTP Server Documentation"
