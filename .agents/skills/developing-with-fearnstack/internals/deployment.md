---
title: Deployment
description: Deploying Fearnstack applications to production
---

# Deployment

This guide covers deploying Fearnstack applications to production, from building to monitoring.

## Deployment Overview

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│    Build     │───▶│    Deploy    │───▶│   Monitor    │
│              │    │              │    │              │
│ bun build    │    │ Docker/Cloud │    │ Logs/Metrics │
└──────────────┘    └──────────────┘    └──────────────┘
```

## Building for Production

### Frontend Build

```typescript
// build-client.ts
const result = await Bun.build({
  entrypoints: ["./src/client/main.tsx"],
  outdir: "./dist/client",
  target: "browser",
  splitting: true,
  minify: true,
  sourcemap: "external",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.API_URL": JSON.stringify(process.env.API_URL),
  },
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

console.log("Built:", result.outputs.map((o) => o.path));
```

### Server Build

```typescript
// build-server.ts
const result = await Bun.build({
  entrypoints: ["./src/server/index.ts"],
  outdir: "./dist/server",
  target: "bun",
  minify: true,
  sourcemap: "external",
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}
```

### Build Script

```json
// package.json
{
  "scripts": {
    "build": "bun run build:client && bun run build:server",
    "build:client": "bun run ./scripts/build-client.ts",
    "build:server": "bun run ./scripts/build-server.ts",
    "start": "NODE_ENV=production bun run ./dist/server/index.js"
  }
}
```

## Environment Variables

### Configuration

```typescript
// src/server/config.ts
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_URL: z.string().url().optional(),
});

export const config = envSchema.parse(process.env);

// Usage
import { config } from "./config";
console.log(`Starting on port ${config.PORT}`);
```

### Environment Files

```bash
# .env.production
NODE_ENV=production
PORT=3001
DATABASE_URL=postgres://user:pass@db:5432/myapp
JWT_SECRET=your-super-secret-key-at-least-32-chars
API_URL=https://api.myapp.com
```

## Server Deployment

### Running Hono on Bun

```typescript
// src/server/serve.ts
import app from "./index";

const server = Bun.serve({
  port: process.env.PORT || 3001,
  fetch: app.fetch,

  // Production settings
  development: process.env.NODE_ENV !== "production",

  // Error handling
  error(error) {
    console.error("Server error:", error);
    return new Response("Internal Server Error", { status: 500 });
  },
});

console.log(`Server running on port ${server.port}`);
```

### Health Checks

```typescript
// src/server/routes/health.ts
import { Hono } from "hono";

const health = new Hono()
  .get("/", (c) => c.json({ status: "ok" }))
  .get("/ready", async (c) => {
    try {
      // Check database
      await db.$queryRaw`SELECT 1`;
      return c.json({ status: "ready" });
    } catch {
      return c.json({ status: "not ready" }, 503);
    }
  })
  .get("/live", (c) => c.json({ status: "alive" }));

export { health };

// Mount at /health
app.route("/health", health);
```

### Process Management

```bash
# Using PM2 (optional, Bun has its own process handling)
pm2 start --interpreter ~/.bun/bin/bun dist/server/index.js --name myapp

# Or use systemd
# /etc/systemd/system/myapp.service
[Unit]
Description=My Fearnstack App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/myapp
ExecStart=/home/user/.bun/bin/bun run dist/server/index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

## Static Asset Deployment

### Serving Static Files

```typescript
// src/server/index.ts
import { serveStatic } from "hono/bun";

// Serve client assets
app.use("/assets/*", serveStatic({ root: "./dist/client" }));

// Serve index.html for SPA routes
app.get("*", serveStatic({ path: "./dist/client/index.html" }));
```

### CDN Configuration

```typescript
// With Cloudflare or other CDN
app.use("*", async (c, next) => {
  await next();

  // Add cache headers for static assets
  if (c.req.path.startsWith("/assets/")) {
    c.res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  }
});
```

## Docker Deployment

### Dockerfile

```dockerfile
# Dockerfile
FROM oven/bun:1 AS builder

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build
RUN bun run build

# Production image
FROM oven/bun:1-slim

WORKDIR /app

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Install production dependencies only
RUN bun install --production --frozen-lockfile

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

EXPOSE 3001

CMD ["bun", "run", "dist/server/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:password@db:5432/myapp
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

### Multi-Stage Build

```dockerfile
# Optimized multi-stage build
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs
USER bunjs

COPY --from=builder --chown=bunjs:nodejs /app/dist ./dist
COPY --from=builder --chown=bunjs:nodejs /app/package.json ./

RUN bun install --production

EXPOSE 3001
CMD ["bun", "run", "dist/server/index.js"]
```

## Cloud Platforms

### Fly.io

```toml
# fly.toml
app = "my-fearnstack-app"
primary_region = "sjc"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3001
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 1

[[services]]
  internal_port = 3001
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    path = "/health"
    interval = "10s"
    timeout = "2s"
```

```bash
# Deploy
fly launch
fly deploy
fly secrets set JWT_SECRET=xxx DATABASE_URL=xxx
```

### Railway

```json
// railway.json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "startCommand": "bun run dist/server/index.js",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

### Vercel Edge

```typescript
// For edge deployment, use Hono's Vercel adapter
import { Hono } from "hono";
import { handle } from "hono/vercel";

const app = new Hono().basePath("/api");

// Routes...

export const GET = handle(app);
export const POST = handle(app);
```

## Monitoring and Logging

### Structured Logging

```typescript
// src/server/lib/logger.ts
interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  [key: string]: unknown;
}

export function log(level: LogEntry["level"], message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...data,
  };

  console.log(JSON.stringify(entry));
}

// Usage
log("info", "Request handled", { path: "/api/users", duration: 45 });
log("error", "Database error", { error: err.message, query: "SELECT..." });
```

### Request Logging Middleware

```typescript
// src/server/middleware/logging.ts
export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();
  const requestId = crypto.randomUUID();

  c.set("requestId", requestId);

  await next();

  const duration = Date.now() - start;

  log("info", "Request completed", {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration,
  });
}
```

### Error Tracking

```typescript
// src/server/lib/errorTracking.ts
export function captureError(error: Error, context?: Record<string, unknown>) {
  // Console for local/simple
  console.error("Error captured:", {
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // Send to error tracking service (Sentry, etc.)
  // Sentry.captureException(error, { extra: context });
}

// Global error handler
app.onError((err, c) => {
  captureError(err as Error, {
    path: c.req.path,
    method: c.req.method,
  });

  return c.json({ error: "Internal server error" }, 500);
});
```

### Performance Monitoring

```typescript
// Basic performance metrics
const metrics = {
  requestCount: 0,
  errorCount: 0,
  totalDuration: 0,
};

app.use("*", async (c, next) => {
  metrics.requestCount++;
  const start = Date.now();

  await next();

  metrics.totalDuration += Date.now() - start;
  if (c.res.status >= 400) metrics.errorCount++;
});

// Metrics endpoint
app.get("/metrics", (c) => {
  return c.json({
    requests: metrics.requestCount,
    errors: metrics.errorCount,
    avgDuration: metrics.totalDuration / metrics.requestCount,
  });
});
```

## Deployment Checklist

| Step | Description |
|------|-------------|
| Build | Run `bun run build` |
| Environment | Set all required env vars |
| Health check | Verify `/health` endpoint |
| Database | Run migrations |
| Static assets | Configure CDN/caching |
| HTTPS | Ensure TLS configured |
| Logs | Verify logging works |
| Monitoring | Set up error tracking |
| Backups | Configure database backups |
| Scaling | Set auto-scaling rules |

## Related Docs

- [Bun Bundler](../domains/runtime/bun-bundler.md) - Build configuration
- [Hono Fundamentals](../domains/backend/hono-fundamentals.md) - Server setup
- [Performance](./performance.md) - Optimization
- [Testing Strategies](./testing-strategies.md) - CI/CD tests
