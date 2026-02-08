---
title: "TanStack AI Adapters Reference"
description: "Provider adapters for OpenAI, Anthropic, Gemini, and Ollama"
type: "api-reference"
tags: ["tanstack", "ai", "openai", "anthropic", "claude", "gemini", "ollama", "adapters", "llm"]
category: "typescript"
subcategory: "ai"
version: "0.1"
last_updated: "2025-12-05"
status: "stable"
sources:
  - name: "TanStack AI OpenAI Adapter"
    url: "https://tanstack.com/ai/latest/docs/adapters/openai"
  - name: "TanStack AI Anthropic Adapter"
    url: "https://tanstack.com/ai/latest/docs/adapters/anthropic"
  - name: "TanStack AI Gemini Adapter"
    url: "https://tanstack.com/ai/latest/docs/adapters/gemini"
  - name: "TanStack AI Ollama Adapter"
    url: "https://tanstack.com/ai/latest/docs/adapters/ollama"
related: ["overview.md", "tools-guide.md", "streaming.md"]
author: "unknown"
contributors: []
---

# TanStack AI Adapters Reference

TanStack AI provides adapter packages for major LLM providers. Each adapter normalizes the provider's API to a unified interface, allowing you to switch providers without changing application code. ([TanStack AI Overview][5])

## OpenAI Adapter

### Installation

```bash
npm install @tanstack/ai-openai
```

### Configuration

```typescript
import { openai } from "@tanstack/ai-openai";

const adapter = openai({
  apiKey: process.env.OPENAI_API_KEY!,
  organization: "org-xxx", // Optional
  baseURL: "https://api.openai.com/v1", // Optional custom endpoint
});
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your OpenAI API key |
| `organization` | `string` | No | Organization ID for API requests |
| `baseURL` | `string` | No | Custom endpoint URL |

### Supported Models

**Chat Models:** ([TanStack AI OpenAI Adapter][1])
- `gpt-4o` (latest GPT-4)
- `gpt-4o-mini` (faster, cost-effective)
- `gpt-4-turbo`
- `gpt-4`
- `gpt-3.5-turbo`

**Image Generation:**
- `dall-e-3`
- `dall-e-2`

**Embeddings:**
- `text-embedding-3-large`
- `text-embedding-3-small`
- `text-embedding-ada-002`

### Usage Example

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
```

### Provider Options

```typescript
const stream = chat({
  adapter,
  messages,
  model: "gpt-4o",
  providerOptions: {
    temperature: 0.7,
    maxTokens: 1000,
    topP: 0.9,
    frequencyPenalty: 0,
    presencePenalty: 0,
  },
});
```

---

## Anthropic Adapter

### Installation

```bash
npm install @tanstack/ai-anthropic
```

### Configuration

```typescript
import { anthropic } from "@tanstack/ai-anthropic";

const adapter = anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});
```

### Supported Models

**Claude Models:** ([TanStack AI Anthropic Adapter][2])
- `claude-3-5-sonnet-20241022` (latest)
- `claude-3-5-sonnet-20240620`
- `claude-3-opus-20240229`
- `claude-3-sonnet-20240229`
- `claude-3-haiku-20240307`
- `claude-2.1`
- `claude-2.0`

### Usage Example

```typescript
import { chat } from "@tanstack/ai";
import { anthropic } from "@tanstack/ai-anthropic";

const adapter = anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const stream = chat({
  adapter,
  messages: [{ role: "user", content: "Hello!" }],
  model: "claude-3-5-sonnet-20241022",
});
```

### Extended Thinking

Claude models support extended thinking, where the model's reasoning process is streamed separately from the response text. Enable with token budgets up to 2048 tokens. ([TanStack AI Anthropic Adapter][2])

```typescript
const stream = chat({
  adapter,
  messages,
  model: "claude-3-5-sonnet-20241022",
  providerOptions: {
    thinking: {
      type: "enabled",
      budgetTokens: 2048,
    },
  },
});
```

Thinking chunks appear as a collapsible section in the UI and are excluded from subsequent model communications.

### Prompt Caching

Cache prompts for improved performance with TTL options: ([TanStack AI Anthropic Adapter][2])

```typescript
const stream = chat({
  adapter,
  messages,
  model: "claude-3-5-sonnet-20241022",
  providerOptions: {
    caching: {
      ttl: "5m", // or "1h"
    },
  },
});
```

---

## Gemini Adapter

### Installation

```bash
npm install @tanstack/ai-gemini
```

### Configuration

```typescript
import { gemini } from "@tanstack/ai-gemini";

const adapter = gemini({
  apiKey: process.env.GEMINI_API_KEY!,
  baseURL: "https://generativelanguage.googleapis.com/v1", // Optional
});
```

### Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | Yes | Your Google Gemini API key |
| `baseURL` | `string` | No | Custom endpoint for API calls |

### Supported Models

([TanStack AI Gemini Adapter][3])
- `gemini-pro` (base model)
- `gemini-pro-vision` (vision/image processing)
- `gemini-ultra` (advanced, when available)

### Usage Example

```typescript
import { chat } from "@tanstack/ai";
import { gemini } from "@tanstack/ai-gemini";

const adapter = gemini({
  apiKey: process.env.GEMINI_API_KEY!,
});

const stream = chat({
  adapter,
  messages: [{ role: "user", content: "Hello!" }],
  model: "gemini-pro",
});
```

### Provider Options

```typescript
const stream = chat({
  adapter,
  messages,
  model: "gemini-pro",
  providerOptions: {
    temperature: 0.7,
    maxOutputTokens: 1000,
    topP: 0.9,
    topK: 40,
  },
});
```

### Getting API Keys

Access Google's API key management through [Google AI Studio](https://makersuite.google.com/app/apikey). ([TanStack AI Gemini Adapter][3])

---

## Ollama Adapter

Ollama enables running LLMs locally without API costs or data leaving your machine.

### Installation

```bash
npm install @tanstack/ai-ollama
```

### Configuration

```typescript
import { ollama } from "@tanstack/ai-ollama";

const adapter = ollama({
  baseURL: "http://localhost:11434", // Default Ollama server
});
```

No API key is required for local Ollama instances. ([TanStack AI Ollama Adapter][4])

### Local Development Setup

1. **Install Ollama:**
   ```bash
   # macOS (Homebrew)
   brew install ollama

   # Linux
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull a model:**
   ```bash
   ollama pull llama3
   ```

3. **Start server:**
   ```bash
   ollama serve
   ```

### Supported Models

Available models depend on your local installation. Common options: ([TanStack AI Ollama Adapter][4])
- `llama2`, `llama3`
- `mistral`
- `codellama`
- `phi`, `gemma`

Check installed models with `ollama list`.

### Usage Example

```typescript
import { chat } from "@tanstack/ai";
import { ollama } from "@tanstack/ai-ollama";

const adapter = ollama({
  baseURL: "http://localhost:11434",
});

const stream = chat({
  adapter,
  messages: [{ role: "user", content: "Hello!" }],
  model: "llama3",
});
```

### Provider Options

```typescript
const stream = chat({
  adapter,
  messages,
  model: "llama3",
  providerOptions: {
    temperature: 0.7,
    numPredict: 1000, // Max tokens
    topP: 0.9,
    topK: 40,
  },
});
```

### Benefits of Ollama

- **Privacy**: Data remains on your machine ([TanStack AI Ollama Adapter][4])
- **No API costs**: Run unlimited requests locally
- **Model customization**: Fine-tune and create custom models
- **Offline functionality**: Works without internet connection

---

## Provider Comparison

| Feature | OpenAI | Anthropic | Gemini | Ollama |
|---------|--------|-----------|--------|--------|
| API Key Required | Yes | Yes | Yes | No |
| Local Deployment | No | No | No | Yes |
| Streaming | Yes | Yes | Yes | Yes |
| Tool Calling | Yes | Yes | Yes | Model-dependent |
| Extended Thinking | No | Yes | No | No |
| Vision/Images | Yes | Yes | Yes | Model-dependent |
| Audio | Preview | No | Yes | No |

## Multimodal Support by Provider

| Provider | Text | Image | Audio | Video | Document |
|----------|------|-------|-------|-------|----------|
| OpenAI | Yes | Yes | Preview | No | No |
| Anthropic | Yes | Yes | No | No | Yes (PDF) |
| Gemini | Yes | Yes | Yes | Yes | Yes |
| Ollama | Yes | Model-dependent | No | No | No |

## Switching Providers

TanStack AI's unified API makes switching providers straightforward:

```typescript
import { chat } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";
import { anthropic } from "@tanstack/ai-anthropic";

// Configuration-driven provider selection
const getAdapter = () => {
  if (process.env.USE_ANTHROPIC) {
    return anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  }
  return openai({ apiKey: process.env.OPENAI_API_KEY! });
};

const stream = chat({
  adapter: getAdapter(),
  messages,
  model: process.env.USE_ANTHROPIC ? "claude-3-5-sonnet-20241022" : "gpt-4o",
});
```

## Links

[1]: https://tanstack.com/ai/latest/docs/adapters/openai "TanStack AI OpenAI Adapter"
[2]: https://tanstack.com/ai/latest/docs/adapters/anthropic "TanStack AI Anthropic Adapter"
[3]: https://tanstack.com/ai/latest/docs/adapters/gemini "TanStack AI Gemini Adapter"
[4]: https://tanstack.com/ai/latest/docs/adapters/ollama "TanStack AI Ollama Adapter"
[5]: https://tanstack.com/ai/latest/docs/getting-started/overview "TanStack AI Overview"
