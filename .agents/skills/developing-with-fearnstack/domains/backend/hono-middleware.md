---
title: Hono Middleware
description: Middleware patterns for CORS, authentication, logging, and more
---

# Hono Middleware

Middleware in Hono handles cross-cutting concerns like authentication, logging, validation, and CORS. Middleware runs before route handlers and can modify requests/responses.

## Middleware Basics

```typescript
import { Hono } from "hono";

const app = new Hono();

// Middleware function signature
app.use(async (c, next) => {
  console.log(`${c.req.method} ${c.req.path}`);
  const start = Date.now();

  await next(); // Call the next middleware/handler

  console.log(`Completed in ${Date.now() - start}ms`);
});

app.get("/", (c) => c.text("Hello!"));
```

## Built-in Middleware

### CORS

Enable cross-origin requests:

```typescript
import { cors } from "hono/cors";

// Allow all origins
app.use("/api/*", cors());

// Specific configuration
app.use(
  "/api/*",
  cors({
    origin: ["http://localhost:3000", "https://myapp.com"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
);
```

### Logger

Request logging:

```typescript
import { logger } from "hono/logger";

// Basic logging
app.use(logger());

// Custom format
app.use(
  logger((message, ...rest) => {
    console.log(`[API] ${message}`, ...rest);
  })
);
```

### JWT Authentication

```typescript
import { jwt } from "hono/jwt";

// Protect routes with JWT
app.use(
  "/api/*",
  jwt({
    secret: process.env.JWT_SECRET!,
  })
);

// Access decoded payload
app.get("/api/me", (c) => {
  const payload = c.get("jwtPayload");
  return c.json({ userId: payload.sub });
});
```

### Bearer Auth

Simple token authentication:

```typescript
import { bearerAuth } from "hono/bearer-auth";

app.use(
  "/api/*",
  bearerAuth({
    token: process.env.API_TOKEN!,
  })
);

// Or with async verification
app.use(
  "/api/*",
  bearerAuth({
    verifyToken: async (token, c) => {
      const isValid = await validateToken(token);
      return isValid;
    },
  })
);
```

### Basic Auth

```typescript
import { basicAuth } from "hono/basic-auth";

app.use(
  "/admin/*",
  basicAuth({
    username: process.env.ADMIN_USER!,
    password: process.env.ADMIN_PASS!,
  })
);
```

### Compress

Response compression:

```typescript
import { compress } from "hono/compress";

app.use(compress());
```

### Secure Headers

Security headers:

```typescript
import { secureHeaders } from "hono/secure-headers";

app.use(
  secureHeaders({
    contentSecurityPolicy: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
    },
    xFrameOptions: "DENY",
    xContentTypeOptions: "nosniff",
  })
);
```

### Timeout

Request timeout:

```typescript
import { timeout } from "hono/timeout";

app.use("/api/*", timeout(5000)); // 5 second timeout

// With custom error
app.use(
  "/api/*",
  timeout(5000, () => {
    return new Response("Request timed out", { status: 408 });
  })
);
```

### Cache

Response caching:

```typescript
import { cache } from "hono/cache";

app.use(
  "/static/*",
  cache({
    cacheName: "static-assets",
    cacheControl: "max-age=3600",
  })
);
```

## Request Validation with Zod

The most common middleware pattern in Fearnstack:

```typescript
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

// Schema definition
const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18).optional(),
});

// Apply to route
app.post("/api/users", zValidator("json", createUserSchema), (c) => {
  const data = c.req.valid("json"); // Fully typed!
  return c.json({ created: true, data });
});

// Validate different parts of request
app.get(
  "/api/users/:id",
  zValidator("param", z.object({ id: z.string().uuid() })),
  zValidator("query", z.object({ include: z.string().optional() })),
  (c) => {
    const { id } = c.req.valid("param");
    const { include } = c.req.valid("query");
    return c.json({ id, include });
  }
);
```

### Validation Targets

| Target | Description |
|--------|-------------|
| `json` | JSON request body |
| `form` | Form data |
| `query` | Query string parameters |
| `param` | Path parameters |
| `header` | Request headers |
| `cookie` | Cookies |

### Custom Error Handling

```typescript
app.post(
  "/api/users",
  zValidator("json", createUserSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Validation failed",
          issues: result.error.issues,
        },
        400
      );
    }
  }),
  (c) => {
    const data = c.req.valid("json");
    return c.json({ created: true });
  }
);
```

## Custom Middleware

### Authentication Middleware

```typescript
// src/server/middleware/auth.ts
import { createMiddleware } from "hono/factory";
import type { Context, Next } from "hono";

interface AuthEnv {
  Variables: {
    userId: string;
    user: User;
  };
}

export const authMiddleware = createMiddleware<AuthEnv>(async (c, next) => {
  const token = c.req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const decoded = await verifyToken(token);
    const user = await getUser(decoded.sub);

    if (!user) {
      return c.json({ error: "User not found" }, 401);
    }

    c.set("userId", decoded.sub);
    c.set("user", user);

    await next();
  } catch {
    return c.json({ error: "Invalid token" }, 401);
  }
});

// Usage
app.use("/api/*", authMiddleware);

app.get("/api/me", (c) => {
  const user = c.get("user"); // Typed!
  return c.json(user);
});
```

### Rate Limiting

```typescript
// Simple rate limiter
const rateLimiter = createMiddleware(async (c, next) => {
  const ip = c.req.header("x-forwarded-for") || "unknown";
  const key = `rate-limit:${ip}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 60); // 1 minute window
  }

  if (current > 100) {
    return c.json({ error: "Too many requests" }, 429);
  }

  await next();
});

app.use("/api/*", rateLimiter);
```

### Request Logging

```typescript
const requestLogger = createMiddleware(async (c, next) => {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  c.set("requestId", requestId);
  c.header("X-Request-ID", requestId);

  console.log({
    type: "request",
    requestId,
    method: c.req.method,
    path: c.req.path,
    timestamp: new Date().toISOString(),
  });

  await next();

  console.log({
    type: "response",
    requestId,
    status: c.res.status,
    duration: Date.now() - start,
  });
});

app.use(requestLogger);
```

## Middleware Composition

### Order Matters

Middleware runs in order of definition:

```typescript
// 1. Logging (runs first)
app.use(logger());

// 2. CORS
app.use("/api/*", cors());

// 3. Authentication
app.use("/api/*", authMiddleware);

// 4. Rate limiting
app.use("/api/*", rateLimiter);

// 5. Routes (run last)
app.get("/api/users", (c) => c.json([]));
```

### Conditional Middleware

```typescript
// Only for specific paths
app.use("/admin/*", adminAuth);
app.use("/api/public/*", publicRateLimiter);
app.use("/api/private/*", privateRateLimiter, authMiddleware);
```

### Composing Multiple Middleware

```typescript
import { every, some } from "hono/combine";

// All must pass (AND)
app.use("/api/*", every(cors(), authMiddleware, rateLimiter));

// Any can pass (OR)
app.use("/api/*", some(apiKeyAuth, jwtAuth));
```

## Error Handling Middleware

```typescript
app.onError((err, c) => {
  console.error("Error:", err);

  // Handle known error types
  if (err instanceof HTTPException) {
    return err.getResponse();
  }

  if (err instanceof ZodError) {
    return c.json({ error: "Validation error", issues: err.issues }, 400);
  }

  // Generic error
  return c.json(
    {
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    },
    500
  );
});
```

## Testing Middleware

```typescript
import { testClient } from "hono/testing";

describe("Auth Middleware", () => {
  it("should reject requests without token", async () => {
    const app = new Hono().use(authMiddleware).get("/", (c) => c.text("OK"));
    const client = testClient(app);

    const res = await client.index.$get();
    expect(res.status).toBe(401);
  });

  it("should accept valid tokens", async () => {
    const app = new Hono().use(authMiddleware).get("/", (c) => c.text("OK"));
    const client = testClient(app);

    const res = await client.index.$get(undefined, {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(200);
  });
});
```

## Built-in Middleware Reference

| Middleware | Import | Purpose |
|------------|--------|---------|
| Logger | `hono/logger` | Request logging |
| CORS | `hono/cors` | Cross-origin requests |
| JWT | `hono/jwt` | JWT authentication |
| Basic Auth | `hono/basic-auth` | Basic authentication |
| Bearer Auth | `hono/bearer-auth` | Bearer token auth |
| Compress | `hono/compress` | Response compression |
| Cache | `hono/cache` | Response caching |
| Secure Headers | `hono/secure-headers` | Security headers |
| Timeout | `hono/timeout` | Request timeout |
| CSRF | `hono/csrf` | CSRF protection |
| ETag | `hono/etag` | ETag support |
| Trailing Slash | `hono/trailing-slash` | Normalize slashes |

## Next Steps

- [Zod Integration](../validation/zod-integration.md) - Cross-stack validation
- [Hono RPC](hono-rpc.md) - Type-safe client-server
- [Hono Streaming](hono-streaming.md) - SSE and streaming
