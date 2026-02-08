---
title: "Hono Validation Guide"
description: "Complete guide to request validation in Hono with Zod, Valibot, ArkType, and manual validation"
type: "reference"
tags: ["hono", "validation", "zod", "valibot", "typescript", "schema"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Validation Guide"
    url: "https://hono.dev/docs/guides/validation"
related:
  - "../README.md"
  - "../api/request.md"
  - "./rpc.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono Validation Guide

Hono provides a thin validation layer that becomes powerful when combined with schema validation libraries. Validated data is type-safe and accessible via `c.req.valid()`.

## Manual Validation

### Basic Validator

```typescript
import { validator } from 'hono/validator'

app.post(
  '/posts',
  validator('form', (value, c) => {
    const body = value['body']
    if (!body || typeof body !== 'string') {
      return c.text('Invalid!', 400)
    }
    return { body }  // Return validated data
  }),
  (c) => {
    const { body } = c.req.valid('form')  // Type-safe access
    return c.json({ message: 'Created!', body }, 201)
  }
)
```

### Validation Targets

Available targets for validation:

| Target | Description |
|--------|-------------|
| `form` | Form data (multipart/form-data, x-www-form-urlencoded) |
| `json` | JSON body |
| `query` | Query parameters |
| `header` | Request headers |
| `cookie` | Cookies |
| `param` | Path parameters |

### Multiple Validators

```typescript
app.post(
  '/posts/:id',
  validator('param', (value, c) => {
    const id = parseInt(value['id'])
    if (isNaN(id)) return c.text('Invalid ID', 400)
    return { id }
  }),
  validator('query', (value, c) => {
    const page = parseInt(value['page'] || '1')
    return { page }
  }),
  validator('json', (value, c) => {
    if (!value['title']) return c.text('Title required', 400)
    return value as { title: string; body?: string }
  }),
  (c) => {
    const { id } = c.req.valid('param')
    const { page } = c.req.valid('query')
    const { title, body } = c.req.valid('json')
    return c.json({ id, page, title, body })
  }
)
```

## Important Notes

### Content-Type Required

For `json` and `form` validation, the request must include the matching `Content-Type` header:

```typescript
// ❌ Empty object - no Content-Type
const res = await app.request('/api', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
})

// ✅ Works correctly
const res = await app.request('/api', {
  method: 'POST',
  body: JSON.stringify({ key: 'value' }),
  headers: { 'Content-Type': 'application/json' },
})
```

### Header Keys are Lowercase

When validating headers, use lowercase keys:

```typescript
// ❌ Won't work
validator('header', (value, c) => {
  const key = value['Idempotency-Key']  // Always undefined
  // ...
})

// ✅ Works correctly
validator('header', (value, c) => {
  const key = value['idempotency-key']  // Correct
  // ...
})
```

## Validation with Zod

[Zod](https://zod.dev/) is the recommended validation library for Hono.

### Install

```bash
bun add zod
```

### Manual Zod Integration

```typescript
import { z } from 'zod'
import { validator } from 'hono/validator'

const schema = z.object({
  title: z.string().min(1),
  body: z.string(),
  tags: z.array(z.string()).optional(),
})

app.post(
  '/posts',
  validator('json', (value, c) => {
    const parsed = schema.safeParse(value)
    if (!parsed.success) {
      return c.json({ error: parsed.error.flatten() }, 400)
    }
    return parsed.data
  }),
  (c) => {
    const { title, body, tags } = c.req.valid('json')
    return c.json({ created: true, title, body, tags }, 201)
  }
)
```

### Zod Validator Middleware

The `@hono/zod-validator` package simplifies Zod integration:

```bash
bun add @hono/zod-validator
```

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string(),
  published: z.boolean().default(false),
})

app.post(
  '/posts',
  zValidator('json', createPostSchema),
  (c) => {
    const { title, body, published } = c.req.valid('json')
    return c.json({ title, body, published }, 201)
  }
)
```

### Zod Schema Examples

```typescript
// Query parameters with coercion
const searchSchema = z.object({
  q: z.string().min(1),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
})

app.get('/search', zValidator('query', searchSchema), (c) => {
  const { q, page, limit } = c.req.valid('query')
  return c.json({ q, page, limit })
})

// Path parameters
const idSchema = z.object({
  id: z.coerce.number().int().positive(),
})

app.get('/users/:id', zValidator('param', idSchema), (c) => {
  const { id } = c.req.valid('param')
  return c.json({ id })
})

// Headers
const authSchema = z.object({
  authorization: z.string().regex(/^Bearer .+$/),
})

app.get('/protected', zValidator('header', authSchema), (c) => {
  const { authorization } = c.req.valid('header')
  return c.json({ authenticated: true })
})
```

## Standard Schema Validator

[Standard Schema](https://standardschema.dev/) provides a common interface for validation libraries.

```bash
bun add @hono/standard-validator
```

### With Zod

```typescript
import { z } from 'zod'
import { sValidator } from '@hono/standard-validator'

const schema = z.object({
  name: z.string(),
  age: z.number(),
})

app.post('/author', sValidator('json', schema), (c) => {
  const { name, age } = c.req.valid('json')
  return c.json({ message: `${name} is ${age}` })
})
```

### With Valibot

[Valibot](https://valibot.dev/) is a lightweight alternative to Zod:

```bash
bun add valibot
```

```typescript
import * as v from 'valibot'
import { sValidator } from '@hono/standard-validator'

const schema = v.object({
  name: v.string(),
  age: v.number(),
})

app.post('/author', sValidator('json', schema), (c) => {
  const { name, age } = c.req.valid('json')
  return c.json({ message: `${name} is ${age}` })
})
```

### With ArkType

[ArkType](https://arktype.io/) offers TypeScript-native syntax:

```bash
bun add arktype
```

```typescript
import { type } from 'arktype'
import { sValidator } from '@hono/standard-validator'

const schema = type({
  name: 'string',
  age: 'number',
})

app.post('/author', sValidator('json', schema), (c) => {
  const { name, age } = c.req.valid('json')
  return c.json({ message: `${name} is ${age}` })
})
```

## Validation Patterns

### Complete CRUD Validation

```typescript
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const app = new Hono()

// Schemas
const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  role: z.enum(['user', 'admin']).default('user'),
})

const updateUserSchema = createUserSchema.partial()

const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
})

const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['name', 'email', 'createdAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
})

// Routes
app.get('/users', zValidator('query', paginationSchema), (c) => {
  const { page, limit, sort, order } = c.req.valid('query')
  return c.json({ page, limit, sort, order })
})

app.post('/users', zValidator('json', createUserSchema), (c) => {
  const data = c.req.valid('json')
  return c.json({ created: true, ...data }, 201)
})

app.get('/users/:id', zValidator('param', idParamSchema), (c) => {
  const { id } = c.req.valid('param')
  return c.json({ id })
})

app.patch(
  '/users/:id',
  zValidator('param', idParamSchema),
  zValidator('json', updateUserSchema),
  (c) => {
    const { id } = c.req.valid('param')
    const updates = c.req.valid('json')
    return c.json({ id, ...updates })
  }
)

app.delete('/users/:id', zValidator('param', idParamSchema), (c) => {
  const { id } = c.req.valid('param')
  return c.json({ deleted: id })
})
```

### Custom Error Handling

```typescript
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

app.post(
  '/login',
  zValidator('json', schema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: 'Validation failed',
          details: result.error.flatten().fieldErrors,
        },
        400
      )
    }
  }),
  (c) => {
    const { email, password } = c.req.valid('json')
    return c.json({ success: true })
  }
)
```

### File Upload Validation

```typescript
const uploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'File must be less than 5MB'
  ),
  description: z.string().optional(),
})

app.post('/upload', zValidator('form', uploadSchema), async (c) => {
  const { file, description } = c.req.valid('form')
  return c.json({
    name: file.name,
    size: file.size,
    type: file.type,
    description,
  })
})
```

---

**Source**: [hono.dev/docs/guides/validation](https://hono.dev/docs/guides/validation)
