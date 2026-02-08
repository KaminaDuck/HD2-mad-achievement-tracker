# TypeScript SDK Overview

Phoenix's TypeScript SDK is modular by design, allowing you to install only what you need.

## Packages

| Package | Purpose |
|---------|---------|
| `@arizeai/phoenix-client` | REST API client for prompts, datasets, experiments |
| `@arizeai/phoenix-otel` | OpenTelemetry tracing setup |
| `@arizeai/phoenix-evals` | LLM evaluations |
| `@arizeai/openinference-core` | Instrumentation helpers and span utilities |
| `@arizeai/phoenix-mcp` | Model Context Protocol server |
| `@arizeai/phoenix-cli` | Command-line interface |

## Installation

```bash
# Install all
npm install @arizeai/phoenix-client @arizeai/phoenix-otel @arizeai/phoenix-evals

# Or individually
npm install @arizeai/phoenix-client   # REST API client
npm install @arizeai/phoenix-otel     # Tracing
npm install @arizeai/phoenix-evals    # Evaluations
npm install @arizeai/openinference-core  # Instrumentation core
```

## Environment Variables

| Variable | Description | Used By |
|----------|-------------|---------|
| `PHOENIX_COLLECTOR_ENDPOINT` | Trace collector URL | OTEL |
| `PHOENIX_HOST` | Phoenix server URL | Client |
| `PHOENIX_API_KEY` | API key for authentication | All |
| `PHOENIX_CLIENT_HEADERS` | Custom HTTP headers (JSON) | Client |
| `PHOENIX_BASE_URL` | Phoenix base URL | MCP |

## Quick Start

### 1. Start Phoenix

```bash
# Docker (self-hosted)
docker run -p 6006:6006 arizephoenix/phoenix:latest

# Or use Phoenix Cloud
# Set PHOENIX_API_KEY environment variable
```

### 2. Initialize Tracing

```typescript
import { register } from "@arizeai/phoenix-otel";

// IMPORTANT: Call before importing LLM libraries
register({ projectName: "my-app" });
```

### 3. Use LLM Libraries

```typescript
// Import AFTER register() call
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// Traces are automatically captured
const openai = new OpenAI();
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Package Details

### @arizeai/phoenix-client

TypeScript client for Phoenix REST API with full auto-completion:

- **Prompts** — Create, version, retrieve templates (OpenAI, Anthropic, Vercel AI helpers)
- **Datasets** — Create and manage evaluation datasets
- **Experiments** — Run evaluations with automatic tracing
- **REST API** — Full access to all Phoenix endpoints

### @arizeai/phoenix-otel

OpenTelemetry wrapper for Node.js applications:

- **Simple setup** — Single `register()` call
- **Phoenix-aware defaults** — Reads environment variables automatically
- **Production ready** — Built-in batch processing and authentication
- **Auto-instrumentation** — HTTP, Express, and OpenTelemetry instrumentations

### @arizeai/phoenix-evals

TypeScript evaluation library:

- **Vendor agnostic** — Works with any AI SDK provider
- **Pre-built evaluators** — Hallucination, relevance, and more
- **Custom classifiers** — Create evaluators with custom prompts
- **Experiment integration** — Works with `@arizeai/phoenix-client`

### @arizeai/openinference-core

Instrumentation utilities for tracing LLM applications:

- `withSpan` — Wrap any function with tracing
- `traceChain` — Trace workflow sequences
- `traceAgent` — Trace autonomous agents
- `traceTool` — Trace external tool calls
- Context propagation (session, user, metadata, tags)

### @arizeai/phoenix-mcp

Model Context Protocol server for integration with Claude Desktop, Cursor, and other MCP clients:

- **Prompts management** — Create, list, update prompts
- **Datasets** — Explore and synthesize examples
- **Experiments** — Pull and visualize results

## Related Documentation

- [phoenix-otel.md](phoenix-otel.md) - Detailed tracing setup
- [phoenix-client.md](phoenix-client.md) - REST API client usage
- [phoenix-evals.md](phoenix-evals.md) - Evaluation library
- [openinference-core.md](openinference-core.md) - Manual instrumentation
