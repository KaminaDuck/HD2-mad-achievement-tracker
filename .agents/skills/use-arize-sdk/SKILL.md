---
name: use-arize-sdk
description: Guides TypeScript/Node.js LLM tracing and evaluation using Arize Phoenix SDK. Use when instrumenting applications with OpenTelemetry, running LLM evaluations, managing prompts/datasets, or debugging traces.
---

# Arize Phoenix TypeScript SDK

This skill provides comprehensive guidance for instrumenting TypeScript/Node.js LLM applications with Arize Phoenix for observability, tracing, and evaluation.

## Quick Navigation

| Need | Go To |
|------|-------|
| Setup tracing | [Tracing Setup](#tracing-setup) |
| Phoenix client operations | [reference/phoenix-client.md](reference/phoenix-client.md) |
| OpenTelemetry configuration | [reference/phoenix-otel.md](reference/phoenix-otel.md) |
| Run evaluations | [reference/phoenix-evals.md](reference/phoenix-evals.md) |
| Manual span instrumentation | [reference/openinference-core.md](reference/openinference-core.md) |
| MCP server integration | [reference/phoenix-mcp.md](reference/phoenix-mcp.md) |
| CLI usage | [reference/phoenix-cli.md](reference/phoenix-cli.md) |

## Package Overview

| Package | Purpose |
|---------|---------|
| `@arizeai/phoenix-otel` | OpenTelemetry tracing setup for Phoenix |
| `@arizeai/phoenix-client` | TypeScript client for Phoenix API (prompts, datasets, experiments) |
| `@arizeai/phoenix-evals` | Run LLM-as-judge evaluations |
| `@arizeai/openinference-core` | Manual span instrumentation utilities |
| `@arizeai/phoenix-mcp` | MCP server for AI assistant integration |
| `@arizeai/phoenix-cli` | Command-line interface for Phoenix |

## Environment Setup

### Required Environment Variables

```bash
# Phoenix connection (choose one)
PHOENIX_COLLECTOR_ENDPOINT=http://localhost:6006/v1/traces  # Self-hosted
PHOENIX_API_KEY=your-api-key                                 # Cloud/authenticated

# Optional
PHOENIX_PROJECT_NAME=my-project
PHOENIX_CLIENT_HEADERS='{"x-custom": "header"}'
```

### Install Dependencies

```bash
# Core tracing
bun add @arizeai/phoenix-otel @opentelemetry/api

# Phoenix client for prompts/datasets
bun add @arizeai/phoenix-client

# Evaluations
bun add @arizeai/phoenix-evals

# Manual instrumentation
bun add @arizeai/openinference-core
```

## Tracing Setup

### Basic Setup (Recommended)

```typescript
import { register } from "@arizeai/phoenix-otel";

// Initialize tracing BEFORE importing LLM libraries
register({
  projectName: "my-llm-app",
  endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT,
});

// Now import and use LLM libraries
import Anthropic from "@anthropic-ai/sdk";
const client = new Anthropic();
```

### With Vercel AI SDK

```typescript
import { register } from "@arizeai/phoenix-otel";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

register({ projectName: "vercel-ai-app" });

const result = await generateText({
  model: openai("gpt-4o"),
  prompt: "Hello, how are you?",
});
```

### With OpenAI SDK

```typescript
import { register } from "@arizeai/phoenix-otel";

register({ projectName: "openai-app" });

import OpenAI from "openai";
const openai = new OpenAI();

const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
```

### With Anthropic SDK

```typescript
import { register } from "@arizeai/phoenix-otel";

register({ projectName: "anthropic-app" });

import Anthropic from "@anthropic-ai/sdk";
const anthropic = new Anthropic();

const message = await anthropic.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello!" }],
});
```

## Manual Span Instrumentation

Use `@arizeai/openinference-core` for custom spans:

```typescript
import { trace } from "@opentelemetry/api";
import {
  OpenInferenceSpanKind,
  setSpan,
} from "@arizeai/openinference-core";

const tracer = trace.getTracer("my-app");

// Create a chain span
const span = tracer.startSpan("my-rag-chain");
setSpan(span, {
  openInferenceSpanKind: OpenInferenceSpanKind.CHAIN,
  input: { value: "user query" },
});

try {
  // Your chain logic here
  const result = await runChain();

  setSpan(span, {
    output: { value: result },
  });
} finally {
  span.end();
}
```

### Span Kinds

| Kind | Use For |
|------|---------|
| `LLM` | LLM calls (auto-instrumented by SDKs) |
| `CHAIN` | Multi-step pipelines, RAG chains |
| `RETRIEVER` | Vector database queries |
| `EMBEDDING` | Embedding generation |
| `TOOL` | Tool/function calls |
| `AGENT` | Agent orchestration |
| `RERANKER` | Reranking operations |

## Phoenix Client Operations

### Prompts

```typescript
import { createClient, getPrompt } from "@arizeai/phoenix-client";
import { toSDK } from "@arizeai/phoenix-client/prompts";
import Anthropic from "@anthropic-ai/sdk";

const phoenix = createClient();

// Get prompt and convert to SDK format
const prompt = await getPrompt({ name: "my-prompt" });
const anthropicParams = toSDK({
  library: "anthropic",
  prompt,
  variables: { topic: "AI" },
});

const client = new Anthropic();
const response = await client.messages.create(anthropicParams);
```

### Datasets

```typescript
import { createClient, getDataset } from "@arizeai/phoenix-client";

const phoenix = createClient();

// Fetch dataset
const dataset = await getDataset({ name: "my-dataset" });

// Upload dataset
await phoenix.POST("/v1/datasets/upload", {
  body: {
    name: "new-dataset",
    inputs: [{ query: "test" }],
    outputs: [{ response: "test response" }],
  },
});
```

### Experiments

```typescript
import { createClient, runExperiment } from "@arizeai/phoenix-client";
import { asEvaluator } from "@arizeai/phoenix-client/experiments";

const phoenix = createClient();

// Run experiment with evaluator
const results = await runExperiment({
  dataset: { name: "my-dataset" },
  task: async (example) => {
    const response = await llm.generate(example.input);
    return response;
  },
  evaluators: [
    asEvaluator("correctness", async (params) => {
      // Custom evaluation logic
      return { score: 0.9, label: "correct" };
    }),
  ],
});
```

## Evaluations

```typescript
import { createClient } from "@arizeai/phoenix-client";
import { Evals } from "@arizeai/phoenix-evals";

const phoenix = createClient();

// Create evaluator
const evals = new Evals({
  client: phoenix,
  model: "gpt-4o",
});

// Run evaluation on traces
const results = await evals.evaluate({
  projectName: "my-project",
  evaluators: ["relevance", "coherence"],
});
```

## Helper Scripts

This skill includes helper scripts in `scripts/`:

```bash
# Setup tracing in a project
bun run skills/observability/use-arize-sdk/scripts/setup-tracing.ts

# Check Phoenix connection
bun run skills/observability/use-arize-sdk/scripts/check-connection.ts

# Fetch recent traces
bun run skills/observability/use-arize-sdk/scripts/fetch-traces.ts
```

## Examples

See the `examples/` directory for complete working examples:

- `basic-tracing.ts` - Minimal tracing setup
- `rag-pipeline.ts` - RAG chain with retriever/chain spans
- `experiment-runner.ts` - Running dataset experiments

## Troubleshooting

### Traces not appearing

1. Ensure `registerOTel()` is called BEFORE importing LLM libraries
2. Check `PHOENIX_COLLECTOR_ENDPOINT` is accessible
3. Verify no firewall blocking outbound connections
4. Check Phoenix UI project filter matches `projectName`

### Connection errors

```typescript
// Test connection
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();
const health = await phoenix.GET("/v1/health");
console.log(health.data);
```

### Missing spans

- Ensure async operations complete before process exits
- Add graceful shutdown:

```typescript
import { shutdown } from "@arizeai/phoenix-otel";

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});
```

## Related Documentation

- [Tracing LLM Applications Skill](../tracing-llm-applications/) - OpenTelemetry concepts and GenAI conventions
- [Phoenix Documentation](https://docs.arize.com/phoenix)
- [OpenInference Specification](https://github.com/Arize-ai/openinference)
