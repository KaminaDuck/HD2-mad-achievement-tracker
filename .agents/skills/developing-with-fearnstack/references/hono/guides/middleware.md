---
title: "Hono Middleware Guide"
description: "Complete guide to creating and using middleware in Hono - built-in, custom, and third-party middleware"
type: "reference"
tags: ["hono", "middleware", "typescript", "authentication", "cors", "logging"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Middleware Guide"
    url: "https://hono.dev/docs/guides/middleware"
related:
  - "../README.md"
  - "../api/hono-app.md"
  - "./best-practices.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono Middleware Guide

Middleware in Hono works before and after route handlers. It can modify requests, responses, and pass data between handlers.

## Middleware vs Handler

- **Handler**: Returns a `Response` object. Only one handler is called per request.
- **Middleware**: Calls `await next()` to continue the chain, or returns a `Response` to short-circuit.

## Registering Middleware

### `app.use()`

```typescript
// All routes
app.use(logger())

// Specific path pattern
app.use('/api/*', cors())

// Specific method and path
app.post('/api/*', basicAuth({ username: 'admin', password: 'secret' }))
```

### Inline Middleware

```typescript
app.get('/hello',
  async (c, next) => {
    console.log('Before handler')
    await next()
    console.log('After handler')
  },
  (c) => c.text('Hello!')
)
```

## Execution Order

Middleware executes in registration order. Code before `next()` runs top-down, code after `next()` runs bottom-up:

```typescript
app.use(async (_, next) => {
  console.log('1. Start')
  await next()
  console.log('6. End')
})

app.use(async (_, next) => {
  console.log('2. Before')
  await next()
  console.log('5. After')
})

app.use(async (_, next) => {
  console.log('3. Inner before')
  await next()
  console.log('4. Inner after')
})

app.get('/', (c) => {
  console.log('Handler')
  return c.text('Hello!')
})

// Output:
// 1. Start
// 2. Before
// 3. Inner before
// Handler
// 4. Inner after
// 5. After
// 6. End
```

> **Note**: `next()` never throws. Errors are caught by Hono and passed to `app.onError()`.

## Built-in Middleware

Import middleware from their respective paths:

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { basicAuth } from 'hono/basic-auth'
import { jwt } from 'hono/jwt'
import { compress } from 'hono/compress'
import { cache } from 'hono/cache'
import { secureHeaders } from 'hono/secure-headers'
import { csrf } from 'hono/csrf'
import { timeout } from 'hono/timeout'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { timing } from 'hono/timing'
import { etag } from 'hono/etag'

const app = new Hono()

app.use(logger())
app.use(cors())
app.use(compress())
app.use(secureHeaders())
```

> **Warning** (Deno): Use the same Hono version for all imports to avoid bugs:
> ```typescript
> // ❌ Version mismatch causes issues
> import { Hono } from 'jsr:@hono/hono@4.4.0'
> import { upgradeWebSocket } from 'jsr:@hono/hono@4.4.5/deno'
> ```

## Custom Middleware

### Inline Custom Middleware

```typescript
// Logging middleware
app.use(async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`)
  await next()
})

// Add response header
app.use('/api/*', async (c, next) => {
  await next()
  c.header('X-Response-Time', `${Date.now() - start}ms`)
})
```

### Using `createMiddleware()`

For better type inference and reusability:

```typescript
import { createMiddleware } from 'hono/factory'

const logger = createMiddleware(async (c, next) => {
  console.log(`[${c.req.method}] ${c.req.url}`)
  await next()
})

app.use(logger)
```

### Middleware with Options

```typescript
import { createMiddleware } from 'hono/factory'

const messageMiddleware = (message: string) => {
  return createMiddleware(async (c, next) => {
    await next()
    c.res.headers.set('X-Message', message)
  })
}

app.use(messageMiddleware('Hello from middleware!'))
```

### Middleware with Type Generics

```typescript
import { createMiddleware } from 'hono/factory'

type Env = {
  Bindings: { API_KEY: string }
}

const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const key = c.env.API_KEY  // Typed correctly
  // ...
  await next()
})
```

## Extending Context

### Set Variables in Middleware

```typescript
import { createMiddleware } from 'hono/factory'

const echoMiddleware = createMiddleware<{
  Variables: {
    echo: (str: string) => string
  }
}>(async (c, next) => {
  c.set('echo', (str) => str.toUpperCase())
  await next()
})

app.get('/echo', echoMiddleware, (c) => {
  return c.text(c.var.echo('hello'))  // "HELLO"
})
```

### Global Variable Types

```typescript
// For app-wide middleware
const app = new Hono<{
  Variables: {
    echo: (str: string) => string
  }
}>()

app.use(echoMiddleware)

app.get('/echo', (c) => {
  return c.text(c.var.echo('hello'))
})
```

## Modify Response After Handler

```typescript
import { createMiddleware } from 'hono/factory'

const stripResponse = createMiddleware(async (c, next) => {
  await next()
  // Replace the response entirely
  c.res = new Response('Modified response')
})
```

## Context Access in Middleware Arguments

Access context inside middleware configuration:

```typescript
import { cors } from 'hono/cors'

app.use('*', async (c, next) => {
  const middleware = cors({
    origin: c.env.CORS_ORIGIN,  // Use env variable
  })
  return middleware(c, next)
})
```

## Common Middleware Patterns

### Request Timing

```typescript
const timingMiddleware = createMiddleware(async (c, next) => {
  const start = Date.now()
  await next()
  const duration = Date.now() - start
  c.header('X-Response-Time', `${duration}ms`)
  console.log(`${c.req.method} ${c.req.path} - ${duration}ms`)
})
```

### Authentication

```typescript
const authMiddleware = createMiddleware(async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    return c.json({ error: 'No token provided' }, 401)
  }

  try {
    const payload = await verifyToken(token)
    c.set('user', payload)
    await next()
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

app.use('/api/*', authMiddleware)
```

### Rate Limiting

```typescript
const rateLimit = (limit: number, window: number) => {
  const requests = new Map<string, { count: number; reset: number }>()

  return createMiddleware(async (c, next) => {
    const ip = c.req.header('CF-Connecting-IP') || 'unknown'
    const now = Date.now()
    const record = requests.get(ip)

    if (!record || now > record.reset) {
      requests.set(ip, { count: 1, reset: now + window })
    } else if (record.count >= limit) {
      return c.json({ error: 'Rate limit exceeded' }, 429)
    } else {
      record.count++
    }

    await next()
  })
}

app.use('/api/*', rateLimit(100, 60000))  // 100 requests per minute
```

### Request Validation

```typescript
const validateJson = <T>(schema: z.ZodType<T>) => {
  return createMiddleware(async (c, next) => {
    try {
      const body = await c.req.json()
      const validated = schema.parse(body)
      c.set('validatedBody', validated)
      await next()
    } catch (err) {
      return c.json({ error: 'Invalid request body' }, 400)
    }
  })
}
```

## Third-Party Middleware

Hono has a rich ecosystem of third-party middleware:

- GraphQL Server
- Sentry
- Firebase Auth
- OpenAPI/Swagger
- Prometheus metrics
- And many more at [hono.dev/docs/middleware/third-party](https://hono.dev/docs/middleware/third-party)

## Complete Example

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'
import { createMiddleware } from 'hono/factory'

type Variables = {
  user: { id: string; role: string }
  requestId: string
}

const app = new Hono<{ Variables: Variables }>()

// Global middleware
app.use(logger())
app.use(cors())
app.use(compress())
app.use(secureHeaders())

// Request ID
app.use(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
  c.header('X-Request-Id', c.get('requestId'))
})

// JWT auth for API routes
app.use('/api/*', jwt({ secret: process.env.JWT_SECRET! }))

// Set user from JWT payload
app.use('/api/*', async (c, next) => {
  const payload = c.get('jwtPayload')
  c.set('user', { id: payload.sub, role: payload.role })
  await next()
})

// Admin only middleware
const adminOnly = createMiddleware<{ Variables: Variables }>(async (c, next) => {
  const user = c.get('user')
  if (user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }
  await next()
})

// Routes
app.get('/api/profile', (c) => {
  return c.json({ user: c.get('user') })
})

app.get('/api/admin/users', adminOnly, (c) => {
  return c.json({ users: [] })
})

export default app
```

---

**Source**: [hono.dev/docs/guides/middleware](https://hono.dev/docs/guides/middleware)
