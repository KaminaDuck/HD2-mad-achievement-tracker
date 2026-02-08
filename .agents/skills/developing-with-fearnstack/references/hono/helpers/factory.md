---
title: "Hono Factory Helper"
description: "Complete guide to creating type-safe middleware and handlers with Hono Factory"
type: "reference"
tags: ["hono", "factory", "middleware", "handlers", "typescript"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Factory Helper"
    url: "https://hono.dev/docs/helpers/factory"
related:
  - "../README.md"
  - "../guides/middleware.md"
  - "../guides/best-practices.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono Factory Helper

The Factory Helper provides functions for creating type-safe middleware and handlers in Hono applications.

## Import

```typescript
import { Hono } from 'hono'
import { createFactory, createMiddleware } from 'hono/factory'
```

## `createFactory()`

Creates a Factory instance for building Hono components with shared types:

```typescript
import { createFactory } from 'hono/factory'

const factory = createFactory()
```

### With Environment Types

Pass generics to share types across your app:

```typescript
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

const factory = createFactory<Env>()
```

### Options

#### `defaultAppOptions`

Pass default options to apps created with `createApp()`:

```typescript
const factory = createFactory({
  defaultAppOptions: {
    strict: false,
  },
})

const app = factory.createApp()  // strict: false applied
```

## `createMiddleware()`

Shortcut for `factory.createMiddleware()`. Creates type-safe custom middleware:

```typescript
import { createMiddleware } from 'hono/factory'

const logger = createMiddleware(async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`)
  await next()
})

app.use(logger)
```

### Middleware with Options

Create configurable middleware by wrapping in a function:

```typescript
const messageMiddleware = (message: string) => {
  return createMiddleware(async (c, next) => {
    await next()
    c.res.headers.set('X-Message', message)
  })
}

app.use(messageMiddleware('Hello World!'))
app.use('/api/*', messageMiddleware('API Response'))
```

### Typed Middleware with Generics

```typescript
import { createMiddleware } from 'hono/factory'

type AuthEnv = {
  Variables: {
    user: { id: string; role: string }
  }
}

const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = c.req.header('Authorization')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const user = await verifyToken(token)
  c.set('user', user)  // Type-safe!
  await next()
})
```

## `factory.createHandlers()`

Create typed handlers that can be defined separately from routes:

```typescript
import { createFactory } from 'hono/factory'
import { logger } from 'hono/logger'

const factory = createFactory()

// Create middleware
const middleware = factory.createMiddleware(async (c, next) => {
  c.set('foo', 'bar')
  await next()
})

// Create handlers array with middleware
const handlers = factory.createHandlers(
  logger(),
  middleware,
  (c) => {
    return c.json(c.var.foo)  // Type-safe!
  }
)

// Use with route
app.get('/api', ...handlers)
```

### Why Use `createHandlers()`?

Allows defining handlers separately while maintaining type safety:

```typescript
// handlers/users.ts
import { factory } from '../factory'

export const listUsers = factory.createHandlers(
  authMiddleware,
  async (c) => {
    const users = await getUsers()
    return c.json(users)
  }
)

export const createUser = factory.createHandlers(
  authMiddleware,
  validateBody,
  async (c) => {
    const data = c.req.valid('json')
    const user = await saveUser(data)
    return c.json(user, 201)
  }
)

// routes/users.ts
import { listUsers, createUser } from '../handlers/users'

app.get('/users', ...listUsers)
app.post('/users', ...createUser)
```

## `factory.createApp()`

Create a Hono instance with the factory's environment types:

```typescript
import { createFactory } from 'hono/factory'

type Env = {
  Bindings: { DATABASE_URL: string }
  Variables: { db: Database }
}

const factory = createFactory<Env>()

// Without factory - must specify Env twice
const app1 = new Hono<Env>()
const middleware1 = createMiddleware<Env>(async (c, next) => {
  // ...
})

// With factory - Env specified once
const app2 = factory.createApp()
const middleware2 = factory.createMiddleware(async (c, next) => {
  // Types inherited from factory!
})
```

### `initApp` Option

Initialize apps with common setup:

```typescript
import { createFactory } from 'hono/factory'
import { drizzle } from 'drizzle-orm/d1'

type Env = {
  Bindings: { DB: D1Database }
  Variables: { db: DrizzleD1Database }
}

const factory = createFactory<Env>({
  initApp: (app) => {
    // This runs for every app created with createApp()
    app.use(async (c, next) => {
      const db = drizzle(c.env.DB)
      c.set('db', db)
      await next()
    })
  },
})

// db middleware is automatically applied
const app = factory.createApp()

app.get('/users', (c) => {
  const db = c.var.db  // Typed and available!
  return c.json([])
})
```

## Complete Example

```typescript
// factory.ts
import { createFactory } from 'hono/factory'

type Bindings = {
  DATABASE_URL: string
  JWT_SECRET: string
}

type Variables = {
  user: { id: string; email: string; role: 'user' | 'admin' }
  requestId: string
}

type Env = {
  Bindings: Bindings
  Variables: Variables
}

export const factory = createFactory<Env>({
  initApp: (app) => {
    // Add request ID to all requests
    app.use(async (c, next) => {
      c.set('requestId', crypto.randomUUID())
      await next()
      c.header('X-Request-Id', c.get('requestId'))
    })
  },
})

// Reusable middleware
export const authMiddleware = factory.createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export const adminOnly = factory.createMiddleware(async (c, next) => {
  const user = c.get('user')
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }
  await next()
})
```

```typescript
// routes/users.ts
import { factory, authMiddleware, adminOnly } from '../factory'

const app = factory.createApp()

// Handlers with full type safety
const listUsersHandlers = factory.createHandlers(
  authMiddleware,
  async (c) => {
    const requestId = c.get('requestId')
    const currentUser = c.get('user')
    console.log(`[${requestId}] User ${currentUser.id} listing users`)
    return c.json([])
  }
)

const deleteUserHandlers = factory.createHandlers(
  authMiddleware,
  adminOnly,
  async (c) => {
    const id = c.req.param('id')
    return c.json({ deleted: id })
  }
)

app.get('/users', ...listUsersHandlers)
app.delete('/users/:id', ...deleteUserHandlers)

export default app
```

```typescript
// index.ts
import { factory } from './factory'
import users from './routes/users'

const app = factory.createApp()

app.route('/api', users)

export default app
```

## Summary

| Function | Purpose |
|----------|---------|
| `createFactory()` | Create factory with shared environment types |
| `createMiddleware()` | Create type-safe middleware |
| `factory.createHandlers()` | Create typed handler arrays |
| `factory.createApp()` | Create Hono app with factory types |
| `factory.createMiddleware()` | Same as `createMiddleware()` with factory types |

---

**Source**: [hono.dev/docs/helpers/factory](https://hono.dev/docs/helpers/factory)
