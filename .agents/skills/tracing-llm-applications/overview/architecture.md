---
title: "LLM Tracing Architecture"
description: "System architecture for LLM observability including component diagram, data flow, instrumentation approaches, and protocol options"
tags: ["architecture", "opentelemetry", "phoenix", "otlp", "instrumentation", "spans"]
category: observability
subcategory: llm-tracing
type: architecture-guide
version: "1.0"
status: stable
sources:
  - name: "OpenTelemetry Architecture"
    url: "https://opentelemetry.io/docs/concepts/components/"
  - name: "Arize Phoenix Architecture"
    url: "https://docs.arize.com/phoenix/concepts/architecture"
related:
  - "./introduction.md"
  - "./quick-start.md"
  - "../deployment/phoenix-docker.md"
  - "../internals/otel-sdk-config.md"
author: "unknown"
contributors: []
---

# LLM Tracing Architecture

This guide explains the system architecture for LLM observability, covering component relationships, data flow, instrumentation strategies, and deployment options.

## Component Overview

```
┌─────────────────────────────────────┐
│         LLM Application             │
│  (Pydantic AI / LangChain / Custom) │
└───────────────┬─────────────────────┘
                │ spans
                │
        ┌───────┴───────┐
        │ TracerProvider │
        │  + Processors  │
        └───────┬───────┘
                │ OTLP
                │ (HTTP/gRPC)
                │
┌───────────────┴───────────────────┐
│           Phoenix                  │
│  ┌──────────────────────────────┐ │
│  │      OTLP Collector          │ │
│  │  (receives + validates)      │ │
│  └──────────────┬───────────────┘ │
│                 │                  │
│  ┌──────────────┴───────────────┐ │
│  │      Trace Storage           │ │
│  │  (SQLite or PostgreSQL)      │ │
│  └──────────────┬───────────────┘ │
│                 │                  │
│  ┌──────────────┴───────────────┐ │
│  │      Phoenix UI              │ │
│  │  (visualization + queries)   │ │
│  └──────────────────────────────┘ │
└───────────────────────────────────┘
```

## Core Components

### Application Layer

Your LLM application contains:

| Component | Role |
|-----------|------|
| **Agent/Chain** | Orchestrates LLM calls, tools, and logic |
| **Instrumentor** | Creates spans for operations |
| **TracerProvider** | Manages tracer instances and configuration |
| **SpanProcessor** | Batches and filters spans before export |
| **Exporter** | Sends spans via OTLP to Phoenix |

### Phoenix Layer

Phoenix provides:

| Component | Role |
|-----------|------|
| **OTLP Collector** | Receives spans over HTTP (6006) or gRPC (4317) |
| **Trace Storage** | Persists traces (SQLite default, PostgreSQL optional) |
| **Query Engine** | Searches and filters traces by attributes |
| **UI Server** | Web interface for visualization |

## Data Flow

### 1. Span Creation

When an LLM operation occurs, the instrumentor creates a span:

```python
with tracer.start_as_current_span("llm", kind=SpanKind.LLM) as span:
    span.set_attribute("llm.model_name", "gpt-4")
    span.set_attribute("llm.input_messages", json.dumps(messages))

    response = call_llm(messages)

    span.set_attribute("llm.output_messages", json.dumps(response))
    span.set_attribute("llm.token_count.prompt", response.usage.prompt_tokens)
```

### 2. Span Processing

The SpanProcessor handles spans:

- **BatchSpanProcessor**: Batches spans for efficient export (default)
- **SimpleSpanProcessor**: Exports immediately (debugging only)

```python
from opentelemetry.sdk.trace.export import BatchSpanProcessor

provider.add_span_processor(
    BatchSpanProcessor(
        exporter,
        max_queue_size=2048,
        max_export_batch_size=512,
        schedule_delay_millis=5000,
    )
)
```

### 3. OTLP Export

Spans are serialized to OTLP format and sent to Phoenix:

```
Application                    Phoenix
    │                             │
    │── POST /v1/traces ─────────>│
    │   Content-Type: protobuf    │
    │   Body: [span1, span2, ...] │
    │                             │
    │<──── 200 OK ────────────────│
```

### 4. Storage and Query

Phoenix stores spans with indexes on:

- Trace ID and span ID
- Project name
- Timestamp
- Span kind (LLM, TOOL, etc.)
- Custom attributes

## Auto-Instrumentation vs Manual

### Auto-Instrumentation

Automatically wraps known operations:

```python
from phoenix.otel import register
from pydantic_ai import Agent

register(project_name="my-app", endpoint="http://localhost:6006/v1/traces")
Agent.instrument_all()  # Patches all agent operations

agent = Agent('openai:gpt-4')
result = agent.run_sync('Hello')  # Automatically traced
```

**Pros**: Zero code changes, comprehensive coverage
**Cons**: Less control, may capture more than needed

### Manual Instrumentation

Explicit span creation:

```python
from opentelemetry import trace
from opentelemetry.trace import SpanKind

tracer = trace.get_tracer(__name__)

with tracer.start_as_current_span("custom_operation", kind=SpanKind.INTERNAL) as span:
    span.set_attribute("custom.key", "value")
    # Your code here
```

**Pros**: Fine-grained control, custom attributes
**Cons**: More code, requires understanding of tracing concepts

### Hybrid Approach

Combine both for comprehensive coverage:

```python
# Auto-instrument framework operations
Agent.instrument_all()

# Add custom spans for business logic
with tracer.start_as_current_span("evaluate_response") as span:
    score = evaluate(response)
    span.set_attribute("evaluation.score", score)
```

## Span Hierarchy in LLM Applications

A typical trace structure:

```
AGENT (root span - orchestration)
│
├── LLM (initial reasoning)
│   ├── llm.model_name: "gpt-4"
│   ├── llm.input_messages: [...]
│   └── llm.token_count.prompt: 150
│
├── RETRIEVER (optional - RAG lookup)
│   ├── retriever.query: "relevant docs"
│   └── retriever.documents: [...]
│
├── TOOL (function execution)
│   ├── tool.name: "get_weather"
│   ├── tool.parameters: {"city": "Seattle"}
│   └── tool.result: "72F, sunny"
│
├── LLM (with tool results)
│   ├── llm.input_messages: [... + tool result]
│   └── llm.token_count.total: 350
│
└── EVALUATOR (optional - quality check)
    ├── eval.type: "relevance"
    └── eval.score: 0.95
```

### Span Kinds

| Kind | Description | Example |
|------|-------------|---------|
| `LLM` | Model inference call | Chat completion, embedding |
| `CHAIN` | Sequence of operations | LangChain chain execution |
| `AGENT` | Autonomous decision loop | Pydantic AI agent run |
| `TOOL` | Function/tool execution | Calculator, API call |
| `RETRIEVER` | Document retrieval | Vector search, RAG |
| `EMBEDDING` | Vector embedding generation | Text to vector |
| `RERANKER` | Result reranking | Cross-encoder rerank |

## Protocol Options

### OTLP over HTTP

```python
register(
    endpoint="http://localhost:6006/v1/traces",
    protocol="http/protobuf"  # default
)
```

**Characteristics**:
- Simpler setup (standard HTTP)
- Works through most proxies/firewalls
- Slightly higher overhead per request
- Default port: 6006

### OTLP over gRPC

```python
register(
    endpoint="http://localhost:4317",
    protocol="grpc"
)
```

**Characteristics**:
- Lower latency, higher throughput
- Persistent connections with streaming
- May require gRPC-aware load balancers
- Default port: 4317

### Choosing a Protocol

| Scenario | Recommendation |
|----------|----------------|
| Development/testing | HTTP (simpler) |
| Production, moderate volume | HTTP (reliable) |
| Production, high volume (>1000 spans/sec) | gRPC (performance) |
| Through corporate proxy | HTTP (compatibility) |

## Deployment Patterns

### Local Development

Single container, ephemeral storage:

```bash
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest
```

### Persistent Development

SQLite storage mounted:

```bash
docker run -p 6006:6006 -p 4317:4317 \
  -v phoenix_data:/data \
  arizephoenix/phoenix:latest
```

### Team/Production

PostgreSQL backend for durability and scale:

```yaml
# docker-compose.yml
services:
  phoenix:
    image: arizephoenix/phoenix:latest
    ports:
      - "6006:6006"
      - "4317:4317"
    environment:
      - PHOENIX_SQL_DATABASE_URL=postgresql://user:pass@db:5432/phoenix
    depends_on:
      - db
  db:
    image: postgres:15
    volumes:
      - pg_data:/var/lib/postgresql/data
```

## Context Propagation

Traces span multiple operations through context propagation:

### Within Process

```python
# Parent span context automatically propagates to child spans
with tracer.start_as_current_span("parent"):
    with tracer.start_as_current_span("child"):
        # child.parent_id == parent.span_id
        pass
```

### Across Async Operations

```python
import asyncio
from opentelemetry import context

async def traced_async():
    # Context propagates across await boundaries
    async with tracer.start_as_current_span("async_op"):
        await asyncio.sleep(0.1)
```

### Across Services (Distributed Tracing)

For microservices, propagate context via headers:

```python
from opentelemetry.propagate import inject, extract

# Outgoing request
headers = {}
inject(headers)
response = requests.get(url, headers=headers)

# Incoming request (other service)
ctx = extract(request.headers)
with tracer.start_as_current_span("handle_request", context=ctx):
    process_request()
```

## Related Documentation

- [Introduction](./introduction.md) - What and why of LLM observability
- [Quick Start](./quick-start.md) - Get tracing working in 5 minutes
- [Phoenix Docker Deployment](../deployment/phoenix-docker.md) - Production setup
- [LLM Span Attributes](../domains/spans/llm-spans.md) - Attribute reference
