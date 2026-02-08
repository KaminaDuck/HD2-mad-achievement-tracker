---
title: "TanStack AI Provider Adapters"
description: "Provider adapter packages for TanStack AI - OpenAI, Gemini, Anthropic, Ollama"
type: "meta"
tags: ["index", "tanstack", "ai", "providers", "openai", "gemini", "anthropic", "ollama", "adapters"]
category: "typescript"
subcategory: "ai"
version: "1.0"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "TanStack AI Adapters"
    url: "https://tanstack.com/ai/latest/docs/adapters"
related: ["openai.md", "gemini.md", "../README.md", "../adapters.md"]
author: "unknown"
contributors: []
---

# TanStack AI Provider Adapters

Provider adapter packages for TanStack AI enabling integration with multiple LLM providers through a unified interface.

## Packages

### [@tanstack/ai-openai](openai.md) (v0.2.0)
OpenAI adapter providing access to GPT-4o, GPT-5, image generation (DALL-E), text-to-speech (TTS), and audio transcription (Whisper).

**Key exports:**
- `openaiText(model)` - Chat completions
- `openaiSummarize(model)` - Summarization
- `openaiImage(model)` - Image generation
- `openaiTTS(model)` - Text-to-speech
- `openaiTranscription(model)` - Audio transcription

### [@tanstack/ai-gemini](gemini.md) (v0.2.0)
Google Gemini adapter providing access to Gemini models, Imagen image generation, and experimental text-to-speech.

**Key exports:**
- `geminiText(model)` - Chat completions
- `geminiSummarize(model)` - Summarization
- `geminiImage(model)` - Image generation (Imagen)
- `geminiSpeech(model)` - Text-to-speech (experimental)

## Installation

```bash
# OpenAI adapter
npm install @tanstack/ai-openai

# Gemini adapter
npm install @tanstack/ai-gemini
```

## Usage Pattern

All adapters follow the same usage pattern:

```typescript
import { chat, toStreamResponse } from "@tanstack/ai";
import { openaiText } from "@tanstack/ai-openai";
// or: import { geminiText } from "@tanstack/ai-gemini";

const stream = chat({
  adapter: openaiText("gpt-4o"),
  messages: [{ role: "user", content: "Hello!" }],
});

return toStreamResponse(stream);
```

## Custom API Key

Use `create*` functions for custom API keys:

```typescript
import { chat } from "@tanstack/ai";
import { createOpenaiChat } from "@tanstack/ai-openai";

const adapter = createOpenaiChat(process.env.OPENAI_API_KEY!, {
  organization: "org-...", // Optional
});

const stream = chat({
  adapter: adapter("gpt-4o"),
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Additional Adapters

For other provider adapters, see the [main adapters reference](../adapters.md):

- **Anthropic** (`@tanstack/ai-anthropic`) - Claude models with extended thinking
- **Ollama** (`@tanstack/ai-ollama`) - Local LLM deployment

## Related Documentation

- [TanStack AI Overview](../overview.md) - Core concepts and architecture
- [TanStack AI Adapters Reference](../adapters.md) - Complete adapter comparison
- [Tools Guide](../tools-guide.md) - Tool definition patterns
- [Streaming Guide](../streaming.md) - Streaming architecture

## External Resources

- [TanStack AI Documentation](https://tanstack.com/ai/latest/docs)
- [GitHub Repository](https://github.com/TanStack/ai)
