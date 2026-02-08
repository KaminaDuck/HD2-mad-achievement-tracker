---
title: "TanStack AI Reference Index"
description: "Lightweight, type-safe SDK for building AI experiences"
type: "meta"
tags: ["index", "tanstack", "ai", "llm", "streaming", "tools"]
category: "typescript"
subcategory: "ai"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources: []
related: ["overview.md", "tools-guide.md", "adapters.md", "streaming.md", "react-guide.md", "multimodal.md", "versions.md", "react/README.md", "../query/README.md", "../router/README.md", "../form/README.md", "../db/README.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# TanStack AI Reference Index

Comprehensive reference documentation for TanStack AI, a lightweight, type-safe SDK for building production-ready AI experiences with streaming, tool calling, and multi-provider support.

## Documentation Files

### [Overview](overview.md)
Introduction to TanStack AI covering core features, packages, framework support, installation, and basic usage patterns.

### [Tools Guide](tools-guide.md)
Complete guide to type-safe tool definitions including:
- Tool definition pattern with `toolDefinition()`
- Server-side tools with `.server()`
- Client-side tools with `.client()`
- Hybrid tools for both environments
- Tool approval workflows
- Input/output schemas with Zod

### [Adapters Reference](adapters.md)
Provider adapter documentation for:
- OpenAI (GPT-4o, GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku)
- Google Gemini (Pro, Pro Vision, Ultra)
- Ollama (local LLM deployment)
- Provider comparison and switching patterns

### [Streaming Guide](streaming.md)
Real-time streaming documentation covering:
- Async iterable streaming
- Stream chunk types (content, thinking, tool-call, tool-result, done)
- `toStreamResponse()` utility
- Connection adapters (SSE, HTTP Stream)
- Framework integration patterns

### [React Guide](react-guide.md)
React integration guide including:
- `useChat` hook usage and configuration
- Message rendering patterns
- Client-side tools with `clientTools()`
- Tool approval workflows in React
- State management and error handling
- Complete chat component examples

### [Multimodal Content](multimodal.md)
Multimodal support documentation for:
- Image handling (base64 and URL)
- Document support (PDFs)
- Audio and video content
- Provider support matrix
- React file upload patterns

## React Addons

### [React Addons Index](react/README.md)
React-specific packages for TanStack AI:

- **[@tanstack/ai-react](react/ai-react.md)** (v0.2.0) - React hooks for chat state management, streaming, and client-side tools
- **[@tanstack/ai-react-ui](react/ai-react-ui.md)** (v0.2.0) - Headless React components for building AI chat interfaces
- **[@tanstack/react-ai-devtools](react/devtools.md)** (v0.1.1) - Development tools for debugging AI chat applications

## Provider Adapters

### [Provider Adapters Index](providers/README.md)
Provider adapter packages for integrating with LLM services:

- **[@tanstack/ai-openai](providers/openai.md)** (v0.2.0) - OpenAI adapter for GPT-4o, DALL-E, embeddings, and TTS
- **[@tanstack/ai-gemini](providers/gemini.md)** (v0.2.0) - Google Gemini adapter with multimodal support (images, video, audio, PDFs)

For additional adapters (Anthropic, Ollama), see the [Adapters Reference](adapters.md).

## Related TanStack References

- [TanStack Query Overview](../query/overview.md) - Async state management
- [TanStack Query React Guide](../query/react-guide.md) - React integration for Query
- [TanStack Router Overview](../router/overview.md) - Type-safe routing
- [TanStack Router React Guide](../router/react-guide.md) - React routing integration
- [TanStack Form Overview](../form/overview.md) - Type-safe forms
- [TanStack Form React Guide](../form/react-guide.md) - React form integration
- [TanStack DB Overview](../db/overview.md) - Client-side database

## Quick Start

### Installation

```bash
# Core packages
npm install @tanstack/ai @tanstack/ai-client @tanstack/ai-react

# Provider adapter (choose one)
npm install @tanstack/ai-openai
npm install @tanstack/ai-anthropic
npm install @tanstack/ai-gemini
npm install @tanstack/ai-ollama
```

### Server Setup

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

### React Client

```typescript
import { useChat } from "@tanstack/ai-react";
import { fetchServerSentEvents } from "@tanstack/ai-client";

function Chat() {
  const { messages, input, setInput, submit, isStreaming } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>{m.content}</div>
      ))}
      <input value={input} onChange={(e) => setInput(e.target.value)} />
      <button onClick={submit} disabled={isStreaming}>Send</button>
    </div>
  );
}
```

## External Resources

- [Official Documentation](https://tanstack.com/ai/latest/docs)
- [GitHub Repository](https://github.com/TanStack/ai)
- [TanStack Discord](https://discord.com/invite/tanstack)
