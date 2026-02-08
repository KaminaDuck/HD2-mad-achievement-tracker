---
title: "Hono Web Framework"
description: "Ultrafast web framework built on Web Standards for Cloudflare Workers, Bun, Deno, Node.js, and other JavaScript runtimes"
type: "reference"
tags: ["hono", "typescript", "web-framework", "bun", "cloudflare-workers", "deno", "nodejs", "api", "rest"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Official Documentation"
    url: "https://hono.dev/docs"
  - name: "Hono GitHub"
    url: "https://github.com/honojs/hono"
  - name: "Hono LLMs Documentation"
    url: "https://hono.dev/llms.txt"
related:
  - "./api/hono-app.md"
  - "./api/context.md"
  - "./api/routing.md"
  - "./guides/bun-runtime.md"
  - "./guides/middleware.md"
author: "unknown"
contributors: []
---

# Hono Web Framework Reference

Hono (flame in Japanese) is a small, simple, and ultrafast web framework built on Web Standards. It works on any JavaScript runtime: Cloudflare Workers, Fastly Compute, Deno, Bun, Vercel, Netlify, AWS Lambda, Lambda@Edge, and Node.js.

## Key Features

- **Ultrafast**: One of the fastest routers available, using RegExpRouter
- **Lightweight**: Zero dependencies, small bundle size (~14KB minified)
- **Multi-runtime**: Works on Cloudflare Workers, Bun, Deno, Node.js, and more
- **Web Standards**: Built on Fetch API, Request/Response objects
- **TypeScript First**: Full TypeScript support with excellent type inference
- **Middleware**: Rich ecosystem of built-in and third-party middleware
- **RPC**: Type-safe client-server communication

## Quick Start with Bun

```bash
# Create new project
bun create hono@latest my-app

# Or add to existing project
bun add hono
```

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello Hono!'))
app.get('/json', (c) => c.json({ message: 'Hello!' }))

export default app
```

## Documentation Structure

### API Reference
- [Hono App](./api/hono-app.md) - Core application class and methods
- [Context](./api/context.md) - Request context and response helpers
- [Routing](./api/routing.md) - Path parameters, wildcards, grouping
- [Request](./api/request.md) - HonoRequest object and body parsing
- [Exception](./api/exception.md) - HTTPException handling

### Guides
- [Bun Runtime](./guides/bun-runtime.md) - Running Hono with Bun
- [Middleware](./guides/middleware.md) - Creating and using middleware
- [Testing](./guides/testing.md) - Testing Hono applications
- [Validation](./guides/validation.md) - Request validation with Zod
- [RPC](./guides/rpc.md) - Type-safe client-server communication
- [Best Practices](./guides/best-practices.md) - Application architecture

### Helpers
- [Streaming](./helpers/streaming.md) - SSE and streaming responses
- [Testing Helper](./helpers/testing.md) - testClient for typed tests
- [Factory](./helpers/factory.md) - Creating middleware and handlers
- [Cookie](./helpers/cookie.md) - Cookie management
- [WebSocket](./helpers/websocket.md) - WebSocket connections

### Middleware
- [CORS](./middleware/cors.md) - Cross-origin resource sharing
- [JWT](./middleware/jwt.md) - JWT authentication
- [Built-in Middleware](./middleware/builtin.md) - Logger, compress, cache, etc.

## Core Concepts

### The Hono Application

```typescript
import { Hono } from 'hono'

const app = new Hono()

// HTTP methods
app.get('/posts', (c) => c.json(posts))
app.post('/posts', (c) => c.json({ created: true }, 201))
app.put('/posts/:id', (c) => c.json({ updated: true }))
app.delete('/posts/:id', (c) => c.json({ deleted: true }))

// All methods
app.all('/api/*', (c) => c.text('API endpoint'))

export default app
```

### Context Object

The `Context` object (`c`) provides request data and response methods:

```typescript
app.get('/user/:id', (c) => {
  // Request data
  const id = c.req.param('id')
  const query = c.req.query('filter')
  const header = c.req.header('Authorization')

  // Response methods
  c.status(200)
  c.header('X-Custom', 'value')

  return c.json({ id, query })
})
```

### Middleware

```typescript
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'

const app = new Hono()

// Global middleware
app.use(logger())
app.use(cors())

// Route-specific middleware
app.use('/api/*', async (c, next) => {
  const start = Date.now()
  await next()
  console.log(`${c.req.method} ${c.req.url} - ${Date.now() - start}ms`)
})
```

### Validation with Zod

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  body: z.string(),
})

app.post('/posts', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ success: true, data })
})
```

### RPC (Type-safe Client)

```typescript
// server.ts
const app = new Hono()
  .get('/users', (c) => c.json([{ id: 1, name: 'John' }]))
  .post('/users', zValidator('json', userSchema), (c) => {
    return c.json({ created: true }, 201)
  })

export type AppType = typeof app

// client.ts
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:3000')
const res = await client.users.$get()
const users = await res.json() // Fully typed!
```

## Presets

| Preset | Use Case |
|--------|----------|
| `hono` | Default, best for long-running servers (Bun, Node.js, Deno) |
| `hono/quick` | Fast startup, for per-request initialization |
| `hono/tiny` | Smallest bundle, resource-constrained environments |

```typescript
// Default (recommended for Bun)
import { Hono } from 'hono'

// Quick startup
import { Hono } from 'hono/quick'

// Minimal size
import { Hono } from 'hono/tiny'
```

## Built-in Middleware

| Middleware | Import | Purpose |
|------------|--------|---------|
| Logger | `hono/logger` | Request logging |
| CORS | `hono/cors` | Cross-origin requests |
| JWT | `hono/jwt` | JWT authentication |
| Basic Auth | `hono/basic-auth` | Basic authentication |
| Bearer Auth | `hono/bearer-auth` | Bearer token auth |
| Compress | `hono/compress` | Response compression |
| Cache | `hono/cache` | Response caching |
| CSRF | `hono/csrf` | CSRF protection |
| Secure Headers | `hono/secure-headers` | Security headers |
| Timeout | `hono/timeout` | Request timeout |

## Version Information

See [hono-versions.md](./hono-versions.md) for version history and changelog.

---

**Source**: [hono.dev](https://hono.dev/docs) | **GitHub**: [honojs/hono](https://github.com/honojs/hono)
