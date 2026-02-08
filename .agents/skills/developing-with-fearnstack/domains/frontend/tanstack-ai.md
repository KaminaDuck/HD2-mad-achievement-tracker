---
title: TanStack AI
description: Type-safe LLM integration with streaming and tool calling
---

# TanStack AI

TanStack AI provides type-safe LLM integration for Fearnstack applications with streaming responses, tool calling, and support for multiple providers.

## Why TanStack AI?

- **Type Safety** - Full TypeScript support with Zod schema inference
- **Streaming** - Built-in real-time response streaming
- **Multi-Provider** - OpenAI, Anthropic, Gemini, Ollama
- **Tool Calling** - Automatic execution with server/client implementations
- **Unified API** - Same interface across all providers

## Installation

```bash
# Core packages
bun add @tanstack/ai @tanstack/ai-react

# Provider adapter (choose one or more)
bun add @tanstack/ai-openai
bun add @tanstack/ai-anthropic
bun add @tanstack/ai-gemini
bun add @tanstack/ai-ollama
```

## Basic Usage

### React Client

```typescript
import { useChat } from "@tanstack/ai-react";

function ChatInterface() {
  const { messages, input, setInput, sendMessage, isLoading } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="chat">
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        {isLoading && <div className="loading">Thinking...</div>}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
          setInput("");
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### Hono Server Endpoint

```typescript
// src/server/routes/chat.ts
import { Hono } from "hono";
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

const chatRoute = new Hono();

const adapter = openai({
  apiKey: process.env.OPENAI_API_KEY!,
});

chatRoute.post("/", async (c) => {
  const { messages } = await c.req.json();

  const stream = chat({
    adapter,
    model: "gpt-4o",
    messages,
  });

  return toStreamResponse(stream);
});

export { chatRoute };
```

## Provider Configuration

### OpenAI

```typescript
import { openai } from "@tanstack/ai-openai";

const adapter = openai({
  apiKey: process.env.OPENAI_API_KEY!,
  // Optional: custom base URL for Azure OpenAI
  baseURL: "https://your-resource.openai.azure.com",
});

const stream = chat({
  adapter,
  model: "gpt-4o", // or "gpt-4o-mini", "gpt-4-turbo"
  messages,
});
```

### Anthropic (Claude)

```typescript
import { anthropic } from "@tanstack/ai-anthropic";

const adapter = anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const stream = chat({
  adapter,
  model: "claude-3-5-sonnet-20241022", // or "claude-3-opus", "claude-3-haiku"
  messages,
});
```

### Google Gemini

```typescript
import { gemini } from "@tanstack/ai-gemini";

const adapter = gemini({
  apiKey: process.env.GOOGLE_API_KEY!,
});

const stream = chat({
  adapter,
  model: "gemini-1.5-pro",
  messages,
});
```

### Ollama (Local)

```typescript
import { ollama } from "@tanstack/ai-ollama";

const adapter = ollama({
  baseUrl: "http://localhost:11434", // Default Ollama URL
});

const stream = chat({
  adapter,
  model: "llama3.2", // or any model you have pulled
  messages,
});
```

## Tool Calling

Define tools with Zod schemas for type-safe execution:

### Tool Definition

```typescript
import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

const getWeatherDef = toolDefinition({
  name: "get_weather",
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City and state (e.g., 'San Francisco, CA')"),
    unit: z.enum(["celsius", "fahrenheit"]).default("fahrenheit"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    humidity: z.number(),
  }),
});
```

### Server-Side Tool

```typescript
// Execute on server only
const getWeather = getWeatherDef.server(async ({ location, unit }) => {
  // Call weather API
  const data = await fetchWeatherData(location);

  return {
    temperature: unit === "celsius" ? data.tempC : data.tempF,
    conditions: data.conditions,
    humidity: data.humidity,
  };
});
```

### Client-Side Tool

```typescript
// Execute on client (e.g., browser actions)
const copyToClipboard = toolDefinition({
  name: "copy_to_clipboard",
  description: "Copy text to the user's clipboard",
  inputSchema: z.object({
    text: z.string(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
}).client(async ({ text }) => {
  await navigator.clipboard.writeText(text);
  return { success: true };
});
```

### Using Tools in Chat

```typescript
const stream = chat({
  adapter,
  model: "gpt-4o",
  messages,
  tools: [getWeather, searchDatabase, copyToClipboard],
});
```

## Streaming Patterns

### Basic Streaming

```typescript
// Server
const stream = chat({
  adapter,
  model: "gpt-4o",
  messages,
});

for await (const chunk of stream) {
  console.log(chunk);
}

// Or convert to Response for HTTP
return toStreamResponse(stream);
```

### Client-Side Streaming Display

```typescript
function StreamingMessage({ stream }: { stream: AsyncIterable<Chunk> }) {
  const [content, setContent] = useState("");

  useEffect(() => {
    (async () => {
      for await (const chunk of stream) {
        if (chunk.type === "text") {
          setContent((prev) => prev + chunk.content);
        }
      }
    })();
  }, [stream]);

  return <div className="message">{content}</div>;
}
```

### useChat with Streaming

The `useChat` hook handles streaming automatically:

```typescript
function Chat() {
  const { messages, sendMessage, isLoading } = useChat({
    api: "/api/chat",
    onStream: (chunk) => {
      // Optional: handle individual chunks
      console.log("Received:", chunk);
    },
    onFinish: (message) => {
      // Called when response completes
      console.log("Complete:", message);
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          <strong>{msg.role}:</strong>
          <p>{msg.content}</p>
        </div>
      ))}
    </div>
  );
}
```

## Thinking/Reasoning Models

Support for models with extended thinking (like Claude):

```typescript
function ThinkingChat() {
  const { messages, sendMessage } = useChat({
    api: "/api/chat",
  });

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>
          {/* Display thinking separately */}
          {msg.thinking && (
            <details className="thinking">
              <summary>Thinking...</summary>
              <pre>{msg.thinking}</pre>
            </details>
          )}
          <div className="content">{msg.content}</div>
        </div>
      ))}
    </div>
  );
}
```

## System Messages

Configure AI behavior:

```typescript
const stream = chat({
  adapter,
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: `You are a helpful assistant for a Fearnstack application.
        Be concise and technical. Provide code examples when relevant.
        Always use TypeScript for code samples.`,
    },
    ...userMessages,
  ],
});
```

## Multimodal Input

Send images with messages:

```typescript
const stream = chat({
  adapter,
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        {
          type: "image_url",
          image_url: { url: "data:image/png;base64,..." },
        },
      ],
    },
  ],
});
```

## Tool Approval Workflows

Require user consent for sensitive actions:

```typescript
const deleteRecord = toolDefinition({
  name: "delete_record",
  description: "Delete a record from the database",
  inputSchema: z.object({
    recordId: z.string(),
  }),
  outputSchema: z.object({
    deleted: z.boolean(),
  }),
  requiresApproval: true, // User must approve
}).server(async ({ recordId }) => {
  await db.records.delete(recordId);
  return { deleted: true };
});

// Client handles approval UI
function Chat() {
  const { messages, pendingToolCalls, approveToolCall, rejectToolCall } = useChat({
    api: "/api/chat",
    tools: [deleteRecord],
  });

  return (
    <div>
      {pendingToolCalls.map((call) => (
        <div key={call.id} className="approval-dialog">
          <p>AI wants to: {call.name}</p>
          <pre>{JSON.stringify(call.args, null, 2)}</pre>
          <button onClick={() => approveToolCall(call.id)}>Approve</button>
          <button onClick={() => rejectToolCall(call.id)}>Reject</button>
        </div>
      ))}
    </div>
  );
}
```

## Integration with Hono

Complete chat endpoint with tools:

```typescript
// src/server/routes/chat.ts
import { Hono } from "hono";
import { chat, toStreamResponse, toolDefinition } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";
import { z } from "zod";

const chatRoute = new Hono();

// Define tools
const searchDocs = toolDefinition({
  name: "search_docs",
  description: "Search documentation for information",
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ results: z.array(z.object({ title: z.string(), content: z.string() })) }),
}).server(async ({ query }) => {
  const results = await searchDocumentation(query);
  return { results };
});

chatRoute.post("/", async (c) => {
  const { messages, model = "gpt-4o" } = await c.req.json();

  const adapter = openai({ apiKey: process.env.OPENAI_API_KEY! });

  const stream = chat({
    adapter,
    model,
    messages: [
      { role: "system", content: "You are a helpful coding assistant." },
      ...messages,
    ],
    tools: [searchDocs],
  });

  return toStreamResponse(stream);
});

export { chatRoute };
```

## Common Patterns

### Retry on Error

```typescript
const { messages, sendMessage, error, retry } = useChat({
  api: "/api/chat",
});

{error && (
  <div className="error">
    <p>Error: {error.message}</p>
    <button onClick={retry}>Retry</button>
  </div>
)}
```

### Stop Generation

```typescript
const { messages, sendMessage, isLoading, stop } = useChat({
  api: "/api/chat",
});

{isLoading && (
  <button onClick={stop}>Stop generating</button>
)}
```

## Next Steps

- [AI Streaming](../../integration/ai-streaming.md) - Complete streaming patterns
- [Hono Streaming](../backend/hono-streaming.md) - Server-side streaming
- [TanStack Query](tanstack-query.md) - Cache AI responses
