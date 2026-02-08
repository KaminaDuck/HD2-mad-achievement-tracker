---
title: "Hono with Bun Runtime"
description: "Complete guide to running Hono web framework with Bun JavaScript runtime"
type: "reference"
tags: ["hono", "bun", "typescript", "web-framework", "runtime", "static-files", "testing"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Bun Documentation"
    url: "https://hono.dev/docs/getting-started/bun"
related:
  - "../README.md"
  - "../api/hono-app.md"
  - "./testing.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono with Bun Runtime

[Bun](https://bun.sh/) is a fast JavaScript runtime with a built-in transpiler, bundler, and package manager. Hono works seamlessly with Bun, providing excellent performance and developer experience.

## Setup

### New Project

Create a new Hono project with Bun using the starter template:

```bash
bun create hono@latest my-app
```

Move into the directory and install dependencies:

```bash
cd my-app
bun install
```

### Existing Project

Add Hono to an existing Bun project:

```bash
bun add hono
```

Add the dev script to `package.json`:

```json
{
  "scripts": {
    "dev": "bun run --hot src/index.ts"
  }
}
```

## Hello World

Create `src/index.ts`:

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello Bun!'))

export default app
```

Run the development server:

```bash
bun run dev
```

Access `http://localhost:3000` in your browser.

## Change Port Number

Export a port configuration alongside your app:

```typescript
import { Hono } from 'hono'

const app = new Hono()

app.get('/', (c) => c.text('Hello Bun!'))

export default {
  port: 3000,
  fetch: app.fetch,
}
```

## Serve Static Files

Use `serveStatic` from `hono/bun` to serve static files:

```typescript
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'

const app = new Hono()

// Serve files from ./static directory at /static/*
app.use('/static/*', serveStatic({ root: './' }))

// Serve specific file
app.use('/favicon.ico', serveStatic({ path: './favicon.ico' }))

// Fallback for unmatched routes
app.get('*', serveStatic({ path: './static/fallback.txt' }))

app.get('/', (c) => c.text('You can access: /static/hello.txt'))

export default app
```

### Directory Structure

```
./
├── favicon.ico
├── src/
│   └── index.ts
└── static/
    ├── demo/
    │   └── index.html
    ├── fallback.txt
    ├── hello.txt
    └── images/
        └── logo.png
```

### Static File Options

#### `rewriteRequestPath`

Map request paths to different file paths:

```typescript
app.get(
  '/static/*',
  serveStatic({
    root: './',
    rewriteRequestPath: (path) =>
      path.replace(/^\/static/, '/statics'),
  })
)
```

#### `mimes`

Add custom MIME types:

```typescript
app.get(
  '/static/*',
  serveStatic({
    mimes: {
      m3u8: 'application/vnd.apple.mpegurl',
      ts: 'video/mp2t',
    },
  })
)
```

#### `onFound`

Execute callback when file is found:

```typescript
app.get(
  '/static/*',
  serveStatic({
    onFound: (_path, c) => {
      c.header('Cache-Control', 'public, immutable, max-age=31536000')
    },
  })
)
```

#### `onNotFound`

Execute callback when file is not found:

```typescript
app.get(
  '/static/*',
  serveStatic({
    onNotFound: (path, c) => {
      console.log(`${path} is not found, you access ${c.req.path}`)
    },
  })
)
```

#### `precompressed`

Serve pre-compressed files (.br, .gz) based on Accept-Encoding:

```typescript
app.get(
  '/static/*',
  serveStatic({
    precompressed: true,
  })
)
```

Prioritizes: Brotli (.br) > Zstd > Gzip (.gz) > Original

## Testing with Bun

Use `bun:test` for testing Hono applications:

```typescript
// index.test.ts
import { describe, expect, it } from 'bun:test'
import app from './index'

describe('My first test', () => {
  it('Should return 200 Response', async () => {
    const req = new Request('http://localhost/')
    const res = await app.fetch(req)
    expect(res.status).toBe(200)
  })

  it('Should return correct text', async () => {
    const req = new Request('http://localhost/')
    const res = await app.fetch(req)
    expect(await res.text()).toBe('Hello Bun!')
  })
})
```

Run tests:

```bash
bun test index.test.ts
```

### Using app.request()

Hono provides a convenient `app.request()` method for testing:

```typescript
import { describe, expect, it } from 'bun:test'
import app from './index'

describe('API Tests', () => {
  it('GET /posts returns 200', async () => {
    const res = await app.request('/posts')
    expect(res.status).toBe(200)
  })

  it('POST /posts creates item', async () => {
    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Hello' }),
      headers: { 'Content-Type': 'application/json' },
    })
    expect(res.status).toBe(201)
  })
})
```

## Environment Variables

Access environment variables in Bun:

```typescript
import { Hono } from 'hono'

type Bindings = {
  DATABASE_URL: string
  API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/config', (c) => {
  // Access via Bun.env or c.env
  const dbUrl = Bun.env.DATABASE_URL
  return c.json({ configured: !!dbUrl })
})

export default app
```

## WebSocket Support

Bun has native WebSocket support with Hono:

```typescript
import { Hono } from 'hono'
import { upgradeWebSocket, websocket } from 'hono/bun'

const app = new Hono()

app.get(
  '/ws',
  upgradeWebSocket((c) => {
    return {
      onOpen(event, ws) {
        console.log('Connection opened')
        ws.send('Welcome!')
      },
      onMessage(event, ws) {
        console.log(`Message: ${event.data}`)
        ws.send(`Echo: ${event.data}`)
      },
      onClose() {
        console.log('Connection closed')
      },
    }
  })
)

export default {
  fetch: app.fetch,
  websocket,
}
```

## Production Deployment

### Build for Production

```bash
bun build src/index.ts --outdir ./dist --target bun
```

### Run Production Server

```bash
bun run dist/index.js
```

### Docker Deployment

```dockerfile
FROM oven/bun:1

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

EXPOSE 3000

CMD ["bun", "run", "src/index.ts"]
```

## Best Practices for Bun

1. **Use Hot Reload**: Use `bun run --hot` for development
2. **Leverage Bun's Speed**: Bun is optimized for startup time
3. **Native TypeScript**: No separate compilation step needed
4. **Use bun:test**: Native testing without additional dependencies
5. **Static Files**: Use `serveStatic` from `hono/bun` for optimal performance

## Common Patterns

### JSON API

```typescript
import { Hono } from 'hono'

const app = new Hono()

interface Post {
  id: number
  title: string
  body: string
}

const posts: Post[] = []

app.get('/api/posts', (c) => c.json(posts))

app.post('/api/posts', async (c) => {
  const body = await c.req.json<Omit<Post, 'id'>>()
  const post: Post = { id: posts.length + 1, ...body }
  posts.push(post)
  return c.json(post, 201)
})

app.get('/api/posts/:id', (c) => {
  const id = parseInt(c.req.param('id'))
  const post = posts.find((p) => p.id === id)
  if (!post) return c.json({ error: 'Not found' }, 404)
  return c.json(post)
})

export default app
```

### With Middleware

```typescript
import { Hono } from 'hono'
import { logger } from 'hono/logger'
import { cors } from 'hono/cors'
import { compress } from 'hono/compress'

const app = new Hono()

app.use(logger())
app.use(cors())
app.use(compress())

app.get('/', (c) => c.text('Hello with middleware!'))

export default app
```

---

**Source**: [hono.dev/docs/getting-started/bun](https://hono.dev/docs/getting-started/bun)
