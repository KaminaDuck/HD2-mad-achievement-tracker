---
title: "Hono Best Practices"
description: "Best practices for building Hono applications - architecture, type safety, and scalable patterns"
type: "reference"
tags: ["hono", "best-practices", "architecture", "typescript", "patterns"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Best Practices"
    url: "https://hono.dev/docs/guides/best-practices"
related:
  - "../README.md"
  - "./rpc.md"
  - "./middleware.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono Best Practices

Hono is flexible - you can write your app however you like. However, following these best practices will help you build maintainable, type-safe applications.

## Avoid "Controllers"

### The Problem

Ruby on Rails-style controllers lose type inference for path parameters and request data:

```typescript
// ❌ Don't do this - loses type inference
const booksList = (c: Context) => {
  return c.json('list books')
}

const bookPermalink = (c: Context) => {
  const id = c.req.param('id')  // Can't infer path params
  return c.json(`get ${id}`)
}

app.get('/books', booksList)
app.get('/books/:id', bookPermalink)
```

### The Solution

Write handlers inline with route definitions:

```typescript
// ✅ Do this - full type inference
app.get('/books', (c) => {
  return c.json('list books')
})

app.get('/books/:id', (c) => {
  const id = c.req.param('id')  // Properly typed!
  return c.json(`get ${id}`)
})
```

## Using `createHandlers()` for Separation

If you need to define handlers separately (for testing or organization), use `factory.createHandlers()`:

```typescript
import { createFactory } from 'hono/factory'
import { logger } from 'hono/logger'

const factory = createFactory()

// Create typed middleware
const middleware = factory.createMiddleware(async (c, next) => {
  c.set('foo', 'bar')
  await next()
})

// Create typed handlers with middleware
const handlers = factory.createHandlers(logger(), middleware, (c) => {
  return c.json(c.var.foo)  // Type-safe!
})

app.get('/api', ...handlers)
```

## Building Larger Applications

Use `app.route()` to organize large applications into modules:

### File Structure

```
src/
├── index.ts
├── authors.ts
└── books.ts
```

### Route Modules

```typescript
// authors.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.json('list authors'))
app.post('/', (c) => c.json('create author', 201))
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
```

```typescript
// books.ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.json('list books'))
app.post('/', (c) => c.json('create book', 201))
app.get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
```

### Main Application

```typescript
// index.ts
import { Hono } from 'hono'
import authors from './authors'
import books from './books'

const app = new Hono()

app.route('/authors', authors)
app.route('/books', books)

export default app
```

## RPC-Compatible Structure

For RPC type inference to work, **chain methods** on your Hono instances:

```typescript
// authors.ts
import { Hono } from 'hono'

// ✅ Chain methods for RPC type inference
const app = new Hono()
  .get('/', (c) => c.json('list authors'))
  .post('/', (c) => c.json('create author', 201))
  .get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app
export type AppType = typeof app
```

```typescript
// index.ts
import { Hono } from 'hono'
import authors from './authors'
import books from './books'

const app = new Hono()

// Chain route() calls for correct type export
const routes = app.route('/authors', authors).route('/books', books)

export default app
export type AppType = typeof routes
```

### Using the Client

```typescript
import { hc } from 'hono/client'
import type { AppType } from './index'

const client = hc<AppType>('http://localhost')
// Fully typed client with autocomplete!
```

## Factory Pattern for Consistent Env Types

Use `createFactory()` to share environment types across your app:

```typescript
// factory.ts
import { createFactory } from 'hono/factory'

type Env = {
  Bindings: {
    DATABASE_URL: string
    API_KEY: string
  }
  Variables: {
    user: User
    db: Database
  }
}

export const factory = createFactory<Env>()
```

```typescript
// routes/users.ts
import { factory } from '../factory'

const app = factory.createApp()

// All middleware and handlers have typed c.env and c.var
app.get('/users', (c) => {
  const db = c.var.db  // Typed!
  const apiKey = c.env.API_KEY  // Typed!
  return c.json([])
})

export default app
```

## Initialize App with Middleware

Use `initApp` option for common setup:

```typescript
// factory.ts
import { createFactory } from 'hono/factory'
import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1'

type Env = {
  Bindings: { DB: D1Database }
  Variables: { db: DrizzleD1Database }
}

export const factory = createFactory<Env>({
  initApp: (app) => {
    app.use(async (c, next) => {
      const db = drizzle(c.env.DB)
      c.set('db', db)
      await next()
    })
  },
})
```

```typescript
// routes/posts.ts
import { factory } from '../factory'

const app = factory.createApp()
// db middleware is automatically applied

app.get('/posts', (c) => {
  const posts = c.var.db.select().from(postsTable)
  return c.json(posts)
})
```

## Error Handling Pattern

Centralize error handling:

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Global error handler
app.onError((err, c) => {
  console.error(`${err}`)

  if (err instanceof HTTPException) {
    return err.getResponse()
  }

  return c.json(
    {
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    },
    500
  )
})

// Global not found
app.notFound((c) => {
  return c.json({ error: 'Not Found', path: c.req.path }, 404)
})
```

## Middleware Organization

```typescript
// middleware/auth.ts
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

type AuthEnv = {
  Variables: {
    user: { id: string; role: string }
  }
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new HTTPException(401, { message: 'Token required' })
  }

  try {
    const user = await verifyToken(token)
    c.set('user', user)
    await next()
  } catch {
    throw new HTTPException(401, { message: 'Invalid token' })
  }
})

export const adminOnly = createMiddleware<AuthEnv>(async (c, next) => {
  const user = c.get('user')
  if (user.role !== 'admin') {
    throw new HTTPException(403, { message: 'Admin access required' })
  }
  await next()
})
```

## Complete Example Structure

```
src/
├── index.ts           # Main app, route mounting
├── factory.ts         # Factory with shared types
├── middleware/
│   ├── auth.ts
│   ├── logging.ts
│   └── validation.ts
├── routes/
│   ├── users.ts
│   ├── posts.ts
│   └── admin.ts
├── schemas/
│   ├── user.ts
│   └── post.ts
└── services/
    ├── user.service.ts
    └── post.service.ts
```

```typescript
// index.ts
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import users from './routes/users'
import posts from './routes/posts'
import admin from './routes/admin'

const app = new Hono()

// Global middleware
app.use(logger())
app.use(cors())

// Mount routes
const routes = app
  .route('/api/users', users)
  .route('/api/posts', posts)
  .route('/api/admin', admin)

// Error handling
app.notFound((c) => c.json({ error: 'Not Found' }, 404))
app.onError((err, c) => {
  console.error(err)
  return c.json({ error: 'Internal Error' }, 500)
})

export default app
export type AppType = typeof routes
```

## Summary

1. **Write handlers inline** with route definitions for type safety
2. **Use `createHandlers()`** if you need separate handler definitions
3. **Chain methods** on Hono instances for RPC type inference
4. **Use `app.route()`** to organize larger applications
5. **Use `createFactory()`** to share environment types
6. **Centralize error handling** with `onError` and `notFound`
7. **Organize middleware** in separate files

---

**Source**: [hono.dev/docs/guides/best-practices](https://hono.dev/docs/guides/best-practices)
