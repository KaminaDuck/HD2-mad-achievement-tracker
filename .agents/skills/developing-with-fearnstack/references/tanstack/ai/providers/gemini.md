---
title: "@tanstack/ai-gemini Reference"
description: "Google Gemini adapter for TanStack AI - text generation, Imagen, and TTS"
type: "api-reference"
tags: ["tanstack", "ai", "gemini", "google", "imagen", "tts", "adapter"]
category: "typescript"
subcategory: "ai"
version: "0.2.0"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "TanStack AI Gemini Docs"
    url: "https://tanstack.com/ai/latest/docs/adapters/gemini"
  - name: "NPM Package"
    url: "https://www.npmjs.com/package/@tanstack/ai-gemini"
related: ["README.md", "openai.md", "../adapters.md", "../overview.md"]
author: "unknown"
contributors: []
---

# @tanstack/ai-gemini

Google Gemini adapter for TanStack AI providing access to Google's Gemini models, including text generation, image generation with Imagen, and experimental text-to-speech.

**Current version:** 0.2.0
**Package:** `@tanstack/ai-gemini`

## Installation

```bash
npm install @tanstack/ai-gemini
```

## Basic Usage

```typescript
import { chat } from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";

const stream = chat({
  adapter: geminiText("gemini-2.5-pro"),
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Basic Usage - Custom API Key

```typescript
import { chat } from "@tanstack/ai";
import { createGeminiChat } from "@tanstack/ai-gemini";

const adapter = createGeminiChat(process.env.GEMINI_API_KEY!, {
  // ... your config options
});

const stream = chat({
  adapter: adapter("gemini-2.5-pro"),
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Configuration

```typescript
import { createGeminiChat, type GeminiChatConfig } from "@tanstack/ai-gemini";

const config: Omit<GeminiChatConfig, 'apiKey'> = {
  baseURL: "https://generativelanguage.googleapis.com/v1beta", // Optional
};

const adapter = createGeminiChat(process.env.GEMINI_API_KEY!, config);
```

## Example: Chat Completion

```typescript
import { chat, toStreamResponse } from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: geminiText("gemini-2.5-pro"),
    messages,
  });

  return toStreamResponse(stream);
}
```

## Example: With Tools

```typescript
import { chat, toolDefinition } from "@tanstack/ai";
import { geminiText } from "@tanstack/ai-gemini";
import { z } from "zod";

const getCalendarEventsDef = toolDefinition({
  name: "get_calendar_events",
  description: "Get calendar events for a date",
  inputSchema: z.object({
    date: z.string(),
  }),
});

const getCalendarEvents = getCalendarEventsDef.server(async ({ date }) => {
  // Fetch calendar events
  return { events: [] };
});

const stream = chat({
  adapter: geminiText("gemini-2.5-pro"),
  messages,
  tools: [getCalendarEvents],
});
```

## Model Options

Gemini supports various model-specific options:

```typescript
const stream = chat({
  adapter: geminiText("gemini-2.5-pro"),
  messages,
  modelOptions: {
    maxOutputTokens: 2048,
    temperature: 0.7,
    topP: 0.9,
    topK: 40,
    stopSequences: ["END"],
  },
});
```

## Thinking

Enable thinking for models that support it:

```typescript
modelOptions: {
  thinking: {
    includeThoughts: true,
  },
}
```

## Structured Output

Configure structured output format:

```typescript
modelOptions: {
  responseMimeType: "application/json",
}
```

## Summarization

Summarize long text content:

```typescript
import { summarize } from "@tanstack/ai";
import { geminiSummarize } from "@tanstack/ai-gemini";

const result = await summarize({
  adapter: geminiSummarize("gemini-2.5-pro"),
  text: "Your long text to summarize...",
  maxLength: 100,
  style: "concise", // "concise" | "bullet-points" | "paragraph"
});

console.log(result.summary);
```

## Image Generation

Generate images with Imagen:

```typescript
import { generateImage } from "@tanstack/ai";
import { geminiImage } from "@tanstack/ai-gemini";

const result = await generateImage({
  adapter: geminiImage("imagen-3.0-generate-002"),
  prompt: "A futuristic cityscape at sunset",
  numberOfImages: 1,
});

console.log(result.images);
```

### Image Model Options

```typescript
const result = await generateImage({
  adapter: geminiImage("imagen-3.0-generate-002"),
  prompt: "...",
  modelOptions: {
    aspectRatio: "16:9", // "1:1" | "3:4" | "4:3" | "9:16" | "16:9"
    personGeneration: "DONT_ALLOW", // Control person generation
    safetyFilterLevel: "BLOCK_SOME", // Safety filtering
  },
});
```

## Text-to-Speech (Experimental)

> **Note:** Gemini TTS is experimental and may require the Live API for full functionality.

Generate speech from text:

```typescript
import { generateSpeech } from "@tanstack/ai";
import { geminiSpeech } from "@tanstack/ai-gemini";

const result = await generateSpeech({
  adapter: geminiSpeech("gemini-2.5-flash-preview-tts"),
  text: "Hello from Gemini TTS!",
});

console.log(result.audio); // Base64 encoded audio
```

## Environment Variables

Set your API key in environment variables:

```bash
GEMINI_API_KEY=your-api-key-here
# or
GOOGLE_API_KEY=your-api-key-here
```

## API Reference

### Exports

| Export | Description |
|--------|-------------|
| `geminiText(model)` | Chat adapter using env API key |
| `createGeminiText(apiKey, config?)` | Create chat adapter with custom API key |
| `geminiSummarize(model)` | Summarization adapter |
| `createGeminiSummarize(apiKey, config?)` | Summarization with custom API key |
| `geminiImage(model)` | Image generation adapter (Imagen) |
| `createGeminiImage(apiKey, config?)` | Image generation with custom API key |
| `geminiTTS(model)` | Text-to-speech adapter (experimental) |
| `createGeminiTTS(apiKey, config?)` | TTS with custom API key |

## Related

- [TanStack AI Adapters](../adapters.md) - All provider adapters
- [OpenAI Adapter](openai.md) - OpenAI adapter reference
- [TanStack AI Overview](../overview.md) - Core concepts
- [Tools Guide](../tools-guide.md) - Tool definitions

## External Resources

- [TanStack AI Gemini Docs](https://tanstack.com/ai/latest/docs/adapters/gemini)
- [Google AI Studio](https://aistudio.google.com)
- [Gemini API Documentation](https://ai.google.dev/docs)
