---
title: "Hono Testing Helper"
description: "Type-safe testing helper for Hono applications using testClient"
type: "reference"
tags: ["hono", "testing", "testClient", "typescript", "type-safety"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Testing Helper"
    url: "https://hono.dev/docs/helpers/testing"
related:
  - "../README.md"
  - "../guides/testing.md"
  - "../guides/rpc.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono Testing Helper

The Testing Helper provides `testClient()` for type-safe testing of Hono applications with editor autocompletion.

## Import

```typescript
import { Hono } from 'hono'
import { testClient } from 'hono/testing'
```

## `testClient()`

Creates a typed client for your Hono application, similar to the RPC client.

### Basic Usage

```typescript
// app.ts - Chain methods for type inference
const app = new Hono()
  .get('/search', (c) => {
    const query = c.req.query('q')
    return c.json({ query, results: ['result1', 'result2'] })
  })

export default app
```

```typescript
// app.test.ts
import { testClient } from 'hono/testing'
import { describe, it, expect } from 'vitest'
import app from './app'

describe('Search Endpoint', () => {
  const client = testClient(app)

  it('returns search results', async () => {
    const res = await client.search.$get({
      query: { q: 'hono' },
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({
      query: 'hono',
      results: ['result1', 'result2'],
    })
  })
})
```

### Important: Chain Methods

For `testClient` to correctly infer types, **you must chain route definitions**:

```typescript
// ✅ Works - methods chained
const app = new Hono()
  .get('/users', (c) => c.json([]))
  .post('/users', (c) => c.json({ created: true }, 201))

// ❌ Won't work - methods not chained
const app = new Hono()
app.get('/users', (c) => c.json([]))
app.post('/users', (c) => c.json({ created: true }, 201))
```

## Including Headers

Pass headers as the second parameter:

```typescript
it('includes auth header', async () => {
  const token = 'my-auth-token'

  const res = await client.search.$get(
    { query: { q: 'hono' } },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  )

  expect(res.status).toBe(200)
})
```

## Using `init` Option

Pass `RequestInit` options for advanced configuration:

```typescript
const res = await client.api.$post(
  { json: { title: 'Test' } },
  {
    headers: {
      Authorization: 'Bearer token',
    },
    init: {
      credentials: 'include',
      cache: 'no-store',
    },
  }
)
```

## HTTP Methods

```typescript
const client = testClient(app)

// GET with query params
await client.users.$get({ query: { page: '1' } })

// POST with JSON body
await client.users.$post({ json: { name: 'John' } })

// PUT with JSON body
await client.users[':id'].$put({
  param: { id: '123' },
  json: { name: 'Updated' },
})

// DELETE with path param
await client.users[':id'].$delete({
  param: { id: '123' },
})

// PATCH with partial data
await client.users[':id'].$patch({
  param: { id: '123' },
  json: { name: 'Patched' },
})
```

## Path Parameters

```typescript
// Route: /users/:id/posts/:postId
const res = await client.users[':id'].posts[':postId'].$get({
  param: {
    id: '123',
    postId: '456',
  },
})
```

## Form Data

```typescript
// Route with form validation
const res = await client.upload.$post({
  form: {
    file: new File(['content'], 'test.txt'),
    description: 'My file',
  },
})
```

## Complete Test Example

```typescript
// app.ts
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const userSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
})

const app = new Hono()
  .get('/users', (c) => {
    return c.json([
      { id: 1, name: 'John', email: 'john@example.com' },
    ])
  })
  .get('/users/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ id, name: 'John', email: 'john@example.com' })
  })
  .post('/users', zValidator('json', userSchema), (c) => {
    const data = c.req.valid('json')
    return c.json({ id: 1, ...data }, 201)
  })
  .delete('/users/:id', (c) => {
    const id = c.req.param('id')
    return c.json({ deleted: id })
  })

export default app
```

```typescript
// app.test.ts
import { testClient } from 'hono/testing'
import { describe, it, expect } from 'vitest'
import app from './app'

describe('Users API', () => {
  const client = testClient(app)

  describe('GET /users', () => {
    it('returns list of users', async () => {
      const res = await client.users.$get()

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveLength(1)
      expect(data[0].name).toBe('John')
    })
  })

  describe('GET /users/:id', () => {
    it('returns user by id', async () => {
      const res = await client.users[':id'].$get({
        param: { id: '1' },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.id).toBe('1')
    })
  })

  describe('POST /users', () => {
    it('creates a new user', async () => {
      const res = await client.users.$post({
        json: {
          name: 'Jane',
          email: 'jane@example.com',
        },
      })

      expect(res.status).toBe(201)
      const data = await res.json()
      expect(data.name).toBe('Jane')
      expect(data.email).toBe('jane@example.com')
    })

    it('rejects invalid data', async () => {
      const res = await client.users.$post({
        json: {
          name: '',  // Invalid: empty
          email: 'not-an-email',  // Invalid: not email format
        },
      })

      expect(res.status).toBe(400)
    })
  })

  describe('DELETE /users/:id', () => {
    it('deletes a user', async () => {
      const res = await client.users[':id'].$delete({
        param: { id: '1' },
      })

      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.deleted).toBe('1')
    })
  })

  describe('with authentication', () => {
    it('passes auth header', async () => {
      const res = await client.users.$get(
        {},
        {
          headers: {
            Authorization: 'Bearer my-token',
          },
        }
      )

      expect(res.status).toBe(200)
    })
  })
})
```

## Tips

1. **Chain methods** on your Hono app for proper type inference
2. **Use with Vitest or Bun test** for best experience
3. **All parameters are strings** (like the RPC client)
4. **Headers can be passed** as second parameter
5. **Type inference** provides autocomplete for routes and parameters

---

**Source**: [hono.dev/docs/helpers/testing](https://hono.dev/docs/helpers/testing)
