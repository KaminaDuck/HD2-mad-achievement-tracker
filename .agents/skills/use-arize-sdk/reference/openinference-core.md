# @arizeai/openinference-core

Instrumentation utilities for manually tracing LLM applications. Use when you need fine-grained control over span creation and attributes.

## Features

- **Tracing Helpers** — `withSpan`, `traceChain`, `traceAgent`, `traceTool`
- **Decorators** — `@observe` for method-level tracing
- **Attribute Helpers** — Set LLM, embedding, retriever attributes
- **Context Propagation** — Session, user, metadata, tags

## Installation

```bash
npm install @arizeai/openinference-core @opentelemetry/api
# or
bun add @arizeai/openinference-core @opentelemetry/api
```

## Span Kinds

| Kind | Use For |
|------|---------|
| `LLM` | LLM inference calls |
| `CHAIN` | Multi-step pipelines, RAG chains |
| `RETRIEVER` | Vector database queries |
| `EMBEDDING` | Embedding generation |
| `TOOL` | Tool/function calls |
| `AGENT` | Agent orchestration |
| `RERANKER` | Reranking operations |

## Quick Start

### Basic Span Creation

```typescript
import { trace } from "@opentelemetry/api";
import {
  OpenInferenceSpanKind,
  setSpan,
} from "@arizeai/openinference-core";

const tracer = trace.getTracer("my-app");

async function myRAGChain(query: string) {
  const span = tracer.startSpan("rag-chain");

  setSpan(span, {
    openInferenceSpanKind: OpenInferenceSpanKind.CHAIN,
    input: { value: query },
  });

  try {
    const result = await processQuery(query);
    setSpan(span, { output: { value: result } });
    return result;
  } catch (error) {
    span.recordException(error as Error);
    throw error;
  } finally {
    span.end();
  }
}
```

### Using withSpan Helper

```typescript
import { withSpan } from "@arizeai/openinference-core";

const tracedFetch = withSpan(
  { name: "fetch-documents", spanKind: "retriever" },
  async (query: string) => {
    const docs = await vectorDB.search(query);
    return docs;
  }
);

const results = await tracedFetch("What is AI?");
```

## Tracing Helpers

### traceChain

Trace a multi-step pipeline:

```typescript
import { traceChain } from "@arizeai/openinference-core";

const result = await traceChain("rag-pipeline", async (span) => {
  // Step 1: Retrieve
  span.setAttribute("step", "retrieve");
  const docs = await retrieve(query);

  // Step 2: Augment
  span.setAttribute("step", "augment");
  const context = formatContext(docs);

  // Step 3: Generate
  span.setAttribute("step", "generate");
  const response = await generate(query, context);

  return response;
});
```

### traceAgent

Trace an autonomous agent:

```typescript
import { traceAgent } from "@arizeai/openinference-core";

const result = await traceAgent("research-agent", async (span) => {
  span.setAttribute("agent.goal", "Research topic X");

  while (!done) {
    const action = await planNextAction();
    const result = await executeAction(action);
    span.addEvent("action_completed", { action: action.name });
  }

  return finalResult;
});
```

### traceTool

Trace a tool/function call:

```typescript
import { traceTool } from "@arizeai/openinference-core";

const searchResult = await traceTool(
  "web-search",
  { query: "latest AI news" },
  async () => {
    return await webSearch("latest AI news");
  }
);
```

## Decorators

### @observe Decorator

```typescript
import { observe } from "@arizeai/openinference-core";

class MyAgent {
  @observe({ spanKind: "agent", name: "research" })
  async research(topic: string) {
    // Method is automatically traced
    return await this.doResearch(topic);
  }

  @observe({ spanKind: "tool" })
  async callTool(name: string, args: Record<string, unknown>) {
    // Tool calls are traced
    return await this.executeTool(name, args);
  }
}
```

## Attribute Helpers

### LLM Attributes

```typescript
import { getLLMAttributes } from "@arizeai/openinference-core";

const llmAttrs = getLLMAttributes({
  modelName: "gpt-4o",
  provider: "openai",
  inputTokens: 150,
  outputTokens: 50,
  temperature: 0.7,
  topP: 0.9,
});

span.setAttributes(llmAttrs);
```

### Embedding Attributes

```typescript
import { getEmbeddingAttributes } from "@arizeai/openinference-core";

const embeddingAttrs = getEmbeddingAttributes({
  modelName: "text-embedding-3-small",
  dimensions: 1536,
  inputText: "Document to embed",
});

span.setAttributes(embeddingAttrs);
```

### Retriever Attributes

```typescript
import { getRetrieverAttributes } from "@arizeai/openinference-core";

const retrieverAttrs = getRetrieverAttributes({
  queryText: "What is machine learning?",
  topK: 5,
  documents: [
    { id: "doc1", content: "...", score: 0.95 },
    { id: "doc2", content: "...", score: 0.87 },
  ],
});

span.setAttributes(retrieverAttrs);
```

### Tool Attributes

```typescript
import { getToolAttributes } from "@arizeai/openinference-core";

const toolAttrs = getToolAttributes({
  name: "calculator",
  description: "Performs mathematical calculations",
  parameters: { expression: "2 + 2" },
  result: "4",
});

span.setAttributes(toolAttrs);
```

## Context Propagation

### Set Session

Group multi-turn conversations:

```typescript
import { setSession } from "@arizeai/openinference-core";

setSession("session-123");

// All subsequent spans will have this session ID
await chat("Hello");
await chat("How are you?");
```

### Set User

Track by user ID:

```typescript
import { setUser } from "@arizeai/openinference-core";

setUser("user-456");
```

### Set Metadata

Add custom metadata:

```typescript
import { setMetadata } from "@arizeai/openinference-core";

setMetadata({
  environment: "production",
  version: "1.2.0",
  feature_flags: { new_model: true },
});
```

### Set Tags

Add filtering tags:

```typescript
import { setTag } from "@arizeai/openinference-core";

setTag("experiment", "gpt4-comparison");
setTag("customer", "enterprise");
```

### Set Prompt Template

Track prompt versions:

```typescript
import { setPromptTemplate } from "@arizeai/openinference-core";

setPromptTemplate({
  name: "qa-prompt",
  version: "v2.1",
  template: "Answer: {question}\nContext: {context}",
  variables: { question: "...", context: "..." },
});
```

## Framework Instrumentors

### OpenAI Instrumentation

```bash
npm install @arizeai/openinference-instrumentation-openai
```

```typescript
import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";
import OpenAI from "openai";

const instrumentation = new OpenAIInstrumentation();
instrumentation.manuallyInstrument(OpenAI);
```

### Anthropic Instrumentation

```bash
npm install @arizeai/openinference-instrumentation-anthropic
```

```typescript
import { AnthropicInstrumentation } from "@arizeai/openinference-instrumentation-anthropic";
import Anthropic from "@anthropic-ai/sdk";

const instrumentation = new AnthropicInstrumentation();
instrumentation.manuallyInstrument(Anthropic);
```

### LangChain Instrumentation

```bash
npm install @arizeai/openinference-instrumentation-langchain
```

```typescript
import { LangChainInstrumentation } from "@arizeai/openinference-instrumentation-langchain";

const instrumentation = new LangChainInstrumentation();
instrumentation.manuallyInstrument();
```

## Complete Example

```typescript
import { trace } from "@opentelemetry/api";
import {
  OpenInferenceSpanKind,
  setSpan,
  setSession,
  setUser,
  getRetrieverAttributes,
  getLLMAttributes,
} from "@arizeai/openinference-core";

const tracer = trace.getTracer("rag-app");

async function ragQuery(userId: string, sessionId: string, query: string) {
  // Set context
  setSession(sessionId);
  setUser(userId);

  // Create chain span
  return tracer.startActiveSpan("rag-query", async (chainSpan) => {
    setSpan(chainSpan, {
      openInferenceSpanKind: OpenInferenceSpanKind.CHAIN,
      input: { value: query },
    });

    try {
      // Retrieval step
      const docs = await tracer.startActiveSpan("retrieve", async (retSpan) => {
        const results = await vectorDB.search(query, { topK: 5 });
        retSpan.setAttributes(getRetrieverAttributes({
          queryText: query,
          topK: 5,
          documents: results,
        }));
        retSpan.end();
        return results;
      });

      // LLM step
      const response = await tracer.startActiveSpan("generate", async (llmSpan) => {
        const result = await llm.generate({
          prompt: formatPrompt(query, docs),
        });
        llmSpan.setAttributes(getLLMAttributes({
          modelName: "gpt-4o",
          inputTokens: result.usage.input,
          outputTokens: result.usage.output,
        }));
        llmSpan.end();
        return result.text;
      });

      setSpan(chainSpan, { output: { value: response } });
      return response;
    } finally {
      chainSpan.end();
    }
  });
}
```
