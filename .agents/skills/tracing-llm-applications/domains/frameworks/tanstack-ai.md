---
author: unknown
category: ai-frameworks
contributors: []
description: Integration guide for TanStack AI framework with OpenTelemetry tracing using manual instrumentation
last_updated: '2025-08-16'
related:
- ../conventions/genai-attributes.md
- ../spans/llm-spans.md
- ../spans/tool-spans.md
- pydantic-ai.md
sources:
- name: TanStack AI Documentation
  url: https://tanstack.com/ai/latest
- name: OpenTelemetry JavaScript SDK
  url: https://opentelemetry.io/docs/languages/js/
- name: OpenTelemetry Semantic Conventions for GenAI
  url: https://opentelemetry.io/docs/specs/semconv/gen-ai/
status: stable
subcategory: frameworks
tags:
- tanstack-ai
- typescript
- opentelemetry
- tracing
- manual-instrumentation
- nodejs
title: TanStack AI OpenTelemetry Integration
type: integration-guide
version: '1.0'
---

# TanStack AI OpenTelemetry Integration

Integration guide for TanStack AI framework (TypeScript) with OpenTelemetry tracing using manual instrumentation.

## Overview

TanStack AI is a TypeScript SDK for building AI applications. Unlike Pydantic AI, it does not have built-in OpenTelemetry instrumentation. This guide covers manual tracing implementation following GenAI semantic conventions.

### Key Considerations

- Manual span creation required for AI operations
- HTTP instrumentation captures provider API calls automatically
- Custom wrapper functions provide consistent tracing patterns
- Full control over span attributes and context propagation

## OpenTelemetry Setup

### SDK Configuration

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

const exporter = new OTLPTraceExporter({
  url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:6006/v1/traces',
});

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: 'tanstack-ai-app',
    [ATTR_SERVICE_VERSION]: '1.0.0',
  }),
  spanProcessor: new BatchSpanProcessor(exporter),
});

sdk.start();

// Graceful shutdown
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.error('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
```

## Manual Span Creation

### Chat Completion Tracing

```typescript
import { trace, SpanStatusCode } from '@opentelemetry/api';
import { chat } from '@tanstack/ai';
import { openai } from '@tanstack/ai-openai';

const tracer = trace.getTracer('tanstack-ai');

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

async function tracedChat(messages: Message[]): Promise<string> {
  return tracer.startActiveSpan('chat gpt-4', async (span) => {
    // Set GenAI semantic convention attributes
    span.setAttribute('gen_ai.operation.name', 'chat');
    span.setAttribute('gen_ai.provider.name', 'openai');
    span.setAttribute('gen_ai.request.model', 'gpt-4');
    span.setAttribute('gen_ai.request.max_tokens', 1000);

    try {
      const stream = chat({
        adapter: openai({ apiKey: process.env.OPENAI_API_KEY }),
        messages,
        model: 'gpt-4',
      });

      // Collect response for token tracking
      let response = '';
      for await (const chunk of stream) {
        response += chunk.content || '';
      }

      // Record output metrics
      span.setAttribute('gen_ai.usage.output_tokens', estimateTokens(response));
      span.setAttribute('gen_ai.response.finish_reason', 'stop');

      return response;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: String(error) });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

function estimateTokens(text: string): number {
  // Rough estimation: ~4 characters per token
  return Math.ceil(text.length / 4);
}
```

### Streaming with Progress Tracking

```typescript
async function tracedStreamingChat(messages: Message[]): Promise<AsyncIterable<string>> {
  const span = tracer.startSpan('streaming chat gpt-4');

  span.setAttribute('gen_ai.operation.name', 'chat');
  span.setAttribute('gen_ai.provider.name', 'openai');
  span.setAttribute('gen_ai.request.model', 'gpt-4');
  span.setAttribute('gen_ai.request.stream', true);

  try {
    const stream = chat({
      adapter: openai({ apiKey: process.env.OPENAI_API_KEY }),
      messages,
      model: 'gpt-4',
    });

    let totalTokens = 0;

    async function* trackedStream() {
      for await (const chunk of stream) {
        totalTokens += estimateTokens(chunk.content || '');
        yield chunk.content || '';
      }
      span.setAttribute('gen_ai.usage.output_tokens', totalTokens);
      span.end();
    }

    return trackedStream();
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(error as Error);
    span.end();
    throw error;
  }
}
```

## Tool Tracing

### Tool Definition with Tracing

```typescript
import { toolDefinition } from '@tanstack/ai';

const getWeather = toolDefinition({
  name: 'get_weather',
  description: 'Get current weather for a location',
  parameters: {
    type: 'object',
    properties: {
      location: { type: 'string' },
    },
    required: ['location'],
  },
}).server(async ({ location }) => {
  return tracer.startActiveSpan('execute_tool get_weather', async (span) => {
    span.setAttribute('gen_ai.tool.name', 'get_weather');
    span.setAttribute('gen_ai.tool.type', 'function');
    span.setAttribute('tool.input.location', location);

    try {
      const result = await fetchWeather(location);
      span.setAttribute('tool.output.temperature', result.temperature);
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
});

async function fetchWeather(location: string) {
  // Weather API call implementation
  return { temperature: 72, condition: 'sunny' };
}
```

### Generic Tool Wrapper

```typescript
function tracedTool<T, R>(
  name: string,
  fn: (input: T) => Promise<R>
): (input: T) => Promise<R> {
  return async (input: T) => {
    return tracer.startActiveSpan(`execute_tool ${name}`, async (span) => {
      span.setAttribute('gen_ai.tool.name', name);
      span.setAttribute('gen_ai.tool.type', 'function');
      span.setAttribute('tool.input', JSON.stringify(input));

      try {
        const result = await fn(input);
        span.setAttribute('tool.output', JSON.stringify(result));
        return result;
      } catch (error) {
        span.setStatus({ code: SpanStatusCode.ERROR });
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  };
}

// Usage
const tracedGetWeather = tracedTool('get_weather', fetchWeather);
```

## HTTP Auto-Instrumentation

Capture provider API calls automatically:

```typescript
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { FetchInstrumentation } from '@opentelemetry/instrumentation-fetch';

const sdk = new NodeSDK({
  // ... resource config
  instrumentations: [
    new HttpInstrumentation(),
    new FetchInstrumentation(),
  ],
});
```

This captures outbound HTTP requests to OpenAI, Anthropic, and other providers.

## Context Propagation

Maintain trace context across async operations:

```typescript
import { context, trace } from '@opentelemetry/api';

async function agentWorkflow(query: string) {
  return tracer.startActiveSpan('agent workflow', async (parentSpan) => {
    // Child spans automatically inherit context
    const understanding = await tracedChat([
      { role: 'user', content: query }
    ]);

    const toolResult = await tracedTool('search', search)(understanding);

    const response = await tracedChat([
      { role: 'user', content: query },
      { role: 'assistant', content: understanding },
      { role: 'user', content: `Tool result: ${JSON.stringify(toolResult)}` }
    ]);

    parentSpan.end();
    return response;
  });
}
```

## Note on Auto-Instrumentation

TanStack AI does not currently have auto-instrumentation support. For full observability, consider:

- **Manual spans**: As shown above for AI-specific operations
- **HTTP instrumentation**: Automatically captures provider API calls
- **Custom wrapper functions**: Create reusable tracing utilities
- **Community instrumentation**: Monitor for future OpenInference support

## Dependencies

```json
{
  "dependencies": {
    "@tanstack/ai": "^0.1.0",
    "@tanstack/ai-openai": "^0.1.0",
    "@opentelemetry/api": "^1.9.0",
    "@opentelemetry/sdk-node": "^0.52.0",
    "@opentelemetry/exporter-trace-otlp-http": "^0.52.0",
    "@opentelemetry/semantic-conventions": "^1.25.0",
    "@opentelemetry/instrumentation-http": "^0.52.0"
  }
}
```

## Docker Compose Configuration

```yaml
services:
  tanstack-app:
    build: ./app
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://phoenix:6006
      - OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
      - OTEL_RESOURCE_ATTRIBUTES=service.name=tanstack-ai-app
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - phoenix

  phoenix:
    image: arizephoenix/phoenix:12.9.0
    ports:
      - "6006:6006"
```
