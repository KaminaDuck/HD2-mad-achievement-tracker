---
title: "HTTPException API Reference"
description: "Complete guide to Hono HTTPException for error handling and custom error responses"
type: "reference"
tags: ["hono", "exception", "error-handling", "api", "typescript"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Exception Documentation"
    url: "https://hono.dev/docs/api/exception"
related:
  - "../README.md"
  - "./hono-app.md"
  - "./context.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# HTTPException API Reference

`HTTPException` is a custom Error class that simplifies returning error responses. When thrown, Hono catches it and converts it to an appropriate HTTP response.

## Import

```typescript
import { HTTPException } from 'hono/http-exception'
```

## Throwing HTTPExceptions

### Basic Usage with Message

For simple text error responses:

```typescript
import { HTTPException } from 'hono/http-exception'

app.get('/protected', (c) => {
  const authorized = checkAuth(c)
  if (!authorized) {
    throw new HTTPException(401, { message: 'Unauthorized' })
  }
  return c.json({ data: 'secret' })
})
```

### Custom Response

For custom response types or headers, use the `res` option:

```typescript
app.get('/api/resource', (c) => {
  const valid = validateRequest(c)
  if (!valid) {
    const errorResponse = new Response(
      JSON.stringify({ error: 'Invalid request', code: 'INVALID' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Error-Code': 'INVALID',
        },
      }
    )
    throw new HTTPException(400, { res: errorResponse })
  }
  return c.json({ data: 'valid' })
})
```

> **Note**: The status passed to the constructor is used to create responses, not the status from the custom Response.

### Authentication Error with WWW-Authenticate

```typescript
app.get('/api/protected', (c) => {
  const token = c.req.header('Authorization')
  if (!token || !validateToken(token)) {
    const errorResponse = new Response('Unauthorized', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Bearer error="invalid_token"',
      },
    })
    throw new HTTPException(401, { res: errorResponse })
  }
  return c.json({ data: 'protected' })
})
```

### With Cause (Original Error)

Attach the original error for debugging:

```typescript
app.post('/login', async (c) => {
  try {
    const user = await authenticate(c)
    return c.json({ user })
  } catch (originalError) {
    throw new HTTPException(401, {
      message: 'Authentication failed',
      cause: originalError,  // Attach original error
    })
  }
})
```

## Handling HTTPExceptions

Use `app.onError` to handle HTTPExceptions globally:

```typescript
import { HTTPException } from 'hono/http-exception'

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    // Log the cause if available
    if (err.cause) {
      console.error('Original error:', err.cause)
    }
    // Return the error response
    return err.getResponse()
  }

  // Handle other errors
  console.error('Unexpected error:', err)
  return c.json({ error: 'Internal Server Error' }, 500)
})
```

### `getResponse()` Method

`HTTPException.getResponse()` creates a Response based on:
- The status code passed to the constructor
- Either the error message or custom response

```typescript
throw new HTTPException(404, { message: 'User not found' })
// getResponse() returns: Response with status 404, body "User not found"

throw new HTTPException(400, { res: customResponse })
// getResponse() returns: customResponse (with status from constructor)
```

> **Warning**: `getResponse()` is not aware of the Context. If you need to include headers already set in Context, apply them manually:
>
> ```typescript
> app.onError((err, c) => {
>   if (err instanceof HTTPException) {
>     const response = err.getResponse()
>     // Add headers from context if needed
>     c.res.headers.forEach((value, key) => {
>       response.headers.set(key, value)
>     })
>     return response
>   }
>   return c.json({ error: 'Internal error' }, 500)
> })
> ```

## Common Patterns

### Structured Error Responses

```typescript
import { HTTPException } from 'hono/http-exception'

interface ApiError {
  error: string
  code: string
  details?: unknown
}

function throwApiError(
  status: number,
  code: string,
  message: string,
  details?: unknown
): never {
  const body: ApiError = { error: message, code }
  if (details) body.details = details

  const response = new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
  throw new HTTPException(status, { res: response })
}

// Usage
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')
  const user = await findUser(id)

  if (!user) {
    throwApiError(404, 'USER_NOT_FOUND', `User ${id} not found`)
  }

  return c.json(user)
})
```

### Error Factory Functions

```typescript
import { HTTPException } from 'hono/http-exception'

const errors = {
  unauthorized: (message = 'Unauthorized') =>
    new HTTPException(401, { message }),

  forbidden: (message = 'Forbidden') =>
    new HTTPException(403, { message }),

  notFound: (resource = 'Resource') =>
    new HTTPException(404, { message: `${resource} not found` }),

  badRequest: (message: string, cause?: Error) =>
    new HTTPException(400, { message, cause }),

  conflict: (message: string) =>
    new HTTPException(409, { message }),
}

// Usage
app.get('/users/:id', async (c) => {
  const user = await findUser(c.req.param('id'))
  if (!user) throw errors.notFound('User')
  return c.json(user)
})

app.post('/users', async (c) => {
  const { email } = await c.req.json()
  const exists = await userExists(email)
  if (exists) throw errors.conflict('Email already registered')
  // ...
})
```

### Middleware Error Handling

```typescript
import { HTTPException } from 'hono/http-exception'

const authMiddleware = async (c, next) => {
  const token = c.req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new HTTPException(401, { message: 'Token required' })
  }

  try {
    const payload = await verifyToken(token)
    c.set('user', payload)
  } catch (err) {
    throw new HTTPException(401, {
      message: 'Invalid token',
      cause: err,
    })
  }

  await next()
}

app.use('/api/*', authMiddleware)
```

## Complete Example

```typescript
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'

const app = new Hono()

// Custom error types
class ValidationError extends HTTPException {
  constructor(errors: Record<string, string>) {
    const response = new Response(
      JSON.stringify({ error: 'Validation failed', errors }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
    super(400, { res: response })
  }
}

// Routes
app.get('/users/:id', async (c) => {
  const id = c.req.param('id')

  if (!/^\d+$/.test(id)) {
    throw new HTTPException(400, { message: 'Invalid user ID' })
  }

  const user = await findUser(parseInt(id))
  if (!user) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  return c.json(user)
})

app.post('/users', async (c) => {
  const body = await c.req.json()

  // Validation
  const errors: Record<string, string> = {}
  if (!body.name) errors.name = 'Name is required'
  if (!body.email) errors.email = 'Email is required'

  if (Object.keys(errors).length > 0) {
    throw new ValidationError(errors)
  }

  try {
    const user = await createUser(body)
    return c.json(user, 201)
  } catch (err) {
    throw new HTTPException(500, {
      message: 'Failed to create user',
      cause: err,
    })
  }
})

// Global error handler
app.onError((err, c) => {
  console.error(`Error: ${err.message}`)

  if (err instanceof HTTPException) {
    if (err.cause) {
      console.error('Cause:', err.cause)
    }
    return err.getResponse()
  }

  return c.json(
    { error: 'Internal Server Error' },
    500
  )
})

export default app
```

---

**Source**: [hono.dev/docs/api/exception](https://hono.dev/docs/api/exception)
