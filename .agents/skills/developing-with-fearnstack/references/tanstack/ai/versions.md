---
title: "TanStack AI Version Log"
description: "Version history and changelog for TanStack AI"
type: "meta"
tags: ["changelog", "versions", "tanstack", "ai", "llm", "streaming"]
category: "typescript"
subcategory: "ai"
version: "1.0"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/TanStack/ai/releases"
  - name: "TanStack AI Alpha Announcement"
    url: "https://tanstack.com/blog/tanstack-ai-alpha-your-ai-your-way"
  - name: "TanStack AI Alpha 2 Announcement"
    url: "https://tanstack.com/blog/tanstack-ai-alpha-2"
related: []
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "0.2.0"
---

# TanStack AI Version Log

**Current version documented:** 0.2.0
**Last checked:** 2025-12-23

[Official Release Notes](https://github.com/TanStack/ai/releases)

---

## Current Major: v0.x (Alpha)

### v0.2.0 (2025-12-22)
Standard Schema support.
- **New:** Standard Schema / Standard JSON Schema support (#165)
- Removes Zod constraint for tools and structured outputs
- Bring your own schema validation library

[Release Notes](https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai%400.2.0)

### Alpha 2 (2025-12-18) **BREAKING**
Major architectural overhaul with new modalities.

**New Adapter Architecture:**
- Split monolithic adapters into modality-specific imports
- `openaiText`, `openaiImage`, `openaiVideo` instead of single `openai`
- Smaller bundle sizes - import only what you use
- Easier maintenance and faster contributions

**New Modalities:**
- **Structured outputs:** Type-safe structured responses
- **Image generation:** Generate images from text prompts
- **Video generation:** Generate video content
- **Audio generation:** Generate audio content
- **Transcription:** Convert speech to text
- **Text-to-speech:** Convert text to audio

**API Changes:**
- Model moved into adapter: `openaiText('gpt-4')` instead of separate `model` param
- Renamed `providerOptions` to `modelOptions`
- Flattened options to root: `temperature` at top level

[Announcement](https://tanstack.com/blog/tanstack-ai-alpha-2)

### Alpha 1 (2025-12-03)
Initial alpha release.

**Multi-Language Support:**
- JavaScript/TypeScript, PHP, Python
- Full agentic flows with tools in all languages

**Provider Adapters:**
- OpenAI (GPT-4, GPT-4o, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus/Sonnet/Haiku)
- Google Gemini (Pro, Pro Vision, Ultra)
- Ollama (local LLM deployment)

**Core Features:**
- Open, published protocol for server-client communication
- Isomorphic tool support with server/client implementations
- Per-model type safety for provider options
- Isomorphic devtools (built on TanStack Devtools)

**Client Libraries:**
- Vanilla JS
- React (`@tanstack/ai-react`)
- Solid (`@tanstack/ai-solid`)
- Vue (`@tanstack/ai-vue`)
- Svelte (`@tanstack/ai-svelte`)

**Framework Examples:**
- TanStack Start with React/Solid
- PHP with Slim
- Python FastAPI
- Multi-user group chat with WebSockets

[Announcement](https://tanstack.com/blog/tanstack-ai-alpha-your-ai-your-way)

---

## Roadmap

Planned features for future releases:
- Middleware support
- Tool hardening
- Headless UI library for AI chat components
- Context-aware tools
- Better devtools and usage reporting
- Additional adapters: AWS Bedrock, OpenRouter

---

## Architecture Notes

TanStack AI is a framework-agnostic AI toolkit designed to avoid vendor lock-in. It uses a published protocol for server-client communication, allowing any transport layer (HTTP, WebSockets, etc.). Tools are defined once with meta definitions and can have isolated server and client implementations for full type safety across the application.
