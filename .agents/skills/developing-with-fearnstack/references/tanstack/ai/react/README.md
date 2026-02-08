---
title: "TanStack AI React Addons"
description: "React packages for TanStack AI - hooks, UI components, and devtools"
type: "meta"
tags: ["index", "tanstack", "ai", "react", "hooks", "ui", "components", "devtools"]
category: "typescript"
subcategory: "ai"
version: "1.0"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "NPM @tanstack/ai-react"
    url: "https://www.npmjs.com/package/@tanstack/ai-react"
  - name: "NPM @tanstack/ai-react-ui"
    url: "https://www.npmjs.com/package/@tanstack/ai-react-ui"
  - name: "NPM @tanstack/react-ai-devtools"
    url: "https://www.npmjs.com/package/@tanstack/react-ai-devtools"
related: ["ai-react.md", "ai-react-ui.md", "devtools.md", "../README.md", "../react-guide.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# TanStack AI React Addons

React-specific packages for TanStack AI providing hooks for chat state management, headless UI components, and development tools for debugging AI applications.

## Packages

### [@tanstack/ai-react](ai-react.md) (v0.2.0)
React hooks for building AI chat interfaces with automatic state management, streaming support, and type-safe tool integration. ([TanStack AI React Docs][1])

**Key exports:**
- `useChat` - Primary hook for chat state management ([API Reference][1])
- `clientTools` - Register client-side tool implementations ([Client Tools Guide][2])
- `createServerFnTool` - TanStack Start integration for shared tool implementations

### [@tanstack/ai-react-ui](ai-react-ui.md) (v0.2.0)
Headless React components for building AI chat interfaces. Like Radix for AI chat - fully functional, completely unstyled. ([Alpha 2 Announcement][3])

> **Note:** Official API documentation for `@tanstack/ai-react-ui` is not yet published. Component details derived from source code. ([GitHub Source][4])

**Key exports:**
- `Chat` - Root container with context provider
- `ChatMessages` - Message list container
- `ChatMessage` - Individual message with parts rendering
- `ChatInput` - Input component with render props
- `ToolApproval` - Tool approval workflow component ([Tool Approval Guide][5])
- `TextPart`, `ThinkingPart` - Content part components

### [@tanstack/react-ai-devtools](devtools.md) (v0.1.1)
Development tools for debugging and inspecting TanStack AI chat applications. ([Devtools Guide][6])

**Key exports:**
- `AIDevtools` - Devtools panel component ([Devtools Guide][6])
- `AIDevtoolsPanel` - Standalone devtools panel

## Installation

```bash
# React hooks (required for React apps)
npm install @tanstack/ai-react

# Headless UI components (optional)
npm install @tanstack/ai-react-ui

# Devtools (development only)
npm install @tanstack/react-ai-devtools
```

## Quick Start

### With Hooks (ai-react)

```typescript
import { useChat } from "@tanstack/ai-react";
import { fetchServerSentEvents } from "@tanstack/ai-client";

function App() {
  const { messages, sendMessage, isLoading } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  return <ChatUI messages={messages} onSend={sendMessage} loading={isLoading} />;
}
```

### With UI Components (ai-react-ui)

```typescript
import { Chat, ChatMessages, ChatMessage, ChatInput } from "@tanstack/ai-react-ui";
import { fetchServerSentEvents } from "@tanstack/ai-client";

function App() {
  return (
    <Chat connection={fetchServerSentEvents("/api/chat")}>
      <ChatMessages>
        {(message) => <ChatMessage message={message} />}
      </ChatMessages>
      <ChatInput placeholder="Type a message..." />
    </Chat>
  );
}
```

## Related Documentation

- [TanStack AI Overview](../overview.md) - Core concepts and architecture
- [TanStack AI React Guide](../react-guide.md) - Complete React integration guide
- [TanStack AI Tools Guide](../tools-guide.md) - Tool definition patterns
- [TanStack AI Streaming](../streaming.md) - Streaming architecture

## External Resources

- [Official Documentation](https://tanstack.com/ai/latest/docs/framework/react/overview)
- [GitHub Repository](https://github.com/TanStack/ai)
- [Discord Community](https://discord.com/invite/tanstack)

## References

[1]: https://tanstack.com/ai/latest/docs/api/ai-react "TanStack AI React API Reference"
[2]: https://tanstack.com/ai/latest/docs/guides/client-tools "TanStack AI Client Tools Guide"
[3]: https://tanstack.com/blog/tanstack-ai-alpha-2 "TanStack AI Alpha 2 Announcement"
[4]: https://github.com/TanStack/ai/tree/main/packages/typescript/ai-react-ui "ai-react-ui GitHub Source"
[5]: https://tanstack.com/ai/latest/docs/guides/tool-approval "TanStack AI Tool Approval Guide"
[6]: https://tanstack.com/ai/latest/docs/getting-started/devtools "TanStack AI Devtools Guide"
