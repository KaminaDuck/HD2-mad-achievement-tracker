---
title: "Hono RPC Guide"
description: "Complete guide to Hono RPC for type-safe client-server communication with full TypeScript support"
type: "reference"
tags: ["hono", "rpc", "typescript", "type-safety", "client", "api"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono RPC Guide"
    url: "https://hono.dev/docs/guides/rpc"
related:
  - "../README.md"
  - "./validation.md"
  - "./best-practices.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono RPC Guide

Hono RPC enables type-safe client-server communication by sharing API specifications through TypeScript types. The client automatically infers input and output types from your server routes.

## Prerequisites

For RPC types to work properly in a monorepo, ensure `"strict": true` is set in `compilerOptions` for both client and server `tsconfig.json` files.

## Server Setup

Define routes with validators and export the app type:

```typescript
// server.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

const route = app.post(
  '/posts',
  zValidator(
    'form',
    z.object({
      title: z.string(),
      body: z.string(),
    })
  ),
  (c) => {
    const { title, body } = c.req.valid('form')
    return c.json({ ok: true, message: 'Created!', title }, 201)
  }
)

export type AppType = typeof route
export default app
```

## Client Setup

Import `hc` and the `AppType` to create a typed client:

```typescript
// client.ts
import { hc } from 'hono/client'
import type { AppType } from './server'

const client = hc<AppType>('http://localhost:8787/')

// Make typed requests
const res = await client.posts.$post({
  form: {
    title: 'Hello',
    body: 'Hono is great!',
  },
})

if (res.ok) {
  const data = await res.json()
  console.log(data.message)  // Typed as string
}
```

## Path Parameters

```typescript
// Server
const route = app.get(
  '/posts/:id',
  zValidator('query', z.object({
    page: z.coerce.number().optional(),
  })),
  (c) => {
    const id = c.req.param('id')
    const { page } = c.req.valid('query')
    return c.json({ title: 'Post', body: 'Content', id, page })
  }
)

// Client - path params and query must be strings
const res = await client.posts[':id'].$get({
  param: { id: '123' },
  query: { page: '1' },
})
```

### Including Slashes in Parameters

Use regex routes for paths with slashes:

```typescript
// Server
const route = app.get(
  '/posts/:id{.+}',
  zValidator('param', z.object({ id: z.string() })),
  (c) => {
    const { id } = c.req.valid('param')  // id: "123/456"
    return c.json({ id })
  }
)

// Client
const res = await client.posts[':id'].$get({
  param: { id: '123/456' },
})
```

## Status Code Handling

Specify status codes for type-safe response handling:

```typescript
// Server
const route = app.get(
  '/posts/:id',
  zValidator('query', z.object({ id: z.string() })),
  async (c) => {
    const { id } = c.req.valid('query')
    const post = await getPost(id)

    if (!post) {
      return c.json({ error: 'not found' }, 404)
    }
    return c.json({ post }, 200)
  }
)

// Client
const res = await client.posts[':id'].$get({
  param: { id: '123' },
})

if (res.status === 404) {
  const data = await res.json()  // { error: string }
  console.log(data.error)
}

if (res.ok) {
  const data = await res.json()  // { post: Post }
  console.log(data.post)
}
```

### Infer Response Types

```typescript
import type { InferResponseType } from 'hono/client'

// Union of all response types
type ResponseType = InferResponseType<typeof client.posts.$get>
// { post: Post } | { error: string }

// Specific status code
type ResponseType200 = InferResponseType<typeof client.posts.$get, 200>
// { post: Post }
```

## Request Configuration

### Headers

```typescript
// Per-request headers
const res = await client.search.$get(
  { query: { q: 'hono' } },
  {
    headers: {
      'X-Custom-Header': 'value',
      Authorization: 'Bearer token',
    },
  }
)

// Global headers
const client = hc<AppType>('http://localhost:8787/', {
  headers: {
    Authorization: 'Bearer TOKEN',
  },
})
```

### Cookies

Enable cookies with `credentials: 'include'`:

```typescript
const client = hc<AppType>('http://localhost:8787/', {
  init: {
    credentials: 'include',
  },
})
```

### Abort Requests

```typescript
const abortController = new AbortController()

const res = await client.api.posts.$post(
  { json: { title: 'Hello' } },
  {
    init: {
      signal: abortController.signal,
    },
  }
)

// Later...
abortController.abort()
```

## URL Access

### `$url()`

Get the URL object without making a request:

```typescript
// Must use absolute URL
const client = hc<AppType>('http://localhost:8787/')

const url = client.api.posts.$url()
console.log(url.pathname)  // "/api/posts"

const url = client.api.posts[':id'].$url({
  param: { id: '123' },
})
console.log(url.pathname)  // "/api/posts/123"
```

### Typed URL

Pass base URL as second type parameter for precise URL types:

```typescript
const client = hc<typeof route, 'http://localhost:8787'>(
  'http://localhost:8787/'
)

const url = client.api.posts.$url()
// url has precise type information including protocol, host, path
```

## File Uploads

```typescript
// Server
const route = app.put(
  '/user/picture',
  zValidator('form', z.object({
    file: z.instanceof(File),
  })),
  async (c) => {
    const { file } = c.req.valid('form')
    return c.json({ uploaded: true, name: file.name })
  }
)

// Client
const res = await client.user.picture.$put({
  form: {
    file: new File([blob], 'photo.jpg', { type: 'image/jpeg' }),
  },
})
```

## Type Inference

### `InferRequestType`

```typescript
import type { InferRequestType } from 'hono/client'

const $post = client.posts.$post
type ReqType = InferRequestType<typeof $post>['form']
// { title: string; body: string }
```

### `InferResponseType`

```typescript
import type { InferResponseType } from 'hono/client'

type ResType = InferResponseType<typeof client.posts.$get>
```

### `parseResponse()` Helper

Type-safe response parsing:

```typescript
import { parseResponse, DetailedError } from 'hono/client'

const result = await parseResponse(client.hello.$get()).catch(
  (e: DetailedError) => {
    console.error(e)
  }
)
// result is typed based on response
```

## Larger Applications

### Route Organization

```typescript
// authors.ts
const app = new Hono()
  .get('/', (c) => c.json('list authors'))
  .post('/', (c) => c.json('create author', 201))
  .get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app

// books.ts
const app = new Hono()
  .get('/', (c) => c.json('list books'))
  .post('/', (c) => c.json('create book', 201))
  .get('/:id', (c) => c.json(`get ${c.req.param('id')}`))

export default app

// index.ts
import authors from './authors'
import books from './books'

const app = new Hono()
const routes = app.route('/authors', authors).route('/books', books)

export default app
export type AppType = typeof routes
```

### Split Clients

For large apps, create separate clients per resource:

```typescript
// authors-client.ts
import { hc } from 'hono/client'
import { app as authorsApp } from './authors'

export const authorsClient = hc<typeof authorsApp>('/authors')

// books-client.ts
import { hc } from 'hono/client'
import { app as booksApp } from './books'

export const booksClient = hc<typeof booksApp>('/books')
```

## Custom Configuration

### Custom Fetch

```typescript
// Cloudflare Service Bindings
const client = hc<AppType>('http://localhost', {
  fetch: c.env.AUTH.fetch.bind(c.env.AUTH),
})
```

### Custom Query Serializer

```typescript
const client = hc<AppType>('http://localhost', {
  buildSearchParams: (query) => {
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue
      if (Array.isArray(v)) {
        v.forEach((item) => params.append(`${k}[]`, item))
      } else {
        params.set(k, v)
      }
    }
    return params
  },
})
```

## Using with SWR

```tsx
import useSWR from 'swr'
import { hc } from 'hono/client'
import type { InferRequestType } from 'hono/client'
import type { AppType } from './api'

const App = () => {
  const client = hc<AppType>('/api')
  const $get = client.hello.$get

  const fetcher = (arg: InferRequestType<typeof $get>) => async () => {
    const res = await $get(arg)
    return await res.json()
  }

  const { data, error, isLoading } = useSWR(
    'api-hello',
    fetcher({ query: { name: 'World' } })
  )

  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>
  return <h1>{data?.message}</h1>
}
```

## Performance Tips

### Compile Types

Pre-compile types for better IDE performance:

```typescript
// client-typed.ts
import { hc } from 'hono/client'
import { app } from './app'

export type Client = ReturnType<typeof hc<typeof app>>

export const hcWithType = (...args: Parameters<typeof hc>): Client =>
  hc<typeof app>(...args)
```

```typescript
// Usage
import { hcWithType } from './client-typed'

const client = hcWithType('http://localhost:8787/')
```

### Version Matching

Ensure Hono versions match between frontend and backend to avoid type issues.

---

**Source**: [hono.dev/docs/guides/rpc](https://hono.dev/docs/guides/rpc)
