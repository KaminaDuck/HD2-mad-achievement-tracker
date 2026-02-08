---
title: AI Streaming Integration
description: Real-time LLM responses with TanStack AI and Hono SSE streaming
---

# AI Streaming Integration

Build real-time AI chat interfaces by connecting TanStack AI on the frontend to Hono streaming endpoints on the backend. This guide covers the complete architecture for streaming LLM responses.

## Streaming Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │  useChat    │───▶│  Messages   │───▶│  Message Components     │  │
│  │  Hook       │    │  State      │    │  (streaming render)     │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
│         │                                                            │
│         │ SSE Connection                                             │
└─────────┼────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SERVER (Hono)                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐  │
│  │  /chat      │───▶│  Provider   │───▶│  Stream Response        │  │
│  │  Endpoint   │    │  (OpenAI/   │    │  (SSE chunks)          │  │
│  │             │    │  Anthropic) │    │                         │  │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

## Backend Setup

### Streaming Endpoint with Hono

```typescript
// src/server/routes/chat.ts
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const chatRequestSchema = z.object({
  messages: z.array(messageSchema),
  model: z.string().default("claude-sonnet-4-20250514"),
});

const anthropic = new Anthropic();

const chat = new Hono()
  .post(
    "/",
    zValidator("json", chatRequestSchema),
    async (c) => {
      const { messages, model } = c.req.valid("json");

      return streamSSE(c, async (stream) => {
        const response = await anthropic.messages.create({
          model,
          max_tokens: 4096,
          messages,
          stream: true,
        });

        for await (const event of response) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            await stream.writeSSE({
              data: JSON.stringify({
                type: "text",
                content: event.delta.text,
              }),
            });
          }
        }

        // Signal completion
        await stream.writeSSE({
          data: JSON.stringify({ type: "done" }),
        });
      });
    }
  );

export { chat };
```

### OpenAI Streaming

```typescript
// src/server/routes/chat-openai.ts
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import OpenAI from "openai";

const openai = new OpenAI();

const chat = new Hono()
  .post("/", async (c) => {
    const { messages } = await c.req.json();

    return streamSSE(c, async (stream) => {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        stream: true,
      });

      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          await stream.writeSSE({
            data: JSON.stringify({
              type: "text",
              content,
            }),
          });
        }
      }

      await stream.writeSSE({
        data: JSON.stringify({ type: "done" }),
      });
    });
  });
```

### Provider-Agnostic Pattern

```typescript
// src/server/lib/ai-provider.ts
interface AIProvider {
  stream(messages: Message[]): AsyncIterable<string>;
}

class AnthropicProvider implements AIProvider {
  private client = new Anthropic();

  async *stream(messages: Message[]): AsyncIterable<string> {
    const response = await this.client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages,
      stream: true,
    });

    for await (const event of response) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }
}

class OpenAIProvider implements AIProvider {
  private client = new OpenAI();

  async *stream(messages: Message[]): AsyncIterable<string> {
    const response = await this.client.chat.completions.create({
      model: "gpt-4o",
      messages,
      stream: true,
    });

    for await (const chunk of response) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  }
}

// Factory
export function getProvider(name: string): AIProvider {
  switch (name) {
    case "anthropic": return new AnthropicProvider();
    case "openai": return new OpenAIProvider();
    default: throw new Error(`Unknown provider: ${name}`);
  }
}
```

## Frontend Setup

### Basic useChat Hook

```tsx
// src/client/hooks/useChat.ts
import { useState, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!response.ok) throw new Error("Chat request failed");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

        for (const line of lines) {
          const data = JSON.parse(line.slice(6));

          if (data.type === "text") {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessage.id
                  ? { ...msg, content: msg.content + data.content }
                  : msg
              )
            );
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return { messages, sendMessage, isLoading, error };
}
```

### Using TanStack AI

```tsx
// src/client/components/Chat.tsx
import { useChat } from "@tanstack/react-ai";

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: "/api/chat",
  });

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <div className="content">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="typing-indicator">...</div>
          </div>
        )}
      </div>

      {error && <div className="error">{error.message}</div>}

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={handleInputChange}
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

## Tool Calling with Streaming

### Backend Tool Definitions

```typescript
// src/server/routes/chat-with-tools.ts
import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import Anthropic from "@anthropic-ai/sdk";

const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description: "Get current weather for a location",
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" },
      },
      required: ["location"],
    },
  },
  {
    name: "search_docs",
    description: "Search documentation",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
      },
      required: ["query"],
    },
  },
];

async function executeTool(name: string, input: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "get_weather":
      return JSON.stringify({ temp: 72, condition: "sunny" });
    case "search_docs":
      return JSON.stringify({ results: ["Doc 1", "Doc 2"] });
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

const chat = new Hono()
  .post("/", async (c) => {
    const { messages } = await c.req.json();
    const anthropic = new Anthropic();

    return streamSSE(c, async (stream) => {
      let response = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        tools,
        messages,
        stream: true,
      });

      let currentToolUse: { id: string; name: string; input: string } | null = null;

      for await (const event of response) {
        if (event.type === "content_block_start") {
          if (event.content_block.type === "tool_use") {
            currentToolUse = {
              id: event.content_block.id,
              name: event.content_block.name,
              input: "",
            };
            await stream.writeSSE({
              data: JSON.stringify({
                type: "tool_start",
                toolName: event.content_block.name,
              }),
            });
          }
        } else if (event.type === "content_block_delta") {
          if (event.delta.type === "text_delta") {
            await stream.writeSSE({
              data: JSON.stringify({
                type: "text",
                content: event.delta.text,
              }),
            });
          } else if (event.delta.type === "input_json_delta" && currentToolUse) {
            currentToolUse.input += event.delta.partial_json;
          }
        } else if (event.type === "content_block_stop" && currentToolUse) {
          // Execute tool and send result
          const input = JSON.parse(currentToolUse.input);
          const result = await executeTool(currentToolUse.name, input);

          await stream.writeSSE({
            data: JSON.stringify({
              type: "tool_result",
              toolName: currentToolUse.name,
              result,
            }),
          });

          currentToolUse = null;
        }
      }

      await stream.writeSSE({
        data: JSON.stringify({ type: "done" }),
      });
    });
  });
```

### Client Tool Handling

```tsx
// src/client/components/ChatWithTools.tsx
import { useState } from "react";

interface ToolCall {
  name: string;
  status: "pending" | "executing" | "complete";
  result?: string;
}

export function ChatWithTools() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [toolCalls, setToolCalls] = useState<ToolCall[]>([]);

  const sendMessage = async (content: string) => {
    // ... similar to before, but handle tool events

    for await (const event of parseSSE(response)) {
      switch (event.type) {
        case "text":
          // Append to assistant message
          break;
        case "tool_start":
          setToolCalls((prev) => [
            ...prev,
            { name: event.toolName, status: "executing" },
          ]);
          break;
        case "tool_result":
          setToolCalls((prev) =>
            prev.map((tc) =>
              tc.name === event.toolName
                ? { ...tc, status: "complete", result: event.result }
                : tc
            )
          );
          break;
      }
    }
  };

  return (
    <div>
      {/* Messages */}
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}

      {/* Tool calls indicator */}
      {toolCalls.map((tool) => (
        <div key={tool.name} className="tool-call">
          <span>{tool.name}</span>
          <span>{tool.status}</span>
          {tool.result && <pre>{tool.result}</pre>}
        </div>
      ))}
    </div>
  );
}
```

## UI Patterns

### Message Rendering with Markdown

```tsx
// src/client/components/Message.tsx
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";

export function Message({ message }: { message: Message }) {
  return (
    <div className={`message ${message.role}`}>
      <div className="avatar">{message.role === "user" ? "U" : "AI"}</div>
      <div className="content">
        <ReactMarkdown
          components={{
            code({ className, children }) {
              const match = /language-(\w+)/.exec(className || "");
              return match ? (
                <SyntaxHighlighter language={match[1]}>
                  {String(children)}
                </SyntaxHighlighter>
              ) : (
                <code className={className}>{children}</code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}
```

### Typing Indicator

```tsx
// src/client/components/TypingIndicator.tsx
export function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
}

// CSS
.typing-indicator {
  display: flex;
  gap: 4px;
}
.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #666;
  animation: bounce 1.4s infinite ease-in-out;
}
.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }
```

### Error States

```tsx
// src/client/components/ChatError.tsx
export function ChatError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div className="chat-error">
      <p>{error.message}</p>
      <button onClick={onRetry}>Retry</button>
    </div>
  );
}
```

## Performance Considerations

### Connection Management

```typescript
// Use AbortController for cleanup
const abortController = new AbortController();

const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({ messages }),
  signal: abortController.signal,
});

// Cleanup on unmount
useEffect(() => {
  return () => abortController.abort();
}, []);
```

### Reconnection Strategy

```typescript
// src/client/hooks/useChat.ts
const MAX_RETRIES = 3;

async function sendWithRetry(messages: Message[], retries = 0): Promise<void> {
  try {
    await sendMessage(messages);
  } catch (error) {
    if (retries < MAX_RETRIES && isRetryableError(error)) {
      await delay(1000 * Math.pow(2, retries)); // Exponential backoff
      return sendWithRetry(messages, retries + 1);
    }
    throw error;
  }
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes("network") || error.message.includes("timeout");
  }
  return false;
}
```

## Complete Chat Example

```tsx
// src/client/pages/ChatPage.tsx
import { useState, useRef, useEffect } from "react";
import { useChat } from "../hooks/useChat";
import { Message } from "../components/Message";
import { TypingIndicator } from "../components/TypingIndicator";

export function ChatPage() {
  const { messages, sendMessage, isLoading, error } = useChat();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      sendMessage(input.trim());
      setInput("");
    }
  };

  return (
    <div className="chat-page">
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <h2>How can I help you today?</h2>
          </div>
        )}

        {messages.map((message) => (
          <Message key={message.id} message={message} />
        ))}

        {isLoading && <TypingIndicator />}
        {error && <div className="error">{error.message}</div>}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
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

## Related Documentation

- [TanStack AI](../domains/frontend/tanstack-ai.md) - AI hooks and utilities
- [Hono Streaming](../domains/backend/hono-streaming.md) - SSE streaming patterns
- [Frontend-Backend](./frontend-backend.md) - General integration patterns
