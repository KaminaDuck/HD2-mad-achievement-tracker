---
title: "TanStack AI Overview"
description: "Lightweight, type-safe SDK for building production-ready AI experiences"
type: "framework-guide"
tags: ["tanstack", "ai", "llm", "typescript", "streaming", "tools", "openai", "anthropic", "react"]
category: "typescript"
subcategory: "ai"
version: "0.1"
last_updated: "2025-12-05"
status: "stable"
sources:
  - name: "TanStack AI Overview"
    url: "https://tanstack.com/ai/latest/docs/getting-started/overview"
  - name: "TanStack AI Home"
    url: "https://tanstack.com/ai/latest"
  - name: "TanStack AI GitHub"
    url: "https://github.com/TanStack/ai"
related: ["tools-guide.md", "adapters.md", "streaming.md", "react-guide.md", "multimodal.md", "../query/overview.md", "../router/overview.md"]
author: "unknown"
contributors: []
---

# TanStack AI Overview

TanStack AI is a lightweight, type-safe SDK for building production-ready AI experiences. It provides a framework-agnostic core with type-safe tool calling, streaming capabilities, and dedicated React and Solid integrations for multiple LLM providers. ([TanStack AI Overview][1])

## What Is TanStack AI?

TanStack AI is designed to simplify building AI-powered applications with:

- **Type Safety**: Full TypeScript support with Zod schema inference for tools and messages ([TanStack AI Overview][1])
- **Streaming**: Built-in real-time response support using async iterables ([TanStack AI Overview][1])
- **Isomorphic Tools**: Single tool definition with environment-specific `.server()` or `.client()` implementations ([TanStack AI Overview][1])
- **Framework Agnostic**: Core library works across any JavaScript environment ([TanStack AI Overview][1])
- **Multiple Providers**: Supports OpenAI, Anthropic, Gemini, and Ollama out of the box ([TanStack AI Home][2])
- **Approval Workflows**: Built-in tool approval flow handling for user consent ([TanStack AI Overview][1])
- **Automatic Execution**: Both server and client tools execute without manual intervention ([TanStack AI Overview][1])

## Core Packages

### @tanstack/ai

The core library providing adapters, chat completion, streaming, and tool definitions. This is the foundation package used on the server side. ([TanStack AI Overview][1])

```bash
npm install @tanstack/ai
```

### @tanstack/ai-client

Framework-agnostic headless client managing chat state, messages, and connection adapters. Used for building custom client implementations. ([TanStack AI Overview][1])

```bash
npm install @tanstack/ai-client
```

### @tanstack/ai-react

React hooks including `useChat` with automatic state management for React applications. ([TanStack AI Overview][1])

```bash
npm install @tanstack/ai-react
```

### @tanstack/ai-solid

Solid equivalents of React hooks for Solid.js applications. ([TanStack AI Overview][1])

```bash
npm install @tanstack/ai-solid
```

## Provider Adapters

Install the adapter for your LLM provider:

```bash
# OpenAI
npm install @tanstack/ai-openai

# Anthropic (Claude)
npm install @tanstack/ai-anthropic

# Google Gemini
npm install @tanstack/ai-gemini

# Ollama (local)
npm install @tanstack/ai-ollama
```

## Framework Support

TanStack AI targets modern server frameworks: ([TanStack AI Overview][1])

| Framework | Support |
|-----------|---------|
| Next.js | API routes and App Router |
| TanStack Start | React Start or Solid Start (recommended) |
| Express | Node.js server |
| Remix Router v7 | Loaders and actions |

## Key Features

### Type Safety

Complete type safety across providers, models, and options from end to end. No `as const` needed—full TypeScript inference from Zod schemas. ([TanStack AI Home][2])

### Unified API

Same interface across all providers. Standalone functions with automatic type inference from adapters. Switch providers at runtime without code changes. ([TanStack AI Home][2])

### Tool/Function Calling

Automatic execution loop with no manual tool management needed. Define tools once, implement for server or client environments. ([TanStack AI Home][2])

### Thinking & Reasoning

Full support for thinking models (like Claude's extended thinking). Thinking tokens are streamed to clients and displayed separately. ([TanStack AI Home][2])

### DevTools

Real-time visibility into AI connections with next-generation DevTools. ([TanStack AI Home][2])

## Basic Usage

### Server-Side Chat

```typescript
import { chat } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

const adapter = openai({
  apiKey: process.env.OPENAI_API_KEY!,
});

const stream = chat({
  adapter,
  messages: [{ role: "user", content: "Hello!" }],
  model: "gpt-4o",
});

for await (const chunk of stream) {
  console.log(chunk);
}
```

### With Tools

```typescript
import { chat, toolDefinition } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";
import { z } from "zod";

const getWeatherDef = toolDefinition({
  name: "get_weather",
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City and state"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
});

const getWeather = getWeatherDef.server(async ({ location }) => {
  // Fetch weather data
  return { temperature: 72, conditions: "sunny" };
});

const stream = chat({
  adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
  messages: [{ role: "user", content: "What's the weather in SF?" }],
  model: "gpt-4o",
  tools: [getWeather],
});
```

### HTTP Endpoint

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

## When to Use TanStack AI

TanStack AI is ideal for applications that need:

- **Type-Safe AI Integration**: Full TypeScript support with runtime validation
- **Multi-Provider Support**: Ability to switch between OpenAI, Anthropic, Gemini, or Ollama
- **Streaming Responses**: Real-time response streaming with proper chunking
- **Tool/Function Calling**: Complex AI workflows with tool execution
- **Framework Flexibility**: Works with any JavaScript framework or runtime
- **Approval Workflows**: User consent flows for sensitive tool operations

## Project Status

TanStack AI is currently in **alpha** status with active development. The API may change before reaching v1.0. ([TanStack AI Home][2])

**Statistics:**
- GitHub: 24+ stars
- Contributors: 9+
- License: MIT

## Integration with TanStack Ecosystem

TanStack AI integrates seamlessly with other TanStack libraries:

- **TanStack Query**: Use for caching and background refetching of AI responses
- **TanStack Router**: Route-based AI interactions with type-safe navigation
- **TanStack Form**: Form-based AI inputs with validation
- **TanStack Start**: Full-stack AI applications with SSR support

## Links

[1]: https://tanstack.com/ai/latest/docs/getting-started/overview "TanStack AI Overview"
[2]: https://tanstack.com/ai/latest "TanStack AI Home"
[3]: https://github.com/TanStack/ai "TanStack AI GitHub"
