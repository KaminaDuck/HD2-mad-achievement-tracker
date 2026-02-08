---
title: "TanStack AI Streaming Guide"
description: "Real-time streaming with async iterables and connection adapters"
type: "concept-guide"
tags: ["tanstack", "ai", "streaming", "sse", "server-sent-events", "async-iterables", "real-time"]
category: "typescript"
subcategory: "ai"
version: "0.1"
last_updated: "2025-12-05"
status: "stable"
sources:
  - name: "TanStack AI Streaming Guide"
    url: "https://tanstack.com/ai/latest/docs/guides/streaming"
  - name: "TanStack AI Overview"
    url: "https://tanstack.com/ai/latest/docs/getting-started/overview"
related: ["overview.md", "tools-guide.md", "react-guide.md", "adapters.md"]
author: "unknown"
contributors: []
---

# TanStack AI Streaming Guide

TanStack AI uses async iterables for streaming responses, providing a natural JavaScript pattern for processing data as it arrives. This guide covers streaming implementation, event types, and integration patterns. ([TanStack AI Streaming Guide][1])

## Core Streaming Implementation

The `chat()` function returns an async iterable of stream chunks that arrive progressively from the LLM: ([TanStack AI Streaming Guide][1])

```typescript
import { chat } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

const stream = chat({
  adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
  messages: [{ role: "user", content: "Hello!" }],
  model: "gpt-4o",
});

for await (const chunk of stream) {
  console.log(chunk);
}
```

## Stream Chunk Types

Stream chunks include several data categories: ([TanStack AI Streaming Guide][1])

| Chunk Type | Description |
|------------|-------------|
| Content chunks | Generated text incrementally |
| Thinking chunks | Model's internal reasoning (when supported) |
| Tool call chunks | Model function invocations |
| Tool result chunks | Function execution outcomes |
| Done chunks | Stream completion signals |

### Processing Different Chunk Types

```typescript
for await (const chunk of stream) {
  switch (chunk.type) {
    case "content":
      // Text content arriving
      process.stdout.write(chunk.delta);
      break;

    case "thinking":
      // Model reasoning (Claude extended thinking)
      console.log("Thinking:", chunk.delta);
      break;

    case "tool-call":
      // Tool invocation request
      console.log("Tool call:", chunk.name, chunk.args);
      break;

    case "tool-result":
      // Tool execution result
      console.log("Tool result:", chunk.result);
      break;

    case "done":
      // Stream completed
      console.log("\nStream finished");
      break;
  }
}
```

## Thinking Chunks

Thinking chunks represent the model's reasoning process and stream independently from the final response text. They are: ([TanStack AI Streaming Guide][1])

- Automatically converted to `ThinkingPart` objects in UI messages
- Excluded from subsequent model communications
- Displayed as collapsible sections in the UI

```typescript
// Claude with extended thinking
const stream = chat({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
  messages,
  model: "claude-3-5-sonnet-20241022",
  providerOptions: {
    thinking: {
      type: "enabled",
      budgetTokens: 2048,
    },
  },
});

for await (const chunk of stream) {
  if (chunk.type === "thinking") {
    // Display thinking in a separate UI section
    updateThinkingDisplay(chunk.delta);
  } else if (chunk.type === "content") {
    // Display main response
    updateResponseDisplay(chunk.delta);
  }
}
```

## Stream Conversion Utilities

### toStreamResponse()

The `toStreamResponse()` function converts a stream into an HTTP Response with appropriate Server-Sent Events (SSE) headers for seamless server integration: ([TanStack AI Streaming Guide][1])

```typescript
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
    model: "gpt-4o",
    messages,
  });

  return toStreamResponse(stream);
}
```

The function:
- Sets proper `Content-Type: text/event-stream` headers
- Handles SSE formatting automatically
- Manages stream cleanup and error handling

### Optional Response Init

Pass additional response options:

```typescript
return toStreamResponse(stream, {
  headers: {
    "X-Custom-Header": "value",
  },
});
```

## Connection Adapters

TanStack AI supports three primary connection protocols for client-side consumption: ([TanStack AI Streaming Guide][1])

### Server-Sent Events (SSE)

The recommended approach for most applications:

```typescript
import { fetchServerSentEvents } from "@tanstack/ai-client";

const connection = fetchServerSentEvents("/api/chat");
```

### HTTP Stream

For environments where SSE isn't available:

```typescript
import { fetchHttpStream } from "@tanstack/ai-client";

const connection = fetchHttpStream("/api/chat");
```

### Custom Streams

For specialized implementations:

```typescript
import { stream } from "@tanstack/ai-client";

const connection = stream((messages) => {
  // Custom stream implementation
  return customStreamFunction(messages);
});
```

## Framework Integration Patterns

### Next.js App Router

```typescript
// app/api/chat/route.ts
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
    model: "gpt-4o",
    messages,
  });

  return toStreamResponse(stream);
}
```

### Express

```typescript
import express from "express";
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

const app = express();
app.use(express.json());

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
    model: "gpt-4o",
    messages,
  });

  const response = toStreamResponse(stream);

  // Forward headers
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });

  // Pipe the body
  const reader = response.body?.getReader();
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  }
});
```

### TanStack Start

```typescript
// routes/api/chat.ts
import { json } from "@tanstack/start";
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

export const POST = async ({ request }) => {
  const { messages } = await request.json();

  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
    model: "gpt-4o",
    messages,
  });

  return toStreamResponse(stream);
};
```

## Client-Side Streaming

### React Integration

The `useChat` hook handles streaming automatically:

```typescript
import { useChat } from "@tanstack/ai-react";
import { fetchServerSentEvents } from "@tanstack/ai-client";

function ChatComponent() {
  const { messages, input, setInput, submit, isStreaming } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>{message.content}</div>
      ))}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={submit} disabled={isStreaming}>
        Send
      </button>
    </div>
  );
}
```

### Stream Callbacks

Monitor streaming progress with callbacks: ([TanStack AI Streaming Guide][1])

```typescript
const { messages } = useChat({
  connection: fetchServerSentEvents("/api/chat"),
  onChunk: (chunk) => {
    // Called for each streaming chunk
    console.log("Chunk received:", chunk);
  },
  onFinish: (message) => {
    // Called when stream completes
    console.log("Message complete:", message);
  },
  onError: (error) => {
    // Called on streaming error
    console.error("Stream error:", error);
  },
});
```

### Stream Cancellation

Cancel an in-progress stream using the `stop()` method: ([TanStack AI Streaming Guide][1])

```typescript
const { submit, stop, isStreaming } = useChat({
  connection: fetchServerSentEvents("/api/chat"),
});

// Cancel the current stream
<button onClick={stop} disabled={!isStreaming}>
  Stop
</button>
```

## Error Handling

### Server-Side

```typescript
try {
  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
    model: "gpt-4o",
    messages,
  });

  return toStreamResponse(stream);
} catch (error) {
  return new Response(JSON.stringify({ error: "Chat failed" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}
```

### Client-Side

```typescript
const { messages, error } = useChat({
  connection: fetchServerSentEvents("/api/chat"),
  onError: (error) => {
    // Handle error gracefully
    toast.error("Connection failed");
  },
});

if (error) {
  return <ErrorDisplay error={error} />;
}
```

## Best Practices

1. **Use SSE for most cases**: Server-Sent Events provide the best balance of compatibility and performance

2. **Handle errors gracefully**: Always provide error callbacks and fallback UI

3. **Show streaming state**: Display loading indicators while `isStreaming` is true

4. **Cancel abandoned streams**: Use `stop()` when users navigate away

5. **Process chunks efficiently**: Avoid heavy computation in chunk handlers to maintain smooth streaming

## Links

[1]: https://tanstack.com/ai/latest/docs/guides/streaming "TanStack AI Streaming Guide"
[2]: https://tanstack.com/ai/latest/docs/getting-started/overview "TanStack AI Overview"
