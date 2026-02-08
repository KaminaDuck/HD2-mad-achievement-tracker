---
title: "Hono JWT Middleware"
description: "Complete guide to JWT authentication middleware in Hono"
type: "reference"
tags: ["hono", "jwt", "authentication", "middleware", "security", "typescript"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono JWT Middleware"
    url: "https://hono.dev/docs/middleware/builtin/jwt"
related:
  - "../README.md"
  - "../guides/middleware.md"
  - "./cors.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono JWT Auth Middleware

JWT (JSON Web Token) middleware provides authentication by verifying tokens. It checks the `Authorization` header (or a cookie if configured).

## Import

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'
```

## Basic Usage

```typescript
type Variables = JwtVariables

const app = new Hono<{ Variables: Variables }>()

app.use(
  '/auth/*',
  jwt({
    secret: 'your-secret-key',
  })
)

app.get('/auth/profile', (c) => {
  return c.text('You are authorized')
})
```

## Getting the Payload

Access the decoded JWT payload via `c.get('jwtPayload')`:

```typescript
app.use(
  '/auth/*',
  jwt({
    secret: 'your-secret-key',
    issuer: 'my-app',
  })
)

app.get('/auth/profile', (c) => {
  const payload = c.get('jwtPayload')
  // { sub: "1234567890", name: "John Doe", iat: 1516239022, iss: "my-app" }
  return c.json(payload)
})
```

## Options

### `secret` (required)

The secret key for verification:

```typescript
jwt({ secret: 'your-secret-key' })
```

### `cookie`

Read token from a cookie instead of Authorization header:

```typescript
jwt({
  secret: 'your-secret-key',
  cookie: 'auth_token',  // Cookie name
})
```

### `alg`

Specify the algorithm (default: `HS256`):

```typescript
jwt({
  secret: publicKey,
  alg: 'RS256',
})
```

Available algorithms:
- `HS256`, `HS384`, `HS512` (HMAC)
- `RS256`, `RS384`, `RS512` (RSA)
- `PS256`, `PS384`, `PS512` (RSA-PSS)
- `ES256`, `ES384`, `ES512` (ECDSA)
- `EdDSA` (Edwards-curve)

### `headerName`

Custom header name (default: `Authorization`):

```typescript
jwt({
  secret: 'your-secret-key',
  headerName: 'X-Auth-Token',
})
```

### `verifyOptions`

Control token verification:

```typescript
jwt({
  secret: 'your-secret-key',
  verifyOptions: {
    iss: 'my-app',        // Expected issuer (string or RegExp)
    nbf: true,            // Verify not-before claim (default: true)
    iat: true,            // Verify issued-at claim (default: true)
    exp: true,            // Verify expiration claim (default: true)
  },
})
```

## Authorization Header Format

The client must send the token with a scheme:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

Or with Basic scheme:

```
Authorization: Basic eyJhbGciOiJIUzI1NiIs...
```

## Using Environment Variables

Access secrets from environment:

```typescript
app.use('/auth/*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
  })
  return jwtMiddleware(c, next)
})
```

## Common Patterns

### Protected Routes

```typescript
import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'

type Variables = JwtVariables<{ sub: string; role: string }>

const app = new Hono<{ Variables: Variables }>()

// Public routes
app.get('/', (c) => c.text('Welcome!'))
app.post('/login', async (c) => {
  // Generate token...
  return c.json({ token: '...' })
})

// Protected routes
app.use('/api/*', jwt({ secret: 'secret' }))

app.get('/api/me', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({ userId: payload.sub, role: payload.role })
})
```

### Role-Based Access

```typescript
import { createMiddleware } from 'hono/factory'

type JwtPayload = {
  sub: string
  role: 'user' | 'admin'
}

const adminOnly = createMiddleware(async (c, next) => {
  const payload = c.get('jwtPayload') as JwtPayload
  if (payload.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403)
  }
  await next()
})

app.use('/api/*', jwt({ secret: 'secret' }))
app.use('/api/admin/*', adminOnly)

app.get('/api/admin/users', (c) => {
  return c.json([/* admin-only data */])
})
```

### Token Refresh

```typescript
import { sign, verify } from 'hono/jwt'

app.post('/refresh', async (c) => {
  const oldToken = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!oldToken) {
    return c.json({ error: 'No token provided' }, 401)
  }

  try {
    const payload = await verify(oldToken, c.env.JWT_SECRET)

    // Generate new token with extended expiry
    const newToken = await sign(
      {
        sub: payload.sub,
        role: payload.role,
        exp: Math.floor(Date.now() / 1000) + 60 * 60,  // 1 hour
      },
      c.env.JWT_SECRET
    )

    return c.json({ token: newToken })
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})
```

### Multiple Auth Strategies

```typescript
import { jwt } from 'hono/jwt'
import { bearerAuth } from 'hono/bearer-auth'

// JWT for users
app.use('/api/user/*', jwt({ secret: 'user-secret' }))

// API key for services
app.use('/api/service/*', bearerAuth({ token: 'service-api-key' }))

// Combined (either works)
app.use('/api/flexible/*', async (c, next) => {
  const auth = c.req.header('Authorization')

  if (auth?.startsWith('Bearer ')) {
    const token = auth.replace('Bearer ', '')

    // Try JWT first
    try {
      const jwtMiddleware = jwt({ secret: 'secret' })
      return jwtMiddleware(c, next)
    } catch {
      // Fall back to API key
      if (token === 'api-key') {
        await next()
        return
      }
    }
  }

  return c.json({ error: 'Unauthorized' }, 401)
})
```

## Complete Example

```typescript
import { Hono } from 'hono'
import { jwt, sign } from 'hono/jwt'
import type { JwtVariables } from 'hono/jwt'

type Payload = {
  sub: string
  email: string
  role: 'user' | 'admin'
  exp: number
}

type Variables = JwtVariables<Payload>

type Bindings = {
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Login endpoint
app.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  // Validate credentials (simplified)
  if (email === 'admin@example.com' && password === 'admin') {
    const payload: Payload = {
      sub: '1',
      email,
      role: 'admin',
      exp: Math.floor(Date.now() / 1000) + 60 * 60,  // 1 hour
    }

    const token = await sign(payload, c.env.JWT_SECRET)
    return c.json({ token })
  }

  return c.json({ error: 'Invalid credentials' }, 401)
})

// Protected routes
app.use('/api/*', (c, next) => {
  const jwtMiddleware = jwt({
    secret: c.env.JWT_SECRET,
  })
  return jwtMiddleware(c, next)
})

// Get current user
app.get('/api/me', (c) => {
  const payload = c.get('jwtPayload')
  return c.json({
    id: payload.sub,
    email: payload.email,
    role: payload.role,
  })
})

// Admin only
app.get('/api/admin/stats', (c) => {
  const payload = c.get('jwtPayload')
  if (payload.role !== 'admin') {
    return c.json({ error: 'Admin required' }, 403)
  }
  return c.json({ users: 100, posts: 500 })
})

export default app
```

---

**Source**: [hono.dev/docs/middleware/builtin/jwt](https://hono.dev/docs/middleware/builtin/jwt)
