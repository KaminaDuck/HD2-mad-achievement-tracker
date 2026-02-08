---
title: "LLM Tracing Cheat Sheet"
description: "Quick reference for OpenTelemetry LLM tracing including installation, setup, span patterns, token tracking, environment variables, and debug commands"
tags:
  - opentelemetry
  - tracing
  - llm
  - observability
  - phoenix
  - pydantic-ai
  - quick-reference
category: observability
subcategory: tracing
type: cheat-sheet
version: "1.0"
status: stable
sources:
  - name: "Arize Phoenix Documentation"
    url: "https://docs.arize.com/phoenix"
  - name: "OpenTelemetry Python SDK"
    url: "https://opentelemetry.io/docs/languages/python/"
  - name: "OpenInference Semantic Conventions"
    url: "https://github.com/Arize-ai/openinference"
related:
  - "../overview/introduction.md"
  - "../deployment/phoenix-docker.md"
  - "span-kinds-table.md"
  - "troubleshooting.md"
author: "AI Engineering Team"
contributors: []
---

# LLM Tracing Cheat Sheet

Quick reference for OpenTelemetry-based LLM application tracing with Phoenix and Pydantic AI.

---

## Installation

### Python Dependencies

```bash
pip install pydantic-ai arize-phoenix opentelemetry-sdk opentelemetry-exporter-otlp
pip install openinference-instrumentation-openai  # For OpenAI
pip install openinference-instrumentation-anthropic  # For Anthropic
pip install openinference-instrumentation-langchain  # For LangChain
pip install openinference-instrumentation-llama-index  # For LlamaIndex
```

### Start Phoenix Collector

```bash
# Docker (recommended for production)
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest

# Python (development)
python -m phoenix.server.main serve

# With PostgreSQL persistence
docker run -p 6006:6006 -p 4317:4317 \
  -e PHOENIX_SQL_DATABASE_URL=postgresql://user:pass@host:5432/phoenix \
  arizephoenix/phoenix:latest
```

---

## Quick Setup

### Minimal Pydantic AI Setup

```python
from phoenix.otel import register
from pydantic_ai import Agent

# Register tracer provider with Phoenix
tracer_provider = register(project_name="my-app")

# Instrument all Pydantic AI agents
Agent.instrument_all()

# Create and use agent (traces automatic)
agent = Agent("openai:gpt-4o")
result = agent.run_sync("Hello, world!")
```

### Manual OpenTelemetry Setup

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource

# Create resource
resource = Resource.create({"service.name": "my-llm-app"})

# Create tracer provider
provider = TracerProvider(resource=resource)

# Add OTLP exporter
exporter = OTLPSpanExporter(endpoint="http://localhost:6006/v1/traces")
provider.add_span_processor(BatchSpanProcessor(exporter))

# Set global tracer provider
trace.set_tracer_provider(provider)

# Get tracer
tracer = trace.get_tracer(__name__)
```

---

## Environment Variables

### OTLP Exporter Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Collector endpoint | `http://localhost:6006` |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | Protocol (grpc, http/protobuf) | `http/protobuf` |
| `OTEL_EXPORTER_OTLP_HEADERS` | Auth headers | `authorization=Bearer token` |
| `OTEL_RESOURCE_ATTRIBUTES` | Resource attributes | `service.name=my-app` |
| `OTEL_SERVICE_NAME` | Service name shortcut | `my-llm-app` |

### Phoenix Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `PHOENIX_COLLECTOR_ENDPOINT` | Phoenix collector URL | `http://localhost:6006` |
| `PHOENIX_API_KEY` | Phoenix Cloud API key | `phx_abc123...` |
| `PHOENIX_PROJECT_NAME` | Default project name | `my-project` |
| `PHOENIX_SQL_DATABASE_URL` | PostgreSQL connection | `postgresql://...` |

### Batch Processor Tuning

| Variable | Description | Default |
|----------|-------------|---------|
| `OTEL_BSP_MAX_QUEUE_SIZE` | Max queue size | `2048` |
| `OTEL_BSP_MAX_EXPORT_BATCH_SIZE` | Batch size | `512` |
| `OTEL_BSP_SCHEDULE_DELAY` | Export delay (ms) | `5000` |
| `OTEL_BSP_EXPORT_TIMEOUT` | Export timeout (ms) | `30000` |

---

## Common Span Patterns

### LLM Span (Chat Completion)

```python
from opentelemetry.trace import SpanKind, Status, StatusCode

with tracer.start_as_current_span("chat gpt-4", kind=SpanKind.CLIENT) as span:
    span.set_attributes({
        "openinference.span.kind": "LLM",
        "gen_ai.operation.name": "chat",
        "gen_ai.provider.name": "openai",
        "gen_ai.request.model": "gpt-4",
        "gen_ai.request.temperature": 0.7,
        "gen_ai.request.max_tokens": 1000,
    })

    response = client.chat.completions.create(...)

    span.set_attributes({
        "gen_ai.response.model": response.model,
        "gen_ai.usage.input_tokens": response.usage.prompt_tokens,
        "gen_ai.usage.output_tokens": response.usage.completion_tokens,
    })
```

### Tool Execution Span

```python
with tracer.start_as_current_span("execute_tool get_weather", kind=SpanKind.INTERNAL) as span:
    span.set_attributes({
        "openinference.span.kind": "TOOL",
        "gen_ai.tool.name": "get_weather",
        "gen_ai.tool.type": "function",
        "gen_ai.tool.description": "Get current weather for a location",
    })

    # Log tool input
    span.set_attribute("tool.parameters", json.dumps({"location": "NYC"}))

    result = get_weather("NYC")

    # Log tool output
    span.set_attribute("tool.result", json.dumps(result))
```

### Retriever Span (RAG)

```python
with tracer.start_as_current_span("vector_search", kind=SpanKind.INTERNAL) as span:
    span.set_attributes({
        "openinference.span.kind": "RETRIEVER",
        "retrieval.query": query,
        "retrieval.top_k": 5,
    })

    documents = vector_store.similarity_search(query, k=5)

    # Log retrieved documents
    for i, doc in enumerate(documents):
        span.set_attribute(f"retrieval.documents.{i}.content", doc.content[:500])
        span.set_attribute(f"retrieval.documents.{i}.score", doc.score)
```

### Agent Span (Multi-step)

```python
with tracer.start_as_current_span("research_agent", kind=SpanKind.INTERNAL) as span:
    span.set_attributes({
        "openinference.span.kind": "AGENT",
        "agent.name": "research_agent",
        "agent.description": "Research and summarize topics",
    })

    # Child spans for LLM calls and tool executions are nested automatically
    result = agent.run(query)

    span.set_attribute("agent.iterations", result.iteration_count)
```

### Error Handling

```python
with tracer.start_as_current_span("llm_call", kind=SpanKind.CLIENT) as span:
    try:
        response = client.chat.completions.create(...)
    except openai.RateLimitError as e:
        span.set_status(Status(StatusCode.ERROR, "Rate limited"))
        span.record_exception(e)
        span.set_attribute("error.type", "rate_limit")
        raise
    except openai.APIError as e:
        span.set_status(Status(StatusCode.ERROR, str(e)))
        span.record_exception(e)
        raise
```

---

## Token Tracking

### OpenAI Response

```python
span.set_attributes({
    "gen_ai.usage.input_tokens": response.usage.prompt_tokens,
    "gen_ai.usage.output_tokens": response.usage.completion_tokens,
    "gen_ai.usage.total_tokens": response.usage.total_tokens,
})

# Streaming (accumulate)
total_tokens = 0
for chunk in stream:
    if chunk.usage:
        total_tokens = chunk.usage.total_tokens
span.set_attribute("gen_ai.usage.total_tokens", total_tokens)
```

### Anthropic Response

```python
span.set_attributes({
    "gen_ai.usage.input_tokens": response.usage.input_tokens,
    "gen_ai.usage.output_tokens": response.usage.output_tokens,
})
```

### Cost Estimation

```python
# Model-specific pricing (per 1K tokens)
PRICING = {
    "gpt-4": {"input": 0.03, "output": 0.06},
    "gpt-4o": {"input": 0.005, "output": 0.015},
    "claude-3-opus": {"input": 0.015, "output": 0.075},
}

input_cost = (input_tokens / 1000) * PRICING[model]["input"]
output_cost = (output_tokens / 1000) * PRICING[model]["output"]
span.set_attribute("llm.cost.usd", input_cost + output_cost)
```

---

## Span Kinds Reference

| Kind | Use Case | SpanKind | Auto-Instrumented |
|------|----------|----------|-------------------|
| `LLM` | Model inference calls | `CLIENT` | OpenAI, Anthropic |
| `TOOL` | Function/tool execution | `INTERNAL` | Framework-dependent |
| `AGENT` | Multi-step orchestration | `INTERNAL` | Pydantic AI, LangChain |
| `RETRIEVER` | Vector/document search | `INTERNAL` | LlamaIndex |
| `RERANKER` | Document reranking | `INTERNAL` | Cohere |
| `EMBEDDING` | Embedding generation | `CLIENT` | OpenAI, Cohere |
| `CHAIN` | General orchestration | `INTERNAL` | LangChain |
| `GUARDRAIL` | Safety checks | `INTERNAL` | Guardrails AI |
| `EVALUATOR` | Quality evaluation | `INTERNAL` | Phoenix Evals |

---

## Debug Commands

### Check Phoenix Status

```bash
# Health check
curl http://localhost:6006/health

# Check OTLP endpoint
curl -X POST http://localhost:6006/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans": []}'

# Phoenix version
curl http://localhost:6006/version
```

### Docker Troubleshooting

```bash
# View Phoenix logs
docker logs <phoenix-container-id>

# Check container networking
docker exec <container-id> curl http://phoenix:6006/health

# Verify port bindings
docker port <phoenix-container-id>

# Check resource usage
docker stats <phoenix-container-id>
```

### Python Diagnostics

```python
import os
from opentelemetry import trace

print("OTLP Endpoint:", os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT"))
print("Service Name:", os.getenv("OTEL_SERVICE_NAME"))
print("Tracer Provider:", trace.get_tracer_provider())

# Force flush spans
provider = trace.get_tracer_provider()
if hasattr(provider, 'force_flush'):
    provider.force_flush()
```

### Verify Instrumentation

```python
from opentelemetry.instrumentation import get_instrumentations

# List active instrumentations
for instr in get_instrumentations():
    print(f"{instr.__class__.__name__}: {instr.is_instrumented()}")
```

---

## Common Patterns

### Context Propagation

```python
from opentelemetry import context
from opentelemetry.propagate import inject, extract

# Inject context into headers (for HTTP requests)
headers = {}
inject(headers)

# Extract context from headers
ctx = extract(headers)
with trace.get_tracer(__name__).start_as_current_span("child", context=ctx):
    ...
```

### Adding Events to Spans

```python
span.add_event("prompt_sent", {
    "prompt.length": len(prompt),
    "prompt.tokens_estimated": len(prompt.split()),
})

span.add_event("response_received", {
    "response.length": len(response),
    "response.finish_reason": "stop",
})
```

### Span Links (RAG Context)

```python
from opentelemetry.trace import Link

# Link retrieval span to generation span
retrieval_context = retrieval_span.get_span_context()
with tracer.start_as_current_span("generate", links=[Link(retrieval_context)]) as span:
    ...
```

---

## Quick Config Templates

### Production Setup

```python
from phoenix.otel import register

tracer_provider = register(
    project_name="production-app",
    endpoint="https://phoenix.company.com",
    headers={"authorization": f"Bearer {os.getenv('PHOENIX_API_KEY')}"},
    batch=True,
)
```

### Local Development

```python
from phoenix.otel import register

tracer_provider = register(
    project_name="dev",
    endpoint="http://localhost:6006",
)
```

### Testing (No Export)

```python
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

exporter = InMemorySpanExporter()
provider = TracerProvider()
provider.add_span_processor(SimpleSpanProcessor(exporter))

# After test
spans = exporter.get_finished_spans()
assert len(spans) > 0
```

---

## Related

- [Span Kinds Reference](span-kinds-table.md)
- [Troubleshooting Guide](troubleshooting.md)
- [Docker Compose Deployment](../deployment/phoenix-docker.md)
- [Concepts Overview](../overview/introduction.md)
