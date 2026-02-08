---
title: "@tanstack/ai-openai Reference"
description: "OpenAI adapter for TanStack AI - GPT models, image generation, TTS, and transcription"
type: "api-reference"
tags: ["tanstack", "ai", "openai", "gpt", "gpt-4o", "tts", "whisper", "adapter"]
category: "typescript"
subcategory: "ai"
version: "0.2.0"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "TanStack AI OpenAI Docs"
    url: "https://tanstack.com/ai/latest/docs/adapters/openai"
  - name: "NPM Package"
    url: "https://www.npmjs.com/package/@tanstack/ai-openai"
related: ["README.md", "gemini.md", "../adapters.md", "../overview.md"]
author: "unknown"
contributors: []
---

# @tanstack/ai-openai

OpenAI adapter for TanStack AI providing access to GPT-4o, GPT-5, image generation (DALL-E), text-to-speech (TTS), and audio transcription (Whisper).

**Current version:** 0.2.0
**Package:** `@tanstack/ai-openai`

## Installation

```bash
npm install @tanstack/ai-openai
```

## Basic Usage

```typescript
import { chat } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

const stream = chat({
  adapter: openaiText("gpt-4o"),
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Basic Usage - Custom API Key

```typescript
import { chat } from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";

const adapter = createOpenaiChat(process.env.OPENAI_API_KEY!, {
  // ... your config options
});

const stream = chat({
  adapter: adapter("gpt-4o"),
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Configuration

```typescript
import { createOpenaiChat, type OpenAIChatConfig } from "@tanstack/ai-openai";

const config: Omit<OpenAIChatConfig, 'apiKey'> = {
  organization: "org-...", // Optional
  baseURL: "https://api.openai.com/v1", // Optional, for custom endpoints
};

const adapter = createOpenaiChat(process.env.OPENAI_API_KEY!, config);
```

## Example: Chat Completion

```typescript
import { chat, toStreamResponse } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";

export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: openaiText("gpt-4o"),
    messages,
  });

  return toStreamResponse(stream);
}
```

## Example: With Tools

```typescript
import { chat, toolDefinition } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
import { z } from "zod";

const getWeatherDef = toolDefinition({
  name: "get_weather",
  description: "Get the current weather",
  inputSchema: z.object({
    location: z.string(),
  }),
});

const getWeather = getWeatherDef.server(async ({ location }) => {
  // Fetch weather data
  return { temperature: 72, conditions: "sunny" };
});

const stream = chat({
  adapter: openaiText("gpt-4o"),
  messages,
  tools: [getWeather],
});
```

## Model Options

OpenAI supports various model-specific options:

```typescript
const stream = chat({
  adapter: openaiText("gpt-4o"),
  messages,
  modelOptions: {
    temperature: 0.7,
    max_tokens: 1000,
    top_p: 0.9,
    frequency_penalty: 0.5,
    presence_penalty: 0.5,
    stop: ["END"],
  },
});
```

## Reasoning

Enable reasoning for models that support it (e.g., GPT-5, O3). This allows the model to show its reasoning process, which is streamed as thinking chunks:

```typescript
modelOptions: {
  reasoning: {
    effort: "medium", // "none" | "minimal" | "low" | "medium" | "high"
    summary: "detailed", // "auto" | "detailed" (optional)
  },
}
```

When reasoning is enabled, the model's reasoning process is streamed separately from the response text and appears as a collapsible thinking section in the UI.

## Summarization

Summarize long text content:

```typescript
import { summarize } from "@tanstack/ai";
import { openaiSummarize } from "@tanstack/ai-openai";

const result = await summarize({
  adapter: openaiSummarize("gpt-4o-mini"),
  text: "Your long text to summarize...",
  maxLength: 100,
  style: "concise", // "concise" | "bullet-points" | "paragraph"
});

console.log(result.summary);
```

## Image Generation

Generate images with DALL-E:

```typescript
import { generateImage } from "@tanstack/ai";
import { openaiImage } from "@tanstack/ai-openai";

const result = await generateImage({
  adapter: openaiImage("gpt-image-1"),
  prompt: "A futuristic cityscape at sunset",
  numberOfImages: 1,
  size: "1024x1024",
});

console.log(result.images);
```

### Image Model Options

```typescript
const result = await generateImage({
  adapter: openaiImage("gpt-image-1"),
  prompt: "...",
  modelOptions: {
    quality: "hd", // "standard" | "hd"
    style: "natural", // "natural" | "vivid"
  },
});
```

## Text-to-Speech

Generate speech from text:

```typescript
import { generateSpeech } from "@tanstack/ai";
import { openaiTTS } from "@tanstack/ai-openai";

const result = await generateSpeech({
  adapter: openaiTTS("tts-1"),
  text: "Hello, welcome to TanStack AI!",
  voice: "alloy",
  format: "mp3",
});

// result.audio contains base64-encoded audio
console.log(result.format); // "mp3"
```

### TTS Voices

Available voices: `alloy`, `echo`, `fable`, `onyx`, `nova`, `shimmer`, `ash`, `ballad`, `coral`, `sage`, `verse`

### TTS Model Options

```typescript
const result = await generateSpeech({
  adapter: openaiTTS("tts-1-hd"),
  text: "High quality speech",
  modelOptions: {
    speed: 1.0, // 0.25 to 4.0
  },
});
```

## Transcription

Transcribe audio to text:

```typescript
import { generateTranscription } from "@tanstack/ai";
import { openaiTranscription } from "@tanstack/ai-openai";

const result = await generateTranscription({
  adapter: openaiTranscription("whisper-1"),
  audio: audioFile, // File object or base64 string
  language: "en",
});

console.log(result.text); // Transcribed text
```

### Transcription Model Options

```typescript
const result = await generateTranscription({
  adapter: openaiTranscription("whisper-1"),
  audio: audioFile,
  modelOptions: {
    response_format: "verbose_json", // Get timestamps
    temperature: 0,
    prompt: "Technical terms: API, SDK",
  },
});

// Access segments with timestamps
console.log(result.segments);
```

## Environment Variables

Set your API key in environment variables:

```bash
OPENAI_API_KEY=sk-...
```

## API Reference

### Exports

| Export | Description |
|--------|-------------|
| `openaiText(model)` | Chat adapter using env API key |
| `createOpenaiChat(apiKey, config?)` | Create chat adapter with custom API key |
| `openaiSummarize(model)` | Summarization adapter |
| `createOpenaiSummarize(apiKey, config?)` | Summarization with custom API key |
| `openaiImage(model)` | Image generation adapter |
| `createOpenaiImage(apiKey, config?)` | Image generation with custom API key |
| `openaiTTS(model)` | Text-to-speech adapter |
| `createOpenaiTTS(apiKey, config?)` | TTS with custom API key |
| `openaiTranscription(model)` | Transcription adapter |
| `createOpenaiTranscription(apiKey, config?)` | Transcription with custom API key |

## Related

- [TanStack AI Adapters](../adapters.md) - All provider adapters
- [Google Gemini Adapter](gemini.md) - Gemini adapter reference
- [TanStack AI Overview](../overview.md) - Core concepts
- [Tools Guide](../tools-guide.md) - Tool definitions

## External Resources

- [TanStack AI OpenAI Docs](https://tanstack.com/ai/latest/docs/adapters/openai)
- [OpenAI API Documentation](https://platform.openai.com/docs)
