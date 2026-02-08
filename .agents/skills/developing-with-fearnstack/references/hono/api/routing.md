---
title: "Hono Routing API Reference"
description: "Complete guide to Hono routing - path parameters, wildcards, grouping, and route priority"
type: "reference"
tags: ["hono", "routing", "api", "path-parameters", "typescript"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Routing Documentation"
    url: "https://hono.dev/docs/api/routing"
related:
  - "../README.md"
  - "./hono-app.md"
  - "./context.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono Routing API Reference

Hono's routing is flexible and intuitive, supporting path parameters, wildcards, regular expressions, and route grouping.

## Basic Routing

### HTTP Methods

```typescript
app.get('/', (c) => c.text('GET /'))
app.post('/', (c) => c.text('POST /'))
app.put('/', (c) => c.text('PUT /'))
app.delete('/', (c) => c.text('DELETE /'))
app.patch('/', (c) => c.text('PATCH /'))
app.options('/', (c) => c.text('OPTIONS /'))
app.head('/', (c) => c.text('HEAD /'))
```

### Wildcard Routes

```typescript
app.get('/wild/*/card', (c) => {
  return c.text('Matches /wild/anything/card')
})

app.get('/files/*', (c) => {
  return c.text('Matches /files/any/path/here')
})
```

### Any HTTP Method

```typescript
app.all('/hello', (c) => c.text('Any method: GET, POST, PUT, etc.'))
```

### Custom Methods

```typescript
// Single custom method
app.on('PURGE', '/cache', (c) => c.text('Cache purged'))

// Multiple methods
app.on(['PUT', 'DELETE'], '/posts/:id', (c) =>
  c.text('Update or delete post')
)

// Multiple paths
app.on('GET', ['/hello', '/hi', '/hey'], (c) => c.text('Greeting!'))
```

## Path Parameters

### Basic Parameters

```typescript
app.get('/user/:name', (c) => {
  const name = c.req.param('name')
  return c.text(`Hello, ${name}!`)
})

// Multiple parameters
app.get('/posts/:id/comments/:commentId', (c) => {
  const { id, commentId } = c.req.param()
  return c.json({ postId: id, commentId })
})
```

### Optional Parameters

```typescript
// Matches /api/animal and /api/animal/:type
app.get('/api/animal/:type?', (c) => {
  const type = c.req.param('type') || 'all'
  return c.text(`Animal type: ${type}`)
})
```

### Regular Expression Constraints

```typescript
// Only numeric IDs
app.get('/post/:id{[0-9]+}', (c) => {
  const id = c.req.param('id')
  return c.json({ id: parseInt(id) })
})

// Multiple constraints
app.get('/post/:date{[0-9]+}/:title{[a-z]+}', (c) => {
  const { date, title } = c.req.param()
  return c.json({ date, title })
})
```

### Including Slashes

```typescript
// Match paths with slashes using regex
app.get('/posts/:filename{.+\\.png}', (c) => {
  const filename = c.req.param('filename')
  // filename can be "path/to/image.png"
  return c.text(`File: ${filename}`)
})
```

## Chained Routes

Define multiple methods for the same path:

```typescript
app
  .get('/endpoint', (c) => c.text('GET /endpoint'))
  .post((c) => c.text('POST /endpoint'))
  .delete((c) => c.text('DELETE /endpoint'))
```

## Route Grouping

### Basic Grouping with `app.route()`

```typescript
// books.ts
const books = new Hono()

books.get('/', (c) => c.text('List Books'))        // GET /books
books.get('/:id', (c) => {
  const id = c.req.param('id')
  return c.text(`Get Book: ${id}`)                  // GET /books/:id
})
books.post('/', (c) => c.text('Create Book'))      // POST /books

// index.ts
const app = new Hono()
app.route('/books', books)

export default app
```

### Grouping Without Changing Base

```typescript
const books = new Hono()
books.get('/books', (c) => c.text('List Books'))
books.post('/books', (c) => c.text('Create Book'))

const users = new Hono().basePath('/users')
users.get('/', (c) => c.text('List Users'))
users.post('/', (c) => c.text('Create User'))

const app = new Hono()
app.route('/', books)  // /books
app.route('/', users)  // /users
```

### Base Path

```typescript
const api = new Hono().basePath('/api/v1')
api.get('/users', (c) => c.text('List users'))     // GET /api/v1/users
api.get('/posts', (c) => c.text('List posts'))     // GET /api/v1/posts
```

## Advanced Routing

### Routing with Hostname

```typescript
const app = new Hono({
  getPath: (req) => req.url.replace(/^https?:\/([^?]+).*$/, '$1'),
})

app.get('/www1.example.com/hello', (c) => c.text('Hello www1'))
app.get('/www2.example.com/hello', (c) => c.text('Hello www2'))
```

### Routing with Host Header

```typescript
const app = new Hono({
  getPath: (req) =>
    '/' +
    req.headers.get('host') +
    req.url.replace(/^https?:\/\/[^/]+(\/[^?]*).*/, '$1'),
})

app.get('/www1.example.com/hello', (c) => c.text('Hello www1'))

// Matches request with host header "www1.example.com"
```

## Routing Priority

Routes are executed in registration order. The first matching handler wins:

```typescript
// Order matters!
app.get('/book/a', (c) => c.text('Specific: a'))    // Matches /book/a
app.get('/book/:slug', (c) => c.text('Generic'))    // Matches /book/anything-else

// GET /book/a -> "Specific: a"
// GET /book/b -> "Generic"
```

### Middleware Before Handlers

```typescript
// Middleware executes first
app.use(logger())
app.get('/foo', (c) => c.text('foo'))
```

### Fallback Routes

Define fallback after specific routes:

```typescript
app.get('/bar', (c) => c.text('bar'))       // Specific route
app.get('*', (c) => c.text('fallback'))     // Fallback for everything else

// GET /bar -> "bar"
// GET /anything -> "fallback"
```

### Wildcard Gotcha

```typescript
// WRONG: Wildcard first stops everything
app.get('*', (c) => c.text('common'))
app.get('/foo', (c) => c.text('foo'))
// GET /foo -> "common" (foo never reached!)

// RIGHT: Specific routes first
app.get('/foo', (c) => c.text('foo'))
app.get('*', (c) => c.text('fallback'))
```

## Grouping Order Matters

```typescript
// CORRECT order
const three = new Hono()
three.get('/hi', (c) => c.text('hi'))

const two = new Hono()
two.route('/three', three)  // Add three to two BEFORE mounting

const app = new Hono()
app.route('/two', two)       // Mount two to app

// GET /two/three/hi -> "hi" ✓
```

```typescript
// WRONG order
const three = new Hono()
three.get('/hi', (c) => c.text('hi'))

const app = new Hono()
app.route('/two', two)       // Mount BEFORE adding three
two.route('/three', three)   // Too late!

// GET /two/three/hi -> 404 ✗
```

## Complete Example

```typescript
import { Hono } from 'hono'

// API routes
const api = new Hono()

api.get('/users', (c) => c.json({ users: [] }))
api.get('/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id })
})
api.post('/users', async (c) => {
  const body = await c.req.json()
  return c.json({ created: true, ...body }, 201)
})

// Admin routes with regex constraint
const admin = new Hono()
admin.get('/users/:id{[0-9]+}', (c) => {
  const id = parseInt(c.req.param('id'))
  return c.json({ admin: true, userId: id })
})

// Main app
const app = new Hono()

// Mount routes
app.route('/api/v1', api)
app.route('/admin', admin)

// Catch-all
app.get('/', (c) => c.text('Welcome!'))
app.get('*', (c) => c.text('Not Found', 404))

export default app
```

## Type-Safe Routing for RPC

For RPC type inference, chain methods directly:

```typescript
// For RPC to work, chain methods
const app = new Hono()
  .get('/users', (c) => c.json([]))
  .post('/users', async (c) => c.json({ created: true }, 201))
  .get('/users/:id', (c) => c.json({ id: c.req.param('id') }))

export type AppType = typeof app  // Correctly infers all routes
```

---

**Source**: [hono.dev/docs/api/routing](https://hono.dev/docs/api/routing)
