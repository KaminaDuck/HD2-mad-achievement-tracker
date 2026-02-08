---
title: Hono Streaming
description: Server-Sent Events and streaming responses for real-time features
---

# Hono Streaming

Hono provides streaming helpers for real-time responses including Server-Sent Events (SSE), text streaming for LLMs, and binary data streams.

## Import

```typescript
import { stream, streamText, streamSSE } from "hono/streaming";
```

## Server-Sent Events (SSE)

The most common pattern for real-time updates:

```typescript
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";

const app = new Hono();

let eventId = 0;

app.get("/events", (c) => {
  return streamSSE(c, async (stream) => {
    // Handle client disconnect
    stream.onAbort(() => {
      console.log("Client disconnected");
    });

    // Send events
    while (true) {
      await stream.writeSSE({
        data: JSON.stringify({ time: Date.now() }),
        event: "time-update",
        id: String(eventId++),
      });

      await stream.sleep(1000);
    }
  });
});
```

### SSE Message Format

```typescript
interface SSEMessage {
  data: string;      // Required: event data
  event?: string;    // Optional: event type (defaults to "message")
  id?: string;       // Optional: event ID for reconnection
  retry?: number;    // Optional: reconnection time in ms
}
```

### Client-Side Consumption

```typescript
// Browser
const eventSource = new EventSource("/events");

eventSource.addEventListener("time-update", (event) => {
  const data = JSON.parse(event.data);
  console.log("Time:", data.time);
});

eventSource.onerror = (error) => {
  console.error("SSE error:", error);
  // Browser auto-reconnects by default
};

// Cleanup
eventSource.close();
```

### React Hook for SSE

```typescript
function useSSE<T>(url: string, event = "message") {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(url);

    eventSource.addEventListener(event, (e) => {
      setData(JSON.parse(e.data));
    });

    eventSource.onerror = () => {
      setError(new Error("SSE connection failed"));
    };

    return () => eventSource.close();
  }, [url, event]);

  return { data, error };
}

// Usage
function LiveTime() {
  const { data } = useSSE<{ time: number }>("/events", "time-update");
  return <div>Time: {data?.time}</div>;
}
```

## Text Streaming

For LLM responses and progressive text output:

```typescript
import { streamText } from "hono/streaming";

app.post("/chat", async (c) => {
  const { prompt } = await c.req.json();

  return streamText(c, async (stream) => {
    stream.onAbort(() => {
      console.log("Stream aborted");
    });

    // Simulate LLM response
    const words = ["Hello", " ", "from", " ", "Fearnstack", "!"];

    for (const word of words) {
      await stream.write(word);
      await stream.sleep(100);
    }
  });
});
```

### Text Stream Methods

| Method | Description |
|--------|-------------|
| `stream.write(text)` | Write text chunk |
| `stream.writeln(text)` | Write text with newline |
| `stream.sleep(ms)` | Pause for milliseconds |
| `stream.onAbort(callback)` | Handle client disconnect |

### With OpenAI/LLM APIs

```typescript
app.post("/chat", async (c) => {
  const { messages } = await c.req.json();

  return streamText(c, async (stream) => {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      stream: true,
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content || "";
      await stream.write(content);
    }
  });
});
```

## Integration with TanStack AI

TanStack AI provides a cleaner streaming API:

```typescript
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

app.post("/api/chat", async (c) => {
  const { messages } = await c.req.json();

  const adapter = openai({ apiKey: process.env.OPENAI_API_KEY! });

  const aiStream = chat({
    adapter,
    model: "gpt-4o",
    messages,
  });

  return toStreamResponse(aiStream);
});
```

## Binary Streaming

For file downloads and binary data:

```typescript
import { stream } from "hono/streaming";

app.get("/download/:file", async (c) => {
  const filename = c.req.param("file");
  const file = Bun.file(`./uploads/${filename}`);

  c.header("Content-Type", file.type);
  c.header("Content-Disposition", `attachment; filename="${filename}"`);

  return stream(c, async (s) => {
    const readable = file.stream();
    await s.pipe(readable);
  });
});
```

### Stream Methods

| Method | Description |
|--------|-------------|
| `stream.write(data)` | Write Uint8Array or string |
| `stream.pipe(readable)` | Pipe from ReadableStream |
| `stream.onAbort(callback)` | Handle client disconnect |
| `stream.close()` | Close stream (usually automatic) |

## Error Handling

Handle errors gracefully during streaming:

```typescript
app.get("/stream", (c) => {
  return streamText(
    c,
    async (stream) => {
      await stream.writeln("Starting...");

      // This might throw
      await riskyOperation();

      await stream.writeln("Done!");
    },
    (err, stream) => {
      // Error handler - called if callback throws
      stream.writeln(`Error: ${err.message}`);
      console.error("Stream error:", err);
    }
  );
});
```

**Important:** Once streaming starts, `app.onError` will NOT be triggered for errors in the stream callback. Handle errors in the optional third argument.

## Real-Time Notifications

Broadcast events to multiple clients:

```typescript
// Store connected clients
const clients = new Map<string, { write: (msg: string) => Promise<void> }>();

app.get("/notifications", (c) => {
  const clientId = crypto.randomUUID();

  return streamSSE(c, async (stream) => {
    clients.set(clientId, {
      write: (msg) =>
        stream.writeSSE({ data: msg, event: "notification", id: clientId }),
    });

    stream.onAbort(() => {
      clients.delete(clientId);
    });

    // Keep connection alive
    while (true) {
      await stream.sleep(30000);
      await stream.writeSSE({ data: "ping", event: "heartbeat" });
    }
  });
});

// Broadcast to all clients
async function broadcast(message: string) {
  const promises = Array.from(clients.values()).map((client) =>
    client.write(message).catch(() => {})
  );
  await Promise.all(promises);
}

// Trigger broadcasts from other routes
app.post("/api/posts", async (c) => {
  const post = await createPost(await c.req.json());
  await broadcast(JSON.stringify({ type: "new_post", post }));
  return c.json(post, 201);
});
```

## Progress Updates

Stream progress for long-running operations:

```typescript
app.post("/api/import", async (c) => {
  const { items } = await c.req.json();

  return streamSSE(c, async (stream) => {
    const total = items.length;

    for (let i = 0; i < total; i++) {
      await processItem(items[i]);

      await stream.writeSSE({
        data: JSON.stringify({
          current: i + 1,
          total,
          percent: Math.round(((i + 1) / total) * 100),
        }),
        event: "progress",
      });
    }

    await stream.writeSSE({
      data: JSON.stringify({ complete: true }),
      event: "done",
    });
  });
});
```

## Chunked JSON Streaming

Stream large JSON arrays progressively:

```typescript
app.get("/api/large-dataset", (c) => {
  return stream(c, async (s) => {
    c.header("Content-Type", "application/json");

    await s.write("[");

    const items = await fetchLargeDataset();
    for (let i = 0; i < items.length; i++) {
      if (i > 0) await s.write(",");
      await s.write(JSON.stringify(items[i]));

      // Yield to prevent blocking
      if (i % 100 === 0) await s.sleep(1);
    }

    await s.write("]");
  });
});
```

## Complete Example

```typescript
import { Hono } from "hono";
import { streamSSE, streamText } from "hono/streaming";

const app = new Hono();

// SSE for real-time updates
let messageId = 0;

app.get("/sse", (c) => {
  return streamSSE(c, async (stream) => {
    stream.onAbort(() => console.log("Client disconnected"));

    // Initial connection
    await stream.writeSSE({
      data: JSON.stringify({ connected: true }),
      event: "connect",
      id: String(messageId++),
    });

    // Periodic updates
    while (true) {
      await stream.sleep(2000);
      await stream.writeSSE({
        data: JSON.stringify({ time: Date.now() }),
        event: "update",
        id: String(messageId++),
      });
    }
  });
});

// Text streaming for chat
app.post("/chat", async (c) => {
  const { prompt } = await c.req.json();

  return streamText(c, async (stream) => {
    const response = await generateAIResponse(prompt);

    for await (const chunk of response) {
      await stream.write(chunk);
    }
  });
});

export default app;
```

## Next Steps

- [TanStack AI](../frontend/tanstack-ai.md) - AI integration with streaming
- [AI Streaming](../../integration/ai-streaming.md) - Complete AI patterns
- [Hono RPC](hono-rpc.md) - Type-safe API calls
