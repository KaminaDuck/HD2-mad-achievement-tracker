---
title: "Testing Hono Applications"
description: "Complete guide to testing Hono applications with app.request(), testClient, and various testing patterns"
type: "reference"
tags: ["hono", "testing", "vitest", "bun-test", "typescript", "api-testing"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Testing Guide"
    url: "https://hono.dev/docs/guides/testing"
  - name: "Hono Testing Helper"
    url: "https://hono.dev/docs/helpers/testing"
related:
  - "../README.md"
  - "./bun-runtime.md"
  - "../helpers/testing.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Testing Hono Applications

Hono applications are easy to test using standard Request/Response objects. This guide covers testing with Vitest, Bun, and the `testClient` helper.

## Testing Setup

### Cloudflare Workers with Vitest

Cloudflare recommends using Vitest with `@cloudflare/vitest-pool-workers`:

```bash
npm install -D vitest @cloudflare/vitest-pool-workers
```

### Bun

Use the built-in `bun:test`:

```bash
bun test
```

## Basic Testing with `app.request()`

The `app.request()` method sends a Request to your app and returns a Response:

### Simple GET Request

```typescript
import { describe, expect, it } from 'vitest'  // or 'bun:test'
import app from './app'

describe('API', () => {
  it('GET /posts returns 200', async () => {
    const res = await app.request('/posts')
    expect(res.status).toBe(200)
    expect(await res.text()).toBe('Many posts')
  })
})
```

### POST with JSON Body

```typescript
it('POST /posts creates item', async () => {
  const res = await app.request('/posts', {
    method: 'POST',
    body: JSON.stringify({ title: 'Hello', body: 'World' }),
    headers: { 'Content-Type': 'application/json' },
  })

  expect(res.status).toBe(201)
  expect(res.headers.get('X-Custom')).toBe('Thank you')
  expect(await res.json()).toEqual({ message: 'Created' })
})
```

> **Important**: Always set `Content-Type: application/json` header when testing JSON endpoints, otherwise the body won't be parsed.

### POST with Form Data

```typescript
it('POST /form handles form data', async () => {
  const formData = new FormData()
  formData.append('name', 'John')
  formData.append('email', 'john@example.com')

  const res = await app.request('/form', {
    method: 'POST',
    body: formData,
  })

  expect(res.status).toBe(200)
})
```

### Using Request Object

```typescript
it('accepts Request object', async () => {
  const req = new Request('http://localhost/posts', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test' }),
    headers: { 'Content-Type': 'application/json' },
  })

  const res = await app.request(req)
  expect(res.status).toBe(201)
})
```

## Mocking Environment Variables

Pass environment/bindings as the third parameter:

```typescript
const MOCK_ENV = {
  API_KEY: 'test-key',
  DATABASE_URL: 'sqlite://test.db',
  KV: {
    get: async (key: string) => 'mocked-value',
    put: async (key: string, value: string) => {},
  },
}

it('uses mocked environment', async () => {
  const res = await app.request('/api/data', {}, MOCK_ENV)
  expect(res.status).toBe(200)
})
```

## Testing with `testClient()`

The `testClient()` helper provides a type-safe client similar to the RPC client:

```typescript
import { testClient } from 'hono/testing'
import app from './app'

const client = testClient(app)
```

### Type-Safe Requests

```typescript
// app.ts - Must chain methods for type inference
const app = new Hono()
  .get('/search', (c) => {
    const query = c.req.query('q')
    return c.json({ query, results: ['a', 'b'] })
  })
  .post('/users', async (c) => {
    const body = await c.req.json()
    return c.json({ created: true, ...body }, 201)
  })

export default app
```

```typescript
// app.test.ts
import { testClient } from 'hono/testing'
import app from './app'

describe('Search API', () => {
  const client = testClient(app)

  it('searches with query', async () => {
    const res = await client.search.$get({
      query: { q: 'hono' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      query: 'hono',
      results: ['a', 'b'],
    })
  })
})
```

### With Headers

```typescript
it('includes auth header', async () => {
  const res = await client.users.$get(
    {},
    {
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
    }
  )

  expect(res.status).toBe(200)
})
```

### With Init Options

Pass `RequestInit` options:

```typescript
const res = await client.api.$post(
  { json: { title: 'Test' } },
  {
    init: {
      credentials: 'include',
      cache: 'no-store',
    },
  }
)
```

## Testing Patterns

### Testing JSON API

```typescript
// app.ts
const app = new Hono()

app.get('/api/users', (c) => c.json([{ id: 1, name: 'John' }]))

app.get('/api/users/:id', (c) => {
  const id = c.req.param('id')
  return c.json({ id, name: 'John' })
})

app.post('/api/users', async (c) => {
  const body = await c.req.json()
  return c.json({ id: 1, ...body }, 201)
})
```

```typescript
// app.test.ts
describe('Users API', () => {
  it('lists users', async () => {
    const res = await app.request('/api/users')
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 1, name: 'John' }])
  })

  it('gets user by id', async () => {
    const res = await app.request('/api/users/1')
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: '1' })
  })

  it('creates user', async () => {
    const res = await app.request('/api/users', {
      method: 'POST',
      body: JSON.stringify({ name: 'Jane', email: 'jane@example.com' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ name: 'Jane' })
  })
})
```

### Testing Middleware

```typescript
// auth.middleware.ts
export const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

// auth.test.ts
describe('Auth Middleware', () => {
  const app = new Hono()
  app.use('/api/*', authMiddleware)
  app.get('/api/protected', (c) => c.json({ data: 'secret' }))

  it('blocks unauthenticated requests', async () => {
    const res = await app.request('/api/protected')
    expect(res.status).toBe(401)
  })

  it('allows authenticated requests', async () => {
    const res = await app.request('/api/protected', {
      headers: { Authorization: 'Bearer token' },
    })
    expect(res.status).toBe(200)
  })
})
```

### Testing Error Handling

```typescript
describe('Error Handling', () => {
  const app = new Hono()

  app.get('/error', () => {
    throw new Error('Test error')
  })

  app.onError((err, c) => {
    return c.json({ error: err.message }, 500)
  })

  it('handles errors gracefully', async () => {
    const res = await app.request('/error')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Test error' })
  })
})
```

### Testing with Validation

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({
  title: z.string().min(1),
  body: z.string(),
})

const app = new Hono()
app.post('/posts', zValidator('json', schema), (c) => {
  const data = c.req.valid('json')
  return c.json({ created: true, ...data }, 201)
})

describe('Validation', () => {
  it('accepts valid data', async () => {
    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Hello', body: 'World' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(201)
  })

  it('rejects invalid data', async () => {
    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: '', body: 'World' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(400)
  })
})
```

## Bun-Specific Testing

```typescript
import { describe, expect, it } from 'bun:test'
import app from './index'

describe('Bun App', () => {
  it('returns 200', async () => {
    const req = new Request('http://localhost/')
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
  })

  it('serves static files', async () => {
    const res = await app.request('/static/hello.txt')
    expect(res.status).toBe(200)
    expect(await res.text()).toContain('Hello')
  })
})
```

Run with:

```bash
bun test
```

## Best Practices

1. **Set Content-Type**: Always set `Content-Type` header for JSON requests
2. **Use testClient**: For type-safe testing with autocomplete
3. **Chain methods**: Ensure routes are chained for type inference with `testClient`
4. **Mock environment**: Pass mock bindings for isolated tests
5. **Test edge cases**: Include tests for validation errors, auth failures, etc.
6. **Isolate tests**: Create fresh app instances if tests modify state

---

**Source**: [hono.dev/docs/guides/testing](https://hono.dev/docs/guides/testing) | [hono.dev/docs/helpers/testing](https://hono.dev/docs/helpers/testing)
