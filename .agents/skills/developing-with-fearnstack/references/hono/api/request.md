---
title: "HonoRequest API Reference"
description: "Complete API reference for HonoRequest - parameter parsing, body handling, and request data access"
type: "reference"
tags: ["hono", "request", "api", "body-parsing", "typescript"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Request Documentation"
    url: "https://hono.dev/docs/api/request"
related:
  - "../README.md"
  - "./context.md"
  - "../guides/validation.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# HonoRequest API Reference

`HonoRequest` wraps the native `Request` object and provides convenient methods for accessing request data. Access it via `c.req`.

## Path Parameters

### `c.req.param()`

Get path parameter values:

```typescript
// Single parameter
app.get('/user/:id', (c) => {
  const id = c.req.param('id')  // string
  return c.json({ id })
})

// All parameters at once
app.get('/posts/:postId/comments/:commentId', (c) => {
  const { postId, commentId } = c.req.param()
  return c.json({ postId, commentId })
})
```

## Query Parameters

### `c.req.query()`

Get query string parameters:

```typescript
// Single query param
// GET /search?q=hono
app.get('/search', (c) => {
  const q = c.req.query('q')  // string | undefined
  return c.json({ query: q })
})

// All query params
// GET /search?q=hono&limit=10&offset=0
app.get('/search', (c) => {
  const { q, limit, offset } = c.req.query()
  return c.json({ q, limit, offset })
})
```

### `c.req.queries()`

Get multiple values for the same parameter:

```typescript
// GET /search?tags=A&tags=B&tags=C
app.get('/search', (c) => {
  const tags = c.req.queries('tags')  // string[]
  return c.json({ tags })  // ["A", "B", "C"]
})
```

## Headers

### `c.req.header()`

Get request header values:

```typescript
app.get('/', (c) => {
  const userAgent = c.req.header('User-Agent')
  const contentType = c.req.header('Content-Type')
  return c.json({ userAgent, contentType })
})
```

> **Warning**: When calling `c.req.header()` without arguments, all keys are **lowercase**:
>
> ```typescript
> // ❌ Will not work
> const headers = c.req.header()
> const foo = headers['X-Foo']  // undefined
>
> // ✅ Will work
> const foo = c.req.header('X-Foo')  // correct value
> ```

## Body Parsing

### `c.req.json()`

Parse JSON body (`application/json`):

```typescript
app.post('/api/users', async (c) => {
  const body = await c.req.json()
  return c.json({ received: body })
})

// With type
interface CreateUser {
  name: string
  email: string
}

app.post('/api/users', async (c) => {
  const body = await c.req.json<CreateUser>()
  return c.json({ name: body.name })
})
```

### `c.req.text()`

Parse plain text body (`text/plain`):

```typescript
app.post('/webhook', async (c) => {
  const body = await c.req.text()
  return c.text(`Received: ${body}`)
})
```

### `c.req.parseBody()`

Parse form data (`multipart/form-data` or `application/x-www-form-urlencoded`):

```typescript
app.post('/form', async (c) => {
  const body = await c.req.parseBody()
  const name = body['name']  // string | File
  return c.json({ name })
})
```

#### Single File Upload

```typescript
app.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']  // string | File
  if (file instanceof File) {
    // Handle file upload
  }
  return c.json({ success: true })
})
```

#### Multiple Files

Use `[]` suffix for multiple files:

```typescript
app.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const files = body['files[]']  // Always (string | File)[]
  return c.json({ count: files.length })
})
```

#### Multiple Files with Same Name

Use `{ all: true }` option:

```typescript
// For <input type="file" name="photos" multiple />
app.post('/photos', async (c) => {
  const body = await c.req.parseBody({ all: true })
  const photos = body['photos']  // (string | File)[] if multiple, or string | File
  return c.json({ success: true })
})
```

#### Dot Notation

Structure form data using dots:

```typescript
// Form data: obj.key1=value1, obj.key2=value2
app.post('/form', async (c) => {
  const body = await c.req.parseBody({ dot: true })
  // body = { obj: { key1: 'value1', key2: 'value2' } }
  return c.json(body)
})
```

### `c.req.formData()`

Get raw FormData object:

```typescript
app.post('/form', async (c) => {
  const formData = await c.req.formData()
  const name = formData.get('name')
  return c.json({ name })
})
```

### `c.req.arrayBuffer()`

Parse body as ArrayBuffer:

```typescript
app.post('/binary', async (c) => {
  const buffer = await c.req.arrayBuffer()
  return c.json({ size: buffer.byteLength })
})
```

### `c.req.blob()`

Parse body as Blob:

```typescript
app.post('/blob', async (c) => {
  const blob = await c.req.blob()
  return c.json({ type: blob.type, size: blob.size })
})
```

## Validated Data

### `c.req.valid()`

Get data validated by middleware:

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({
  title: z.string(),
  body: z.string(),
})

app.post('/posts', zValidator('json', schema), (c) => {
  const { title, body } = c.req.valid('json')
  return c.json({ title, body })
})
```

Available targets:
- `form` - Form data
- `json` - JSON body
- `query` - Query parameters
- `header` - Request headers
- `cookie` - Cookies
- `param` - Path parameters

## Request Properties

### `c.req.path`

Get the request pathname:

```typescript
app.get('/about/me', (c) => {
  const path = c.req.path  // "/about/me"
  return c.text(path)
})
```

### `c.req.url`

Get the full request URL:

```typescript
app.get('/about/me', (c) => {
  const url = c.req.url  // "http://localhost:8787/about/me"
  return c.text(url)
})
```

### `c.req.method`

Get the HTTP method:

```typescript
app.all('/endpoint', (c) => {
  const method = c.req.method  // "GET", "POST", etc.
  return c.text(`Method: ${method}`)
})
```

### `c.req.raw`

Access the native Request object:

```typescript
// Cloudflare Workers specific
app.post('/cf', async (c) => {
  const cf = c.req.raw.cf
  const country = cf?.country
  return c.json({ country })
})
```

### `c.req.routePath` (Deprecated)

> **Deprecated in v4.8.0**: Use `routePath()` from Route Helper instead.

```typescript
app.get('/posts/:id', (c) => {
  const route = c.req.routePath  // "/posts/:id"
  return c.json({ route })
})
```

### `c.req.matchedRoutes` (Deprecated)

> **Deprecated in v4.8.0**: Use `matchedRoutes()` from Route Helper instead.

## Utility Methods

### `cloneRawRequest()`

Clone the request even after body consumption:

```typescript
import { cloneRawRequest } from 'hono/request'
import { validator } from 'hono/validator'

app.post(
  '/forward',
  validator('json', (data) => data),
  async (c) => {
    // Clone after validation consumed the body
    const clonedReq = await cloneRawRequest(c.req)
    // Can read body again
    const body = await clonedReq.json()
    return c.json(body)
  }
)
```

## Complete Example

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// Query parameters
app.get('/search', (c) => {
  const q = c.req.query('q') || ''
  const page = parseInt(c.req.query('page') || '1')
  const tags = c.req.queries('tags') || []
  return c.json({ q, page, tags })
})

// Path parameters
app.get('/users/:id/posts/:postId', (c) => {
  const { id, postId } = c.req.param()
  return c.json({ userId: id, postId })
})

// JSON body with validation
const createPostSchema = z.object({
  title: z.string().min(1),
  body: z.string(),
  tags: z.array(z.string()).optional(),
})

app.post('/posts', zValidator('json', createPostSchema), (c) => {
  const data = c.req.valid('json')
  return c.json({ created: true, ...data }, 201)
})

// File upload
app.post('/upload', async (c) => {
  const body = await c.req.parseBody()
  const file = body['file']

  if (!(file instanceof File)) {
    return c.json({ error: 'No file uploaded' }, 400)
  }

  return c.json({
    name: file.name,
    size: file.size,
    type: file.type,
  })
})

// Headers
app.get('/info', (c) => {
  return c.json({
    userAgent: c.req.header('User-Agent'),
    accept: c.req.header('Accept'),
    method: c.req.method,
    path: c.req.path,
    url: c.req.url,
  })
})

export default app
```

---

**Source**: [hono.dev/docs/api/request](https://hono.dev/docs/api/request)
