---
title: "Bun Routing"
description: "Define routes in Bun.serve with static paths, parameters, and wildcards"
type: "api-reference"
tags: ["bun", "routing", "http", "server", "routes", "url-params"]
category: "typescript"
subcategory: "http"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Routing Documentation"
    url: "https://bun.sh/docs/runtime/http/routing"
related:
  - "../README.md"
  - "./server.md"
  - "./websockets.md"
author: "unknown"
contributors: []
---

# Bun Routing

Add routes to `Bun.serve()` using the `routes` property for static paths, parameters, and wildcards. ([Bun Docs][1])

Bun's router features:
- SIMD-accelerated route parameter decoding
- JavaScriptCore structure caching
- Tree-based approach from uWebSockets

## Basic Setup

```typescript
Bun.serve({
  routes: {
    "/": () => new Response("Home"),
    "/api": () => Response.json({ success: true }),
    "/users": async () => Response.json({ users: [] }),
  },
  fetch() {
    return new Response("Unmatched route");
  },
});
```

Routes receive a `BunRequest` and return a `Response` or `Promise<Response>`:

```typescript
interface BunRequest<T extends string> extends Request {
  params: Record<T, string>;
  readonly cookies: CookieMap;
}
```

## Asynchronous Routes

### Async/await

```typescript
import { sql, serve } from "bun";

serve({
  routes: {
    "/api/version": async () => {
      const [version] = await sql`SELECT version()`;
      return Response.json(version);
    },
  },
});
```

### Promise

```typescript
serve({
  routes: {
    "/api/version": () => {
      return new Promise(resolve => {
        setTimeout(async () => {
          const [version] = await sql`SELECT version()`;
          resolve(Response.json(version));
        }, 100);
      });
    },
  },
});
```

## Route Precedence

Routes are matched in order of specificity:

1. Exact routes (`/users/all`)
2. Parameter routes (`/users/:id`)
3. Wildcard routes (`/users/*`)
4. Global catch-all (`/*`)

```typescript
Bun.serve({
  routes: {
    "/api/users/me": () => new Response("Current user"),
    "/api/users/:id": req => new Response(`User ${req.params.id}`),
    "/api/*": () => new Response("API catch-all"),
    "/*": () => new Response("Global catch-all"),
  },
});
```

## Type-safe Route Parameters

TypeScript parses route parameters from string literals:

```typescript
import type { BunRequest } from "bun";

Bun.serve({
  routes: {
    // TypeScript infers params shape
    "/orgs/:orgId/repos/:repoId": req => {
      const { orgId, repoId } = req.params;
      return Response.json({ orgId, repoId });
    },

    // Explicit type annotation
    "/orgs/:orgId/repos/:repoId/settings": (
      req: BunRequest<"/orgs/:orgId/repos/:repoId/settings">
    ) => {
      const { orgId, repoId } = req.params;
      return Response.json({ orgId, repoId });
    },
  },
});
```

Percent-encoded route parameter values are automatically decoded.

## Static Responses

Zero-allocation dispatch for fixed content:

```typescript
Bun.serve({
  routes: {
    // Health checks
    "/health": new Response("OK"),
    "/ready": new Response("Ready", {
      headers: { "X-Ready": "1" },
    }),

    // Redirects
    "/blog": Response.redirect("https://bun.com/blog"),

    // API responses
    "/api/config": Response.json({
      version: "1.0.0",
      env: "production",
    }),
  },
});
```

Static responses provide at least **15% performance improvement** and don't allocate after initialization.

## File Responses vs Static Responses

```typescript
Bun.serve({
  routes: {
    // Static - content buffered in memory at startup
    "/logo.png": new Response(await Bun.file("./logo.png").bytes()),

    // File - content read from filesystem per request
    "/download.zip": new Response(Bun.file("./download.zip")),
  },
});
```

### Static Routes (Buffered)
- Zero filesystem I/O during requests
- ETag support with If-None-Match (304)
- Missing files cause startup errors
- Best for: Small static assets, API responses

### File Routes (Per-Request)
- Filesystem reads on each request
- Built-in 404 handling
- Last-Modified with If-Modified-Since (304)
- Range request support (partial content)
- Streaming with backpressure handling
- Best for: Large files, dynamic content, user uploads

## Streaming Files

```typescript
Bun.serve({
  fetch(req) {
    return new Response(Bun.file("./hello.txt"));
  },
});
```

Uses `sendfile(2)` system call for zero-copy file transfers.

### Partial Content (Range Requests)

```typescript
Bun.serve({
  fetch(req) {
    const [start = 0, end = Infinity] = req.headers
      .get("Range")         // Range: bytes=0-100
      .split("=")
      .at(-1)
      .split("-")
      .map(Number);

    const bigFile = Bun.file("./big-video.mp4");
    return new Response(bigFile.slice(start, end));
  },
});
```

## Fetch Request Handler

Handle unmatched requests:

```typescript
Bun.serve({
  fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/") return new Response("Home page!");
    if (url.pathname === "/blog") return new Response("Blog!");
    return new Response("404!");
  },
});
```

### Async fetch

```typescript
import { sleep, serve } from "bun";

serve({
  async fetch(req) {
    const start = performance.now();
    await sleep(10);
    const end = performance.now();
    return new Response(`Slept for ${end - start}ms`);
  },
});
```

### Proxy requests

```typescript
Bun.serve({
  fetch(req) {
    return fetch("https://example.com");
  },
});
```

### Access Server Object

```typescript
const server = Bun.serve({
  fetch(req, server) {
    const ip = server.requestIP(req);
    return new Response(`Your IP is ${ip.address}`);
  },
});
```

---

[1]: https://bun.sh/docs/runtime/http/routing "Bun Routing Documentation"
