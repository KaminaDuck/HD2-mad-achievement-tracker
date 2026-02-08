---
title: "@tanstack/react-ai-devtools Reference"
description: "Development tools for debugging TanStack AI React applications"
type: "api-reference"
tags: ["tanstack", "ai", "react", "devtools", "debugging", "development"]
category: "typescript"
subcategory: "ai"
version: "0.1.1"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "NPM Package"
    url: "https://www.npmjs.com/package/@tanstack/react-ai-devtools"
  - name: "TanStack AI Devtools Docs"
    url: "https://tanstack.com/ai/latest/docs/getting-started/devtools"
  - name: "GitHub Source"
    url: "https://github.com/TanStack/ai/tree/main/packages/typescript/react-ai-devtools/src"
related: ["README.md", "ai-react.md", "../react-guide.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# @tanstack/react-ai-devtools

Development tools for debugging and inspecting TanStack AI chat applications in React. Built on the TanStack Devtools infrastructure.

**Current version:** 0.1.1
**Package:** `@tanstack/react-ai-devtools`

## Installation

```bash
npm install @tanstack/react-ai-devtools --save-dev
```

## Features

- **Message inspection** - View all chat messages and their structure
- **Streaming visualization** - Monitor real-time streaming chunks
- **Tool call debugging** - Inspect tool calls, inputs, and results
- **State inspection** - View internal chat state and configuration
- **Built on TanStack Devtools** - Consistent with other TanStack library devtools

## Verified Exports

From [index.ts][1]:

```typescript
export { AiDevtoolsPanel }     // Panel component (NoOp in production)
export { aiDevtoolsPlugin }    // Plugin for TanStack Devtools
export type { AiDevtoolsReactInit }
```

> **Note:** The component is automatically replaced with a no-op in production builds (`process.env.NODE_ENV !== 'development'`).

## Quick Start

```typescript
import { AiDevtoolsPanel } from "@tanstack/react-ai-devtools";

function App() {
  return (
    <div>
      <ChatComponent />
      <AiDevtoolsPanel />
    </div>
  );
}
```

## API Reference

### AiDevtoolsPanel

The devtools panel component created using TanStack's shared devtools infrastructure. ([AiDevtools.tsx][2])

```typescript
import { AiDevtoolsPanel } from "@tanstack/react-ai-devtools";

<AiDevtoolsPanel />
```

> **Note:** Props interface extends `DevtoolsPanelProps` from `@tanstack/devtools-utils/react`. The panel is created via `createReactPanel(AiDevtoolsCore)`. Consult [TanStack Devtools documentation](https://tanstack.com/devtools) for complete props reference.

### aiDevtoolsPlugin

Plugin for integrating with TanStack Devtools unified panel. ([plugin.tsx][3])

```typescript
import { aiDevtoolsPlugin } from "@tanstack/react-ai-devtools";

// Use with TanStack Devtools unified panel
```

Plugin configuration:
- `name`: "TanStack AI"
- `id`: "tanstack-ai"
- `defaultOpen`: true

## Usage Patterns

### Automatic Production Stripping

The package automatically exports a no-op component in production builds. You can safely include it without conditional checks:

```typescript
import { AiDevtoolsPanel } from "@tanstack/react-ai-devtools";

function App() {
  return (
    <>
      <Chat />
      <AiDevtoolsPanel />  {/* No-op in production */}
    </>
  );
}
```

### Lazy Loading

Dynamically import devtools to reduce bundle size:

```typescript
import { lazy, Suspense } from "react";

const AiDevtoolsPanel = lazy(() =>
  import("@tanstack/react-ai-devtools").then((m) => ({
    default: m.AiDevtoolsPanel,
  }))
);

function App() {
  return (
    <>
      <Chat />
      {process.env.NODE_ENV === "development" && (
        <Suspense fallback={null}>
          <AiDevtoolsPanel />
        </Suspense>
      )}
    </>
  );
}
```

### Embedded Panel

Embed devtools in a sidebar or custom debug UI:

```typescript
import { AiDevtoolsPanel } from "@tanstack/react-ai-devtools";

function DebugLayout({ children }) {
  const [showDebug, setShowDebug] = useState(false);

  return (
    <div className="layout">
      <main>{children}</main>
      {showDebug && (
        <aside className="debug-sidebar">
          <AiDevtoolsPanel />
        </aside>
      )}
      <button onClick={() => setShowDebug(!showDebug)}>
        Toggle Debug
      </button>
    </div>
  );
}
```

## Devtools Features

### Message Inspector

View all messages in the conversation:
- Message role (user/assistant/system)
- Message parts (text, images, tool calls, etc.)
- Timestamps and metadata
- Raw message structure

### Streaming Monitor

Monitor streaming in real-time:
- Chunk types (content, thinking, tool-call, tool-result, done)
- Chunk timing and sequence
- Connection status

### Tool Call Debugger

Inspect tool executions:
- Tool name and input parameters
- Execution status (pending, running, complete, error)
- Tool results and errors
- Approval workflow state

### State Inspector

View internal chat state:
- Current loading state
- Error state
- Connection configuration
- Tool registrations

## Complete Example

```typescript
"use client";

import { useState } from "react";
import { useChat } from "@tanstack/ai-react";
import { clientTools, fetchServerSentEvents, toolDefinition } from "@tanstack/ai-client";
import { AiDevtoolsPanel } from "@tanstack/react-ai-devtools";
import { z } from "zod";

const fetchDataDef = toolDefinition({
  name: "fetch_data",
  description: "Fetch data from API",
  inputSchema: z.object({ endpoint: z.string() }),
  outputSchema: z.object({ data: z.unknown() }),
});

export function DebugChat() {
  const [input, setInput] = useState("");

  const fetchData = fetchDataDef.client(async ({ endpoint }) => {
    const res = await fetch(endpoint);
    return { data: await res.json() };
  });

  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    tools: clientTools(fetchData),
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
        />
        <button type="submit" disabled={isLoading}>
          {isLoading ? "..." : "Send"}
        </button>
      </form>

      {/* Devtools - automatically no-op in production */}
      <AiDevtoolsPanel />
    </div>
  );
}
```

## Peer Dependencies

- `react` >= 18.0.0
- `@tanstack/ai-devtools-core` >= 0.1.1
- `@tanstack/devtools-utils` (installed automatically)

## Related

- [@tanstack/ai-react](ai-react.md) - React hooks for TanStack AI
- [React Guide](../react-guide.md) - Complete integration guide
- [TanStack Devtools](https://tanstack.com/devtools) - Unified devtools infrastructure

## References

[1]: https://github.com/TanStack/ai/blob/main/packages/typescript/react-ai-devtools/src/index.ts "react-ai-devtools index.ts"
[2]: https://github.com/TanStack/ai/blob/main/packages/typescript/react-ai-devtools/src/AiDevtools.tsx "AiDevtools.tsx source"
[3]: https://github.com/TanStack/ai/blob/main/packages/typescript/react-ai-devtools/src/plugin.tsx "plugin.tsx source"
