---
title: "Hono App API Reference"
description: "Complete API reference for the Hono application class - methods, routing, error handling, and configuration"
type: "reference"
tags: ["hono", "api", "typescript", "routing", "middleware", "error-handling"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono App Documentation"
    url: "https://hono.dev/docs/api/hono"
related:
  - "../README.md"
  - "./context.md"
  - "./routing.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono App API Reference

The `Hono` class is the primary object for creating web applications. It provides routing, middleware support, error handling, and more.

## Basic Usage

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello!'))

export default app
```

## Constructor Options

### `strict` Mode

Strict mode (default: `true`) distinguishes between paths with and without trailing slashes:

```typescript
// Default: strict mode
const app = new Hono() // or new Hono({ strict: true })
app.get('/hello')  // matches /hello only, NOT /hello/

// Non-strict mode
const app = new Hono({ strict: false })
app.get('/hello')  // matches both /hello and /hello/
```

### `router` Option

Specify which router to use:

```typescript
import { RegExpRouter } from 'hono/router/reg-exp-router'

const app = new Hono({ router: new RegExpRouter() })
```

### Generics for Type Safety

Pass generics to specify Bindings (env vars) and Variables (context state):

```typescript
type Bindings = {
  DATABASE_URL: string
  API_KEY: string
}

type Variables = {
  user: User
  requestId: string
}

const app = new Hono<{
  Bindings: Bindings
  Variables: Variables
}>()

app.use('/auth/*', async (c, next) => {
  const apiKey = c.env.API_KEY  // typed as string
  c.set('user', user)          // user must be User type
  await next()
})
```

## HTTP Methods

### Standard Methods

```typescript
app.get(path, ...handlers)
app.post(path, ...handlers)
app.put(path, ...handlers)
app.delete(path, ...handlers)
app.patch(path, ...handlers)
app.options(path, ...handlers)
app.head(path, ...handlers)
```

### `app.all()`

Match any HTTP method:

```typescript
app.all('/api/*', (c) => c.text('Any method'))
```

### `app.on()`

Match custom methods or multiple methods:

```typescript
// Custom method
app.on('PURGE', '/cache', (c) => c.text('Cache purged'))

// Multiple methods
app.on(['PUT', 'DELETE'], '/posts/:id', (c) => c.text('Update or delete'))

// Multiple paths
app.on('GET', ['/hello', '/hi', '/hey'], (c) => c.text('Greeting!'))
```

## Middleware

### `app.use()`

Register middleware for routes:

```typescript
// All routes
app.use(logger())

// Specific path
app.use('/api/*', cors())

// Multiple middleware
app.use('/auth/*', jwt({ secret: 'secret' }), async (c, next) => {
  console.log('After JWT')
  await next()
})
```

## Routing

### `app.route()`

Mount a sub-application:

```typescript
// books.ts
const books = new Hono()
books.get('/', (c) => c.json({ books: [] }))
books.get('/:id', (c) => c.json({ id: c.req.param('id') }))
books.post('/', (c) => c.json({ created: true }, 201))

// index.ts
const app = new Hono()
app.route('/books', books)  // /books, /books/:id, POST /books
```

### `app.basePath()`

Set a base path for the application:

```typescript
const api = new Hono().basePath('/api')
api.get('/users', (c) => c.json([]))  // GET /api/users
```

### Grouping Without Changing Base

```typescript
const books = new Hono()
books.get('/books', (c) => c.text('List books'))

const users = new Hono().basePath('/users')
users.get('/', (c) => c.text('List users'))

const app = new Hono()
app.route('/', books)  // /books
app.route('/', users)  // /users
```

## Error Handling

### `app.notFound()`

Customize Not Found response:

```typescript
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404)
})
```

> **Note**: `notFound` is only called from the top-level app, not from sub-routers.

### `app.onError()`

Handle uncaught errors:

```typescript
app.onError((err, c) => {
  console.error(`${err}`)

  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  return c.json({ error: 'Internal Server Error' }, 500)
})
```

> **Note**: Route-level `onError` handlers take priority over app-level handlers.

## Application Methods

### `app.fetch()`

The entry point for handling requests. Used by runtimes:

```typescript
// Cloudflare Workers
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx)
  },
}

// Or simply
export default app

// Bun
export default {
  port: 3000,
  fetch: app.fetch,
}
```

### `app.request()`

Make test requests to your application:

```typescript
// Simple GET
const res = await app.request('/hello')
expect(res.status).toBe(200)

// With options
const res = await app.request('/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Hello' }),
  headers: { 'Content-Type': 'application/json' },
})

// With Request object
const req = new Request('http://localhost/posts', { method: 'POST' })
const res = await app.request(req)

// With environment (3rd parameter)
const res = await app.request('/api', {}, { API_KEY: 'test' })
```

### `app.mount()`

Mount applications built with other frameworks:

```typescript
import { Router as IttyRouter } from 'itty-router'

const ittyRouter = IttyRouter()
ittyRouter.get('/hello', () => new Response('Hello from itty-router'))

const app = new Hono()
app.mount('/itty-router', ittyRouter.handle)
```

### `app.fire()` (Deprecated)

> **Deprecated**: Use `fire()` from `hono/service-worker` instead.

For Service Worker API environments:

```typescript
import { fire } from 'hono/service-worker'

// Instead of app.fire()
fire(app)
```

## Complete Example

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { HTTPException } from 'hono/http-exception'

type Bindings = {
  DATABASE_URL: string
}

type Variables = {
  user: { id: string; name: string }
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Global middleware
app.use(logger())
app.use(cors())

// Routes
app.get('/', (c) => c.text('Welcome!'))

app.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id })
})

app.post('/users', async (c) => {
  const body = await c.req.json()
  return c.json({ created: true, ...body }, 201)
})

// Error handling
app.notFound((c) => c.json({ error: 'Not Found' }, 404))

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse()
  }
  console.error(err)
  return c.json({ error: 'Internal Server Error' }, 500)
})

export default app
```

---

**Source**: [hono.dev/docs/api/hono](https://hono.dev/docs/api/hono)
