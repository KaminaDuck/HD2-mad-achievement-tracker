---
title: "TanStack AI React Guide"
description: "React hooks and components for AI chat applications"
type: "framework-guide"
tags: ["tanstack", "ai", "react", "hooks", "useChat", "typescript", "frontend"]
category: "typescript"
subcategory: "ai"
version: "0.2"
last_updated: "2025-12-06"
status: "stable"
sources:
  - name: "TanStack AI Overview"
    url: "https://tanstack.com/ai/latest/docs/getting-started/overview"
  - name: "TanStack AI Streaming Guide"
    url: "https://tanstack.com/ai/latest/docs/guides/streaming"
  - name: "TanStack AI Tools Guide"
    url: "https://tanstack.com/ai/latest/docs/guides/tools"
related: ["overview.md", "tools-guide.md", "streaming.md", "../query/react-guide.md", "../router/react-guide.md"]
author: "unknown"
contributors: []
---

# TanStack AI React Guide

TanStack AI provides React hooks and utilities for building AI chat applications with automatic state management, streaming support, and type-safe tool integration. ([TanStack AI Overview][1])

## Installation

```bash
npm install @tanstack/ai-react @tanstack/ai-client
```

You'll also need a provider adapter for the server:

```bash
npm install @tanstack/ai @tanstack/ai-openai  # or another adapter
```

## useChat Hook

The `useChat` hook is the primary interface for React applications. It manages messages, input state, streaming, and tool execution. ([TanStack AI Overview][1])

### Basic Usage

```typescript
import { useState } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";

function ChatComponent() {
  const [input, setInput] = useState("");

  const {
    messages,
    sendMessage,
    isLoading,
    stop,
    clear,
  } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      await sendMessage(input);
      setInput("");
    }
  };

  return (
    <div>
      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={message.role}>
            {/* Messages use parts[] array for content */}
            {message.parts.map((part, i) => (
              part.type === "text" ? <span key={i}>{part.content}</span> : null
            ))}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit" disabled={isLoading}>
          Send
        </button>
      </form>
    </div>
  );
}
```

### Hook Return Values

| Property | Type | Description |
|----------|------|-------------|
| `messages` | `UIMessage[]` | Array of chat messages with `parts[]` array |
| `sendMessage` | `(content: string) => Promise<void>` | Send a user message |
| `append` | `(message) => Promise<void>` | Append a message to the conversation |
| `isLoading` | `boolean` | Whether a response is being generated |
| `stop` | `() => void` | Cancel current stream |
| `error` | `Error \| undefined` | Current error state |
| `clear` | `() => void` | Clear all messages |
| `setMessages` | `(messages) => void` | Set messages manually |
| `reload` | `() => Promise<void>` | Reload the last assistant message |
| `addToolResult` | `(result) => Promise<void>` | Add result of client-side tool |
| `addToolApprovalResponse` | `(response) => Promise<void>` | Respond to tool approval request |

> **Note:** Unlike some chat libraries, `useChat` does not provide `input`/`setInput`. Manage input state locally with `useState`.

### Hook Configuration Options

```typescript
const chat = useChat({
  // Connection to server endpoint (required)
  connection: fetchServerSentEvents("/api/chat"),

  // Initial messages (optional)
  initialMessages: [
    { id: "1", role: "user", parts: [{ type: "text", content: "Hello" }] },
  ],

  // Client-side tools (optional)
  tools: clientTools(myTool1, myTool2),

  // Additional body parameters sent with each request
  body: {
    model: "gpt-4o",
    temperature: 0.7,
  },

  // Unique chat instance ID (optional)
  id: "my-chat",

  // Callbacks
  onResponse: (response) => {
    // Called when response is received
  },
  onChunk: (chunk) => {
    // Called for each streaming chunk
  },
  onFinish: (message) => {
    // Called when stream completes (message is UIMessage)
  },
  onError: (error) => {
    // Called on error
  },
});
```

## Connection Setup

### Server-Sent Events (Recommended)

```typescript
import { fetchServerSentEvents } from "@tanstack/ai-client";

const connection = fetchServerSentEvents("/api/chat");
```

### HTTP Stream

```typescript
import { fetchHttpStream } from "@tanstack/ai-client";

const connection = fetchHttpStream("/api/chat");
```

### Custom Headers

```typescript
const connection = fetchServerSentEvents("/api/chat", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

## Message Structure

Messages have the following structure:

```typescript
interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string | MessagePart[];
  createdAt: Date;
}

type MessagePart =
  | TextPart
  | ImagePart
  | AudioPart
  | ToolCallPart
  | ToolResultPart
  | ThinkingPart;
```

### Rendering Messages

```typescript
function MessageDisplay({ message }: { message: Message }) {
  // Simple text content
  if (typeof message.content === "string") {
    return <div>{message.content}</div>;
  }

  // Complex content with parts
  return (
    <div>
      {message.content.map((part, index) => {
        switch (part.type) {
          case "text":
            return <span key={index}>{part.text}</span>;

          case "image":
            return <img key={index} src={part.source.value} alt="" />;

          case "thinking":
            return (
              <details key={index}>
                <summary>Thinking...</summary>
                <pre>{part.text}</pre>
              </details>
            );

          case "tool-call":
            return (
              <div key={index} className="tool-call">
                Calling {part.name}...
              </div>
            );

          case "tool-result":
            return (
              <div key={index} className="tool-result">
                Result: {JSON.stringify(part.result)}
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
```

## Client-Side Tools

Register tools that execute in the browser using `clientTools()`: ([TanStack AI Tools Guide][3])

```typescript
import { useChat } from "@tanstack/ai-react";
import { clientTools, fetchServerSentEvents, toolDefinition } from "@tanstack/ai-client";
import { z } from "zod";

// Define tool schema
const showNotificationDef = toolDefinition({
  name: "show_notification",
  description: "Display a notification to the user",
  inputSchema: z.object({
    message: z.string(),
    type: z.enum(["info", "success", "warning", "error"]),
  }),
  outputSchema: z.object({
    shown: z.boolean(),
  }),
});

function ChatWithTools() {
  const [input, setInput] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  // Create client-side tool implementation
  const showNotification = showNotificationDef.client((input) => {
    setNotification(input.message);
    return { shown: true };
  });

  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    tools: clientTools(showNotification),
  });

  return (
    <div>
      {notification && (
        <div className="notification">{notification}</div>
      )}
      {/* ... chat UI */}
    </div>
  );
}
```

## Tool Approval Workflows

For tools requiring user approval, handle the approval state in your UI: ([TanStack AI Tools Guide][3])

```typescript
function ChatWithApproval() {
  const { messages, approveToolCall, rejectToolCall } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    tools: clientTools(sensitiveAction),
  });

  return (
    <div>
      {messages.map((message) => {
        // Check for pending tool calls
        const pendingTools = message.content?.filter(
          (part) =>
            part.type === "tool-call" &&
            part.status === "approval-requested"
        );

        return (
          <div key={message.id}>
            {message.content}

            {pendingTools?.map((tool) => (
              <div key={tool.id} className="approval-prompt">
                <p>Allow {tool.name}?</p>
                <button onClick={() => approveToolCall(tool.id)}>
                  Approve
                </button>
                <button onClick={() => rejectToolCall(tool.id)}>
                  Reject
                </button>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
```

## State Management

### Streaming State

```typescript
function ChatComponent() {
  const { isLoading, stop } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  return (
    <div>
      {isLoading && (
        <div className="streaming-indicator">
          <span>AI is typing...</span>
          <button onClick={stop}>Stop</button>
        </div>
      )}
    </div>
  );
}
```

### Error Handling

```typescript
function ChatComponent() {
  const { messages, error, clear } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  if (error) {
    return (
      <div className="error">
        <p>Something went wrong: {error.message}</p>
        <button onClick={clear}>Try again</button>
      </div>
    );
  }

  return (
    <div>
      {/* ... chat UI */}
    </div>
  );
}
```

### Resetting Chat

```typescript
function ChatComponent() {
  const { messages, clear } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  return (
    <div>
      <button onClick={clear}>New conversation</button>
      {/* ... */}
    </div>
  );
}
```

## Server-Side Setup

Pair the React client with a server endpoint:

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

### With Server Tools

```typescript
// app/api/chat/route.ts
import { chat, toStreamResponse, toolDefinition } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";
import { z } from "zod";

const getWeatherDef = toolDefinition({
  name: "get_weather",
  description: "Get current weather",
  inputSchema: z.object({ location: z.string() }),
  outputSchema: z.object({ temperature: z.number(), conditions: z.string() }),
});

const getWeather = getWeatherDef.server(async ({ location }) => {
  // Fetch weather from API
  return { temperature: 72, conditions: "sunny" };
});

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
    model: "gpt-4o",
    messages,
    tools: [getWeather],
  });

  return toStreamResponse(stream);
}
```

## Complete Example

```typescript
// components/Chat.tsx
"use client";

import { useState } from "react";
import { useChat } from "@tanstack/ai-react";
import { clientTools, fetchServerSentEvents, toolDefinition } from "@tanstack/ai-client";
import { z } from "zod";

const copyToClipboardDef = toolDefinition({
  name: "copy_to_clipboard",
  description: "Copy text to the user's clipboard",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
});

// Helper to extract text content from UIMessage parts
function getMessageContent(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.content)
    .join("");
}

export function Chat() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState(false);

  const copyToClipboard = copyToClipboardDef.client(async ({ text }) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    return { success: true };
  });

  const {
    messages,
    sendMessage,
    isLoading,
    stop,
    error,
    clear,
  } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    tools: clientTools(copyToClipboard),
    onFinish: (message) => {
      console.log("Response complete:", message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      await sendMessage(input);
      setInput("");
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <p>Error: {error.message}</p>
        <button onClick={clear}>Reset</button>
      </div>
    );
  }

  return (
    <div className="chat-container">
      {copied && <div className="toast">Copied to clipboard!</div>}

      <div className="messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}`}>
            <strong>{message.role}:</strong>
            <span>{getMessageContent(message)}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isLoading}
        />
        {isLoading ? (
          <button type="button" onClick={stop}>
            Stop
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()}>
            Send
          </button>
        )}
      </form>

      <button onClick={clear} className="reset-button">
        New Chat
      </button>
    </div>
  );
}
```

## Best Practices

1. **Handle streaming state**: Always show indicators when `isLoading` is true

2. **Provide stop functionality**: Let users cancel long-running streams

3. **Handle errors gracefully**: Display user-friendly error messages

4. **Use system messages**: Set context with initial system messages

5. **Implement client tools carefully**: Ensure tools handle errors and return proper results

6. **Consider accessibility**: Add ARIA labels and keyboard navigation

## Links

[1]: https://tanstack.com/ai/latest/docs/getting-started/overview "TanStack AI Overview"
[2]: https://tanstack.com/ai/latest/docs/guides/streaming "TanStack AI Streaming Guide"
[3]: https://tanstack.com/ai/latest/docs/guides/tools "TanStack AI Tools Guide"
