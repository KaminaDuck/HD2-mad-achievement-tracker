# @arizeai/phoenix-otel

A lightweight wrapper around OpenTelemetry for Node.js applications that simplifies sending traces to Arize Phoenix.

## Features

- **Simple Setup** - One-line configuration with sensible defaults
- **Environment Variables** - Automatic configuration from environment variables
- **Batch Processing** - Built-in batch span processing for production use

## Installation

```bash
npm install @arizeai/phoenix-otel
# or
bun add @arizeai/phoenix-otel
```

## Quick Start

### Basic Usage

```typescript
import { register } from "@arizeai/phoenix-otel";

// Register with default settings (connects to localhost:6006)
register({
  projectName: "my-app",
});
```

### Production Setup (Phoenix Cloud)

```typescript
import { register } from "@arizeai/phoenix-otel";

register({
  projectName: "my-app",
  url: "https://app.phoenix.arize.com",
  apiKey: process.env.PHOENIX_API_KEY,
});
```

## Configuration

### Environment Variables

The `register` function automatically reads from environment variables:

```bash
# For local Phoenix server (default)
export PHOENIX_COLLECTOR_ENDPOINT="http://localhost:6006"

# For Phoenix Cloud
export PHOENIX_COLLECTOR_ENDPOINT="https://app.phoenix.arize.com"
export PHOENIX_API_KEY="your-api-key"
```

### Configuration Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `projectName` | `string` | `"default"` | Project name for organizing traces |
| `url` | `string` | `"http://localhost:6006"` | Phoenix instance URL |
| `apiKey` | `string` | `undefined` | API key for authentication |
| `headers` | `Record<string, string>` | `{}` | Custom headers for OTLP requests |
| `batch` | `boolean` | `true` | Use batch span processing |
| `instrumentations` | `Instrumentation[]` | `undefined` | OpenTelemetry instrumentations |
| `global` | `boolean` | `true` | Register tracer provider globally |
| `diagLogLevel` | `DiagLogLevel` | `undefined` | Diagnostic logging level |

## Usage Examples

### With Auto-Instrumentation (CommonJS)

```typescript
import { register } from "@arizeai/phoenix-otel";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";

register({
  projectName: "my-express-app",
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});
```

### With OpenAI (ESM)

```typescript
// instrumentation.ts
import { register, registerInstrumentations } from "@arizeai/phoenix-otel";
import OpenAI from "openai";
import { OpenAIInstrumentation } from "@arizeai/openinference-instrumentation-openai";

register({ projectName: "openai-app" });

// Manual instrumentation for ESM
const instrumentation = new OpenAIInstrumentation();
instrumentation.manuallyInstrument(OpenAI);

registerInstrumentations({
  instrumentations: [instrumentation],
});
```

```typescript
// main.ts
import "./instrumentation.ts";
import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [{ role: "user", content: "Hello!" }],
});
```

### Manual Tracing

```typescript
import { register, trace } from "@arizeai/phoenix-otel";

register({ projectName: "my-app" });

const tracer = trace.getTracer("my-service");

async function processOrder(orderId: string) {
  return tracer.startActiveSpan("process-order", async (span) => {
    try {
      span.setAttribute("order.id", orderId);
      const result = await fetchOrderDetails(orderId);
      span.setAttribute("order.status", result.status);
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### Development vs Production

**Development** (with debug logging):

```typescript
import { register } from "@arizeai/phoenix-otel";
import { DiagLogLevel } from "@opentelemetry/api";

register({
  projectName: "my-app-dev",
  url: "http://localhost:6006",
  batch: false, // Immediate span delivery
  diagLogLevel: DiagLogLevel.DEBUG,
});
```

**Production** (optimized):

```typescript
import { register } from "@arizeai/phoenix-otel";

register({
  projectName: "my-app-prod",
  url: "https://app.phoenix.arize.com",
  apiKey: process.env.PHOENIX_API_KEY,
  batch: true, // Batch processing
});
```

### Custom Headers

```typescript
import { register } from "@arizeai/phoenix-otel";

register({
  projectName: "my-app",
  url: "https://app.phoenix.arize.com",
  headers: {
    "X-Custom-Header": "custom-value",
    "X-Environment": process.env.NODE_ENV || "development",
  },
});
```

### Non-Global Provider

```typescript
import { register } from "@arizeai/phoenix-otel";

const provider = register({
  projectName: "my-app",
  global: false,
});

// Use the provider explicitly
const tracer = provider.getTracer("my-tracer");
```

## Re-exported APIs

For convenience, commonly used OpenTelemetry APIs are re-exported:

```typescript
import {
  trace,                      // Main tracing API
  context,                    // Context API
  SpanStatusCode,             // Span status codes
  registerInstrumentations,   // Register instrumentations
  type DiagLogLevel,          // Diagnostic log levels
  type Tracer,                // Tracer type
  type Instrumentation,       // Instrumentation type
  type NodeTracerProvider,    // Provider type
} from "@arizeai/phoenix-otel";
```

## Graceful Shutdown

Ensure spans are flushed before process exit:

```typescript
import { register, shutdown } from "@arizeai/phoenix-otel";

register({ projectName: "my-app" });

process.on("SIGTERM", async () => {
  await shutdown();
  process.exit(0);
});
```

## Troubleshooting

### Traces not appearing

1. Ensure `register()` is called BEFORE importing LLM libraries
2. Check `PHOENIX_COLLECTOR_ENDPOINT` is accessible
3. Verify no firewall blocking outbound connections
4. Check Phoenix UI project filter matches `projectName`

### ESM vs CommonJS

- Auto-instrumentation works best with CommonJS
- For ESM, use manual instrumentation with `manuallyInstrument()`
