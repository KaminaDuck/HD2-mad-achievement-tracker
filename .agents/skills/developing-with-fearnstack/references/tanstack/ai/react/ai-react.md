---
title: "@tanstack/ai-react Reference"
description: "React hooks and utilities for TanStack AI chat applications"
type: "api-reference"
tags: ["tanstack", "ai", "react", "hooks", "useChat", "streaming", "tools"]
category: "typescript"
subcategory: "ai"
version: "0.2.0"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "NPM Package"
    url: "https://www.npmjs.com/package/@tanstack/ai-react"
  - name: "TanStack AI Docs"
    url: "https://tanstack.com/ai/latest/docs/api/ai-react"
  - name: "GitHub Source (ai-react)"
    url: "https://github.com/TanStack/ai/tree/main/packages/typescript/ai-react/src"
  - name: "GitHub Source (ai-client types)"
    url: "https://github.com/TanStack/ai/blob/main/packages/typescript/ai-client/src/types.ts"
related: ["README.md", "devtools.md", "../react-guide.md", "../tools-guide.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# @tanstack/ai-react

React hooks for building AI-powered chat applications with TanStack AI. Provides automatic state management, streaming support, and type-safe tool integration.

**Current version:** 0.2.0
**Package:** `@tanstack/ai-react`

## Installation

```bash
npm install @tanstack/ai-react @tanstack/ai-client
```

## Key Features

- **useChat hook** - Complete chat state management ([use-chat.ts][1])
- **Streaming support** - Real-time message updates via SSE or HTTP streams ([ConnectionAdapter][2])
- **Client-side tools** - Execute tools in the browser with full type safety ([clientTools][3])
- **Tool approval workflows** - Handle user approval for sensitive operations ([ToolCallPart.approval][3])
- **TanStack Start integration** - Share implementations between AI tools and server functions

## API Reference

### useChat

The primary hook for managing AI chat state in React applications.

```typescript
import { useChat } from "@tanstack/ai-react";
import { fetchServerSentEvents } from "@tanstack/ai-client";

const {
  messages,
  sendMessage,
  isLoading,
  stop,
  error,
  clear,
  reload,
  setMessages,
  addToolResult,
  addToolApprovalResponse,
} = useChat({
  connection: fetchServerSentEvents("/api/chat"),
});
```

#### Configuration Options

Options extend `ChatClientOptions` from `@tanstack/ai-client`. ([types.ts][4])

| Option | Type | Description |
|--------|------|-------------|
| `connection` | `ConnectionAdapter` | **Required.** Server connection (SSE or HTTP stream) |
| `initialMessages` | `Array<UIMessage<TTools>>` | Initial messages to populate chat |
| `tools` | `TTools` | Client-side tool implementations via `clientTools()` |
| `body` | `Record<string, any>` | Additional parameters sent with each request |
| `id` | `string` | Unique identifier for this chat instance |
| `onResponse` | `(response?: Response) => void \| Promise<void>` | Called when response is received |
| `onChunk` | `(chunk: StreamChunk) => void` | Called for each streaming chunk |
| `onFinish` | `(message: UIMessage<TTools>) => void` | Called when stream completes |
| `onError` | `(error: Error) => void` | Called on error |
| `streamProcessor` | `{ chunkStrategy?: ChunkStrategy }` | Stream processing options |

> **Note:** `UseChatOptions` omits `onMessagesChange`, `onLoadingChange`, and `onErrorChange` from `ChatClientOptions` since these are managed internally by React state. ([types.ts][5])

#### Return Values

`UseChatReturn<TTools>` interface from [types.ts][5]:

| Property | Type | Description |
|----------|------|-------------|
| `messages` | `Array<UIMessage<TTools>>` | Current messages in the conversation |
| `sendMessage` | `(content: string) => Promise<void>` | Send a message and get a response |
| `append` | `(message: ModelMessage \| UIMessage<TTools>) => Promise<void>` | Append a message to conversation |
| `isLoading` | `boolean` | Whether a response is currently being generated |
| `stop` | `() => void` | Stop the current response generation |
| `error` | `Error \| undefined` | Current error, if any |
| `clear` | `() => void` | Clear all messages |
| `setMessages` | `(messages: Array<UIMessage<TTools>>) => void` | Set messages manually |
| `reload` | `() => Promise<void>` | Reload the last assistant message |
| `addToolResult` | `(result: { toolCallId, tool, output, state?, errorText? }) => Promise<void>` | Add the result of a client-side tool execution |
| `addToolApprovalResponse` | `(response: { id: string; approved: boolean }) => Promise<void>` | Respond to a tool approval request |

### clientTools

Register client-side tool implementations for browser execution.

```typescript
import { clientTools, toolDefinition } from "@tanstack/ai-client";
import { z } from "zod";

const copyToClipboardDef = toolDefinition({
  name: "copy_to_clipboard",
  description: "Copy text to clipboard",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ success: z.boolean() }),
});

const copyToClipboard = copyToClipboardDef.client(async ({ text }) => {
  await navigator.clipboard.writeText(text);
  return { success: true };
});

// In component
const chat = useChat({
  connection: fetchServerSentEvents("/api/chat"),
  tools: clientTools(copyToClipboard),
});
```

### createServerFnTool (TanStack Start)

Create tools that work as both AI tools and server functions. **Requires TanStack Start.**

```typescript
import { createServerFnTool } from "@tanstack/ai-react";
import { z } from "zod";

const getProducts = createServerFnTool({
  name: "getProducts",
  description: "Search products database",
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    return db.products.search(query);
  },
});

// Use as AI tool
chat({ tools: [getProducts.server] });

// Call directly from components (no API endpoint needed)
const products = await getProducts.serverFn({ query: "laptop" });
```

## UIMessage Structure

Messages returned by `useChat` have this structure. ([ai-client/types.ts][3])

```typescript
interface UIMessage<TTools extends ReadonlyArray<AnyClientTool> = any> {
  id: string;
  role: "system" | "user" | "assistant";
  parts: Array<MessagePart<TTools>>;
  createdAt?: Date;
}

type MessagePart<TTools> =
  | TextPart
  | ToolCallPart<TTools>
  | ToolResultPart
  | ThinkingPart;

interface TextPart {
  type: "text";
  content: string;
}

interface ToolCallPart<TTools> {
  type: "tool-call";
  id: string;
  name: string;          // Discriminant for type narrowing
  arguments: string;     // JSON string (may be incomplete during streaming)
  input?: InferToolInput<TTools>;
  state: ToolCallState;  // "awaiting-input" | "input-streaming" | "input-complete" | "approval-requested" | "approval-responded"
  approval?: { id: string; needsApproval: boolean; approved?: boolean };
  output?: InferToolOutput<TTools>;
}

interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  content: string;
  state: ToolResultState;  // "streaming" | "complete" | "error"
  error?: string;
}

interface ThinkingPart {
  type: "thinking";
  content: string;
}
```

### Rendering Messages

```typescript
function MessageDisplay({ message }: { message: UIMessage }) {
  return (
    <div className={message.role}>
      {message.parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return <span key={i}>{part.content}</span>;
          case "thinking":
            return (
              <details key={i}>
                <summary>Thinking...</summary>
                <pre>{part.content}</pre>
              </details>
            );
          case "tool-call":
            return (
              <div key={i}>
                Calling {part.name}... (state: {part.state})
                {part.approval?.needsApproval && !part.approval.approved && (
                  <span> - Awaiting approval</span>
                )}
              </div>
            );
          case "tool-result":
            return (
              <div key={i}>
                Result ({part.state}): {part.content}
                {part.error && <span className="error">{part.error}</span>}
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

## Connection Adapters

### Server-Sent Events (Recommended)

```typescript
import { fetchServerSentEvents } from "@tanstack/ai-client";

const connection = fetchServerSentEvents("/api/chat", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

### HTTP Stream

```typescript
import { fetchHttpStream } from "@tanstack/ai-client";

const connection = fetchHttpStream("/api/chat");
```

## Complete Example

```typescript
"use client";

import { useState } from "react";
import { useChat } from "@tanstack/ai-react";
import { clientTools, fetchServerSentEvents, toolDefinition } from "@tanstack/ai-client";
import { z } from "zod";

const showAlertDef = toolDefinition({
  name: "show_alert",
  description: "Show an alert to the user",
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ acknowledged: z.boolean() }),
});

export function Chat() {
  const [input, setInput] = useState("");

  const showAlert = showAlertDef.client(({ message }) => {
    alert(message);
    return { acknowledged: true };
  });

  const { messages, sendMessage, isLoading, stop, error, clear } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    tools: clientTools(showAlert),
    onFinish: (message) => console.log("Complete:", message),
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
      <div>
        <p>Error: {error.message}</p>
        <button onClick={clear}>Reset</button>
      </div>
    );
  }

  return (
    <div>
      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={msg.role}>
            {msg.parts.map((p, i) =>
              p.type === "text" ? <span key={i}>{p.content}</span> : null
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        {isLoading ? (
          <button type="button" onClick={stop}>Stop</button>
        ) : (
          <button type="submit">Send</button>
        )}
      </form>

      <button onClick={clear}>New Chat</button>
    </div>
  );
}
```

## Peer Dependencies

- `react` >= 18.0.0
- `@tanstack/ai-client` >= 0.2.0

## Related

- [@tanstack/react-ai-devtools](devtools.md) - Development tools
- [React Guide](../react-guide.md) - Complete integration guide
- [Tools Guide](../tools-guide.md) - Tool definition patterns

## References

[1]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react/src/use-chat.ts "ai-react use-chat.ts source"
[2]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-client/src/connection-adapters.ts "ai-client ConnectionAdapter source"
[3]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-client/src/types.ts "ai-client types.ts source"
[4]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-client/src/types.ts#L122-L180 "ChatClientOptions interface"
[5]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react/src/types.ts "ai-react types.ts source"
