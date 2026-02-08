---
title: "Hono CORS Middleware"
description: "Complete guide to CORS middleware in Hono for handling cross-origin requests"
type: "reference"
tags: ["hono", "cors", "middleware", "security", "typescript"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono CORS Middleware"
    url: "https://hono.dev/docs/middleware/builtin/cors"
related:
  - "../README.md"
  - "../guides/middleware.md"
  - "./jwt.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono CORS Middleware

CORS (Cross-Origin Resource Sharing) middleware enables your API to handle requests from external front-end applications.

## Import

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'
```

## Basic Usage

```typescript
const app = new Hono()

// Apply to all routes - must be before route definitions
app.use('/api/*', cors())

app.get('/api/data', (c) => {
  return c.json({ data: 'value' })
})
```

## Configuration Options

```typescript
app.use(
  '/api/*',
  cors({
    origin: 'http://example.com',
    allowHeaders: ['X-Custom-Header', 'Upgrade-Insecure-Requests'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length', 'X-Kuma-Revision'],
    maxAge: 600,
    credentials: true,
  })
)
```

### Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `origin` | `string \| string[] \| Function` | `'*'` | Allowed origins |
| `allowMethods` | `string[] \| Function` | `['GET', 'HEAD', 'PUT', 'POST', 'DELETE', 'PATCH']` | Allowed HTTP methods |
| `allowHeaders` | `string[]` | `[]` | Allowed request headers |
| `exposeHeaders` | `string[]` | `[]` | Headers exposed to browser |
| `maxAge` | `number` | - | Preflight cache time (seconds) |
| `credentials` | `boolean` | - | Allow credentials |

## Origin Configuration

### Single Origin

```typescript
app.use(
  '/api/*',
  cors({
    origin: 'https://example.com',
  })
)
```

### Multiple Origins

```typescript
app.use(
  '/api/*',
  cors({
    origin: ['https://example.com', 'https://app.example.com'],
  })
)
```

### Dynamic Origin (Function)

```typescript
app.use(
  '/api/*',
  cors({
    origin: (origin, c) => {
      // Allow all subdomains
      if (origin.endsWith('.example.com')) {
        return origin
      }
      // Default fallback
      return 'https://example.com'
    },
  })
)
```

## Dynamic Methods

Allow different methods based on origin:

```typescript
app.use(
  '/api/*',
  cors({
    origin: (origin) =>
      origin === 'https://admin.example.com' ? origin : '*',
    allowMethods: (origin, c) =>
      origin === 'https://admin.example.com'
        ? ['GET', 'HEAD', 'POST', 'PATCH', 'DELETE']
        : ['GET', 'HEAD'],
  })
)
```

## Environment-Based Configuration

Use environment variables for different environments:

```typescript
app.use('*', async (c, next) => {
  const corsMiddleware = cors({
    origin: c.env.CORS_ORIGIN,  // From environment
  })
  return corsMiddleware(c, next)
})
```

## Using with Vite

When using Hono with Vite, disable Vite's built-in CORS to avoid conflicts:

```typescript
// vite.config.ts
import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    cors: false,  // Disable Vite's CORS
  },
  plugins: [/* ... */],
})
```

## Common Patterns

### API with Credentials

```typescript
app.use(
  '/api/*',
  cors({
    origin: 'https://app.example.com',
    credentials: true,
    allowHeaders: ['Content-Type', 'Authorization'],
  })
)
```

### Development vs Production

```typescript
const isDev = process.env.NODE_ENV === 'development'

app.use(
  '/api/*',
  cors({
    origin: isDev
      ? '*'
      : ['https://example.com', 'https://app.example.com'],
    credentials: !isDev,
  })
)
```

### Multiple APIs with Different CORS

```typescript
// Public API - allow all
app.use('/api/public/*', cors())

// Private API - restricted
app.use(
  '/api/private/*',
  cors({
    origin: 'https://app.example.com',
    credentials: true,
  })
)

// Admin API - most restricted
app.use(
  '/api/admin/*',
  cors({
    origin: 'https://admin.example.com',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
)
```

## Complete Example

```typescript
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS configuration based on environment
app.use('*', async (c, next) => {
  const allowedOrigins = c.env.ALLOWED_ORIGINS?.split(',') || ['*']

  const corsMiddleware = cors({
    origin: (origin) => {
      if (allowedOrigins.includes('*')) return '*'
      if (allowedOrigins.includes(origin)) return origin
      return allowedOrigins[0]
    },
    allowMethods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
    ],
    exposeHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400,  // 24 hours
    credentials: true,
  })

  return corsMiddleware(c, next)
})

// Routes
app.get('/api/users', (c) => {
  return c.json([{ id: 1, name: 'John' }])
})

app.post('/api/users', async (c) => {
  const body = await c.req.json()
  return c.json({ created: true, ...body }, 201)
})

export default app
```

---

**Source**: [hono.dev/docs/middleware/builtin/cors](https://hono.dev/docs/middleware/builtin/cors)
