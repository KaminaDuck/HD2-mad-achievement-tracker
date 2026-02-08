---
title: "TanStack AI Providers Version Log"
description: "Version history for @tanstack/ai-openai, @tanstack/ai-gemini, @tanstack/ai-anthropic, @tanstack/ai-ollama"
type: "meta"
tags: ["changelog", "versions", "tanstack", "ai", "providers", "openai", "gemini", "anthropic", "ollama"]
category: "typescript"
subcategory: "tanstack"
version: "1.0"
last_updated: "2025-12-24"
status: "alpha"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/TanStack/ai/releases"
  - name: "TanStack AI Alpha 2 Announcement"
    url: "https://tanstack.com/blog/tanstack-ai-alpha-2"
related: ["README.md", "openai.md", "gemini.md"]
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "0.2.0"
---

# TanStack AI Providers Version Log

**Current versions documented:**
- @tanstack/ai-openai: 0.2.0
- @tanstack/ai-gemini: 0.2.0
- @tanstack/ai-anthropic: 0.2.0
- @tanstack/ai-ollama: 0.2.0

**Last checked:** 2025-12-24

[Official Release Notes](https://github.com/TanStack/ai/releases)

---

## @tanstack/ai-openai

### v0.2.0 (2025-12-22)

Standard Schema / Standard JSON Schema support. ([GitHub Release][1])

- **New:** Removes Zod constraint for tools and structured outputs
- **New:** Bring your own schema validation library (Valibot, ArkType, etc.)

[Release Notes](https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-openai%400.2.0)

### v0.1.x (2025-12-03 - Alpha 1)

Initial alpha release. ([Alpha Announcement][2])

- `openaiText(model)` - Chat completions
- `openaiSummarize(model)` - Summarization
- `openaiImage(model)` - Image generation (DALL-E)
- `openaiTTS(model)` - Text-to-speech
- `openaiTranscription(model)` - Audio transcription (Whisper)

---

## @tanstack/ai-gemini

### v0.2.0 (2025-12-22)

Standard Schema / Standard JSON Schema support. ([GitHub Release][3])

- **New:** Removes Zod constraint for tools and structured outputs
- **New:** Bring your own schema validation library

[Release Notes](https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-gemini%400.2.0)

### v0.1.x (Alpha 1)

Initial alpha release.

- `geminiText(model)` - Chat completions
- `geminiSummarize(model)` - Summarization
- `geminiImage(model)` - Image generation (Imagen)
- `geminiSpeech(model)` - Text-to-speech (experimental)

---

## @tanstack/ai-anthropic

### v0.2.0 (2025-12-22)

Standard Schema / Standard JSON Schema support. ([GitHub Release][4])

- **New:** Removes Zod constraint for tools and structured outputs
- **New:** Bring your own schema validation library

[Release Notes](https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-anthropic%400.2.0)

### v0.1.x (Alpha 1)

Initial alpha release.

- `anthropicText(model)` - Chat completions with Claude models
- Extended thinking support

---

## @tanstack/ai-ollama

### v0.2.0 (2025-12-22)

Standard Schema / Standard JSON Schema support. ([GitHub Release][5])

- **New:** Removes Zod constraint for tools and structured outputs
- **New:** Bring your own schema validation library

[Release Notes](https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-ollama%400.2.0)

### v0.1.x (Alpha 1)

Initial alpha release.

- `ollamaText(model)` - Local LLM chat completions
- Support for local model deployment

---

## References

[1]: https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-openai%400.2.0 "ai-openai v0.2.0 Release"
[2]: https://tanstack.com/blog/tanstack-ai-alpha-your-ai-your-way "TanStack AI Alpha Announcement"
[3]: https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-gemini%400.2.0 "ai-gemini v0.2.0 Release"
[4]: https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-anthropic%400.2.0 "ai-anthropic v0.2.0 Release"
[5]: https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-ollama%400.2.0 "ai-ollama v0.2.0 Release"
