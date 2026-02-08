---
author: unknown
category: ai-frameworks
contributors: []
description: Integration guide for Pydantic AI framework with OpenTelemetry tracing using native instrumentation support
last_updated: '2025-08-16'
related:
- ../conventions/genai-attributes.md
- ../spans/agent-spans.md
- ../spans/llm-spans.md
- ../spans/tool-spans.md
sources:
- name: Pydantic AI Logfire Documentation
  url: https://ai.pydantic.dev/logfire/
- name: SigNoz Pydantic AI Observability
  url: https://signoz.io/docs/pydantic-ai-observability/
- name: OpenInference PydanticAI GitHub
  url: https://github.com/Arize-ai/openinference/tree/main/python/instrumentation/openinference-instrumentation-pydantic-ai
- name: Phoenix Pydantic AI Tracing Documentation
  url: https://arize.com/docs/phoenix/integrations/pydantic/pydantic-tracing
status: stable
subcategory: frameworks
tags:
- pydantic-ai
- opentelemetry
- tracing
- python
- instrumentation
- arize-phoenix
- openinference
title: Pydantic AI OpenTelemetry Integration
type: integration-guide
version: '1.0'
---

# Pydantic AI OpenTelemetry Integration

Integration guide for Pydantic AI framework with OpenTelemetry tracing using native instrumentation support.

## Overview

Pydantic AI features native OpenTelemetry support. Traces are emitted using OpenInference semantic conventions, making them compatible with Arize Phoenix and other OpenTelemetry-compliant backends.

### Key Features

- Native OpenTelemetry instrumentation built into the framework
- OpenInference semantic conventions for LLM observability
- Automatic span creation for agents, LLM calls, and tool executions
- Configurable content capture for prompts and completions

## Quick Setup

```python
from phoenix.otel import register
from pydantic_ai import Agent

# Register with Phoenix
tracer_provider = register(
    project_name="my-pydantic-app",
    endpoint="http://localhost:6006/v1/traces"
)

# Enable instrumentation for all agents
Agent.instrument_all()

# Create and use agent
agent = Agent('openai:gpt-4')
result = agent.run_sync('Hello, world!')
```

## Global vs Per-Agent Instrumentation

### Global Instrumentation

Enable instrumentation for all agents in your application:

```python
from pydantic_ai import Agent

# Enable instrumentation for all agents
Agent.instrument_all()

# All agents created after this will emit traces
agent1 = Agent('openai:gpt-4')
agent2 = Agent('anthropic:claude-3-opus')
```

### Per-Agent Instrumentation

Configure instrumentation settings for individual agents:

```python
from pydantic_ai import Agent, InstrumentationSettings

# Configure instrumentation settings
instrumentation = InstrumentationSettings(
    version=2,  # OTel semantic conventions version
    include_content=True,  # Include prompts/completions
    event_mode='logs'  # Logs instead of JSON arrays
)

# Create agent with specific instrumentation
agent = Agent('openai:gpt-4', instrument=instrumentation)
```

## InstrumentationSettings Options

| Parameter | Type | Default | Purpose |
|-----------|------|---------|---------|
| `version` | int | 2 | OTel semantic conventions version (1, 2, or 3) |
| `event_mode` | str | `json_array` | Event format: `'json_array'` or `'logs'` |
| `include_content` | bool | True | Include prompts/completions in spans |
| `include_binary_content` | bool | True | Include binary data (images, etc.) |
| `tracer_provider` | TracerProvider | None | Custom OTel tracer provider |
| `event_logger_provider` | LoggerProvider | None | Custom OTel logger provider |

### Version Selection

- **Version 1**: Legacy format, broader compatibility
- **Version 2**: Recommended, aligns with current OpenInference conventions
- **Version 3**: Latest experimental features

### Event Mode

- **json_array**: Events stored as JSON arrays in span attributes
- **logs**: Events emitted as OpenTelemetry logs (aligns with GenAI semantic conventions)

## Docker Compose Configuration

```yaml
services:
  pydantic-app:
    build: ./app
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://phoenix:6006
      - OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf
      - OTEL_RESOURCE_ATTRIBUTES=service.name=pydantic-ai-app
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - phoenix

  phoenix:
    image: arizephoenix/phoenix:12.9.0
    ports:
      - "6006:6006"
      - "4317:4317"
```

## Span Hierarchy

Pydantic AI automatically creates hierarchical spans:

```
AGENT span (agent invocation)
├── LLM span (model call)
│   ├── Input: prompt messages
│   └── Output: completion response
├── TOOL span (tool execution)
│   ├── Input: tool arguments
│   └── Output: tool result
└── LLM span (continuation after tool)
```

### Span Attributes

**AGENT spans**:
- `gen_ai.agent.name`: Agent identifier
- `gen_ai.operation.name`: "agent"

**LLM spans**:
- `gen_ai.provider.name`: Provider name (openai, anthropic)
- `gen_ai.request.model`: Model identifier
- `gen_ai.usage.input_tokens`: Input token count
- `gen_ai.usage.output_tokens`: Output token count

**TOOL spans**:
- `gen_ai.tool.name`: Tool function name
- `gen_ai.tool.type`: "function"

## Programmatic Configuration

For more control over the tracing setup:

```python
import os
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from pydantic_ai import Agent

# Create resource with service name
resource = Resource.create({
    "service.name": "my-pydantic-app",
    "service.version": "1.0.0"
})

# Configure tracer provider
tracer_provider = TracerProvider(resource=resource)
trace.set_tracer_provider(tracer_provider)

# Configure OTLP exporter
endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:6006")
exporter = OTLPSpanExporter(endpoint=f"{endpoint}/v1/traces")

# Add batch span processor for production
span_processor = BatchSpanProcessor(exporter)
tracer_provider.add_span_processor(span_processor)

# Enable Pydantic AI instrumentation
Agent.instrument_all()

# Create and use agent
agent = Agent('openai:gpt-4')
result = agent.run_sync('What is the capital of France?')
```

## Troubleshooting

### Traces Not Appearing

1. **Check OTLP endpoint reachable**:
   ```bash
   curl http://localhost:6006/v1/traces
   ```

2. **Verify instrumentation enabled**:
   ```python
   # Ensure this is called before creating agents
   Agent.instrument_all()
   ```

3. **Check for errors in span processor**:
   ```python
   from opentelemetry.sdk.trace.export import ConsoleSpanExporter
   tracer_provider.add_span_processor(SimpleSpanProcessor(ConsoleSpanExporter()))
   ```

### Missing Content in Spans

Set `include_content=True` in instrumentation settings:

```python
instrumentation = InstrumentationSettings(
    include_content=True,
    include_binary_content=True
)
agent = Agent('openai:gpt-4', instrument=instrumentation)
```

### High Latency in Production

Use `BatchSpanProcessor` instead of `SimpleSpanProcessor`:

```python
from opentelemetry.sdk.trace.export import BatchSpanProcessor

# Batch processor buffers spans and exports in batches
span_processor = BatchSpanProcessor(
    exporter,
    max_queue_size=2048,
    max_export_batch_size=512,
    export_timeout_millis=30000
)
```

### Event Mode Compatibility

If using a generic OTLP collector that does not support OpenInference extensions, use logs mode:

```python
instrumentation = InstrumentationSettings(
    event_mode='logs'  # More compatible with standard OTLP collectors
)
```

## Dependencies

```
pydantic-ai
opentelemetry-sdk
opentelemetry-exporter-otlp
opentelemetry-api
```

Optional for enhanced Phoenix integration:
```
openinference-instrumentation-pydantic-ai
arize-phoenix
```
