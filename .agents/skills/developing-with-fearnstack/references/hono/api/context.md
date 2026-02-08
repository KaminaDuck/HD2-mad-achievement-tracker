---
title: "Hono Context API Reference"
description: "Complete API reference for Hono Context object - request data, response methods, and state management"
type: "reference"
tags: ["hono", "context", "api", "request", "response", "typescript"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Context Documentation"
    url: "https://hono.dev/docs/api/context"
related:
  - "../README.md"
  - "./hono-app.md"
  - "./request.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono Context API Reference

The `Context` object is instantiated for each request and provides access to request data, response methods, and application state.

## Request Access

### `c.req`

Access the HonoRequest object:

```typescript
app.get('/hello', (c) => {
  const userAgent = c.req.header('User-Agent')
  const path = c.req.path
  const method = c.req.method
  return c.text(`${method} ${path}`)
})
```

See [HonoRequest API](./request.md) for full request methods.

## Response Methods

### `c.text()`

Return plain text response (`Content-Type: text/plain`):

```typescript
app.get('/hello', (c) => {
  return c.text('Hello World!')
})

// With status code
app.get('/error', (c) => {
  return c.text('Not Found', 404)
})
```

### `c.json()`

Return JSON response (`Content-Type: application/json`):

```typescript
app.get('/api/users', (c) => {
  return c.json({ users: [] })
})

// With status code
app.post('/api/users', (c) => {
  return c.json({ created: true }, 201)
})

// With headers
app.get('/api/data', (c) => {
  return c.json(
    { data: 'value' },
    200,
    { 'X-Custom-Header': 'value' }
  )
})
```

### `c.html()`

Return HTML response (`Content-Type: text/html`):

```typescript
app.get('/', (c) => {
  return c.html('<h1>Hello Hono!</h1>')
})

// With JSX
app.get('/page', (c) => {
  return c.html(
    <html>
      <body>
        <h1>Hello!</h1>
      </body>
    </html>
  )
})
```

### `c.body()`

Return raw body response:

```typescript
app.get('/raw', (c) => {
  return c.body('Raw content')
})

// With full options
app.get('/custom', (c) => {
  return c.body('Thank you', 201, {
    'X-Message': 'Hello!',
    'Content-Type': 'text/plain',
  })
})
```

### `c.redirect()`

Redirect to another URL:

```typescript
app.get('/old', (c) => {
  return c.redirect('/')  // 302 by default
})

app.get('/moved', (c) => {
  return c.redirect('/new-location', 301)  // Permanent redirect
})
```

### `c.notFound()`

Return Not Found response (customizable via `app.notFound()`):

```typescript
app.get('/user/:id', async (c) => {
  const user = await findUser(c.req.param('id'))
  if (!user) {
    return c.notFound()
  }
  return c.json(user)
})
```

## Response Modification

### `c.status()`

Set HTTP status code (default: 200):

```typescript
app.post('/posts', (c) => {
  c.status(201)
  return c.json({ message: 'Created!' })
})
```

### `c.header()`

Set response headers:

```typescript
app.get('/', (c) => {
  c.header('X-Custom', 'value')
  c.header('Cache-Control', 'no-store')
  return c.text('Hello!')
})
```

### `c.res`

Access or modify the Response object:

```typescript
app.use('/', async (c, next) => {
  await next()
  c.res.headers.append('X-Response-Time', '100ms')
})
```

## State Management

### `c.set()` / `c.get()`

Store and retrieve values within a request lifecycle:

```typescript
// In middleware
app.use(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  c.set('startTime', Date.now())
  await next()
})

// In handler
app.get('/', (c) => {
  const requestId = c.get('requestId')
  const startTime = c.get('startTime')
  return c.json({ requestId, duration: Date.now() - startTime })
})
```

Type-safe variables with generics:

```typescript
type Variables = {
  user: { id: string; name: string }
  requestId: string
}

const app = new Hono<{ Variables: Variables }>()

app.use(async (c, next) => {
  c.set('user', { id: '1', name: 'John' })  // Type checked
  await next()
})

app.get('/', (c) => {
  const user = c.get('user')  // Typed as { id: string; name: string }
  return c.json(user)
})
```

### `c.var`

Alternative access to variables:

```typescript
app.get('/', (c) => {
  const result = c.var.user.name  // Same as c.get('user').name
  return c.text(result)
})
```

Custom middleware with typed variables:

```typescript
import { createMiddleware } from 'hono/factory'

type Env = {
  Variables: {
    echo: (str: string) => string
  }
}

const echoMiddleware = createMiddleware<Env>(async (c, next) => {
  c.set('echo', (str) => str)
  await next()
})

app.get('/echo', echoMiddleware, (c) => {
  return c.text(c.var.echo('Hello!'))
})
```

## Rendering

### `c.render()` / `c.setRenderer()`

Set up layouts and render content:

```typescript
// Set renderer in middleware
app.use(async (c, next) => {
  c.setRenderer((content) => {
    return c.html(
      <html>
        <body>
          <header>My Site</header>
          <main>{content}</main>
          <footer>Footer</footer>
        </body>
      </html>
    )
  })
  await next()
})

// Use in handler
app.get('/', (c) => {
  return c.render(<h1>Welcome!</h1>)
})
```

With custom arguments (type-safe):

```typescript
declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      head: { title: string }
    ): Response | Promise<Response>
  }
}

app.use(async (c, next) => {
  c.setRenderer((content, head) => {
    return c.html(
      <html>
        <head>
          <title>{head.title}</title>
        </head>
        <body>{content}</body>
      </html>
    )
  })
  await next()
})

app.get('/about', (c) => {
  return c.render(<p>About us</p>, { title: 'About' })
})
```

## Environment Access

### `c.env`

Access environment variables/bindings (Cloudflare Workers, etc.):

```typescript
type Bindings = {
  MY_KV: KVNamespace
  DATABASE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', async (c) => {
  const value = await c.env.MY_KV.get('key')
  const dbUrl = c.env.DATABASE_URL
  return c.json({ value, hasDb: !!dbUrl })
})
```

### `c.executionCtx`

Access Cloudflare Workers ExecutionContext:

```typescript
app.get('/async', async (c) => {
  // Run task after response is sent
  c.executionCtx.waitUntil(
    c.env.ANALYTICS.writeDataPoint({ event: 'page_view' })
  )
  return c.text('Response sent!')
})
```

### `c.event` (Deprecated)

Access FetchEvent (Service Worker syntax - not recommended):

```typescript
app.get('/legacy', async (c) => {
  c.event.waitUntil(doSomethingAsync())
  return c.text('OK')
})
```

## Error Access

### `c.error`

Access error in middleware (after handler throws):

```typescript
app.use(async (c, next) => {
  await next()
  if (c.error) {
    console.error('Handler threw:', c.error)
    // Custom error logging
  }
})
```

## Type Extensions

### `ContextVariableMap`

Extend context variables globally for middleware:

```typescript
declare module 'hono' {
  interface ContextVariableMap {
    logger: Logger
    db: Database
  }
}

const loggerMiddleware = createMiddleware(async (c, next) => {
  c.set('logger', new Logger())  // Type safe
  await next()
})

app.get('/', (c) => {
  const logger = c.get('logger')  // Typed as Logger
  logger.info('Request received')
  return c.text('OK')
})
```

## Complete Example

```typescript
import { Hono } from 'hono'
import { createMiddleware } from 'hono/factory'

type Bindings = {
  API_KEY: string
}

type Variables = {
  user: { id: string; name: string } | null
  requestId: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Request ID middleware
app.use(async (c, next) => {
  c.set('requestId', crypto.randomUUID())
  await next()
  c.header('X-Request-Id', c.get('requestId'))
})

// Auth middleware
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization')
  if (token === c.env.API_KEY) {
    c.set('user', { id: '1', name: 'Admin' })
  } else {
    c.set('user', null)
  }
  await next()
})

// Protected route
app.get('/api/profile', (c) => {
  const user = c.get('user')
  if (!user) {
    c.status(401)
    return c.json({ error: 'Unauthorized' })
  }
  return c.json({ user, requestId: c.var.requestId })
})

// Public route
app.get('/', (c) => {
  return c.html('<h1>Welcome!</h1>')
})

export default app
```

---

**Source**: [hono.dev/docs/api/context](https://hono.dev/docs/api/context)
