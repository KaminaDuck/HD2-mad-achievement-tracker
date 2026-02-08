---
title: "Hono Streaming Helper"
description: "Complete guide to streaming responses in Hono - text streaming, SSE, and binary streams"
type: "reference"
tags: ["hono", "streaming", "sse", "server-sent-events", "typescript"]
category: "typescript"
subcategory: "web-framework"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Hono Streaming Helper"
    url: "https://hono.dev/docs/helpers/streaming"
related:
  - "../README.md"
  - "../api/context.md"
author: "unknown"
contributors: []
parent_reference: "../README.md"
---

# Hono Streaming Helper

The Streaming Helper provides methods for streaming responses, including text streams, binary data, and Server-Sent Events (SSE).

## Import

```typescript
import { Hono } from 'hono'
import { stream, streamText, streamSSE } from 'hono/streaming'
```

## `stream()`

Returns a simple streaming response:

```typescript
app.get('/stream', (c) => {
  return stream(c, async (stream) => {
    // Handle abort
    stream.onAbort(() => {
      console.log('Aborted!')
    })

    // Write binary data
    await stream.write(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]))

    // Pipe from another stream
    await stream.pipe(anotherReadableStream)
  })
})
```

### Stream Methods

| Method | Description |
|--------|-------------|
| `stream.write(data)` | Write Uint8Array or string |
| `stream.pipe(readable)` | Pipe from a ReadableStream |
| `stream.onAbort(callback)` | Handle client disconnect |
| `stream.close()` | Close the stream (usually automatic) |

## `streamText()`

Returns a streaming response with appropriate headers for text:
- `Content-Type: text/plain`
- `Transfer-Encoding: chunked`
- `X-Content-Type-Options: nosniff`

```typescript
app.get('/streamText', (c) => {
  return streamText(c, async (stream) => {
    // Write text with newline
    await stream.writeln('Hello')

    // Wait 1 second
    await stream.sleep(1000)

    // Write text without newline
    await stream.write('World!')
  })
})
```

### Text Stream Methods

| Method | Description |
|--------|-------------|
| `stream.write(text)` | Write text |
| `stream.writeln(text)` | Write text with newline (`\n`) |
| `stream.sleep(ms)` | Pause for milliseconds |
| `stream.onAbort(callback)` | Handle client disconnect |

### Cloudflare Workers Note

If streaming doesn't work in Wrangler, add `Content-Encoding: Identity` header:

```typescript
app.get('/streamText', (c) => {
  c.header('Content-Encoding', 'Identity')
  return streamText(c, async (stream) => {
    await stream.writeln('Hello')
    await stream.sleep(1000)
    await stream.writeln('World!')
  })
})
```

## `streamSSE()`

Stream Server-Sent Events (SSE) seamlessly:

```typescript
let id = 0

app.get('/sse', (c) => {
  return streamSSE(c, async (stream) => {
    while (true) {
      const message = `It is ${new Date().toISOString()}`

      await stream.writeSSE({
        data: message,
        event: 'time-update',
        id: String(id++),
      })

      await stream.sleep(1000)
    }
  })
})
```

### SSE Message Format

```typescript
interface SSEMessage {
  data: string      // Required: event data
  event?: string    // Optional: event type
  id?: string       // Optional: event ID
  retry?: number    // Optional: reconnection time in ms
}
```

### SSE Client Example

```javascript
// Browser client
const eventSource = new EventSource('/sse')

eventSource.addEventListener('time-update', (event) => {
  console.log('Time:', event.data)
  console.log('ID:', event.lastEventId)
})

eventSource.onerror = (error) => {
  console.error('SSE error:', error)
}
```

## Error Handling

The third argument is an optional error handler:

```typescript
app.get('/stream', (c) => {
  return stream(
    c,
    async (stream) => {
      stream.onAbort(() => {
        console.log('Aborted!')
      })

      await stream.write(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]))
      await stream.pipe(anotherReadableStream)
    },
    (err, stream) => {
      // Error handler
      stream.writeln('An error occurred!')
      console.error(err)
    }
  )
})
```

The stream closes automatically after callbacks complete.

> **Warning**: If the streaming callback throws an error, `app.onError` will NOT be triggered. The `onError` hook handles errors before the response is sent, but once streaming starts, the response cannot be overwritten.

## Common Patterns

### AI/LLM Streaming

```typescript
app.post('/chat', async (c) => {
  const { prompt } = await c.req.json()

  return streamText(c, async (stream) => {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    })

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || ''
      await stream.write(content)
    }
  })
})
```

### File Download Progress

```typescript
app.get('/download/:file', async (c) => {
  const file = c.req.param('file')
  const fileStream = await getFileStream(file)

  return stream(c, async (stream) => {
    await stream.pipe(fileStream)
  })
})
```

### Real-time Updates with SSE

```typescript
// Store for connected clients
const clients = new Set<WritableStreamDefaultWriter>()

app.get('/events', (c) => {
  return streamSSE(c, async (stream) => {
    const writer = stream.raw.getWriter()
    clients.add(writer)

    stream.onAbort(() => {
      clients.delete(writer)
    })

    // Keep connection alive
    while (true) {
      await stream.sleep(30000)
      await stream.writeSSE({ data: 'ping', event: 'heartbeat' })
    }
  })
})

// Broadcast to all clients
async function broadcast(event: string, data: string) {
  for (const client of clients) {
    try {
      await client.write(`event: ${event}\ndata: ${data}\n\n`)
    } catch {
      clients.delete(client)
    }
  }
}
```

### Progressive Data Loading

```typescript
app.get('/data', (c) => {
  return streamText(c, async (stream) => {
    const items = await getItems()

    for (const item of items) {
      const processed = await processItem(item)
      await stream.writeln(JSON.stringify(processed))

      // Small delay to not overwhelm client
      await stream.sleep(10)
    }
  })
})
```

### Chunked JSON Streaming

```typescript
app.get('/json-stream', (c) => {
  return stream(c, async (stream) => {
    c.header('Content-Type', 'application/json')

    await stream.write('[')

    const items = await fetchManyItems()
    for (let i = 0; i < items.length; i++) {
      if (i > 0) await stream.write(',')
      await stream.write(JSON.stringify(items[i]))
    }

    await stream.write(']')
  })
})
```

## Complete Example

```typescript
import { Hono } from 'hono'
import { stream, streamText, streamSSE } from 'hono/streaming'

const app = new Hono()

// Binary stream
app.get('/binary', (c) => {
  return stream(c, async (stream) => {
    const data = new Uint8Array([0x00, 0x01, 0x02, 0x03])
    await stream.write(data)
  })
})

// Text stream with delay
app.get('/text', (c) => {
  return streamText(c, async (stream) => {
    const words = ['Hello', 'streaming', 'world!']

    for (const word of words) {
      await stream.writeln(word)
      await stream.sleep(500)
    }
  })
})

// SSE for real-time updates
let messageId = 0

app.get('/sse', (c) => {
  return streamSSE(c, async (stream) => {
    stream.onAbort(() => {
      console.log('Client disconnected')
    })

    // Send initial data
    await stream.writeSSE({
      data: JSON.stringify({ connected: true }),
      event: 'connect',
      id: String(messageId++),
    })

    // Send periodic updates
    while (true) {
      await stream.sleep(2000)
      await stream.writeSSE({
        data: JSON.stringify({ time: Date.now() }),
        event: 'update',
        id: String(messageId++),
      })
    }
  })
})

// Error handling
app.get('/with-error-handler', (c) => {
  return streamText(
    c,
    async (stream) => {
      await stream.writeln('Starting...')
      throw new Error('Something went wrong')
    },
    (err, stream) => {
      stream.writeln(`Error: ${err.message}`)
    }
  )
})

export default app
```

---

**Source**: [hono.dev/docs/helpers/streaming](https://hono.dev/docs/helpers/streaming)
