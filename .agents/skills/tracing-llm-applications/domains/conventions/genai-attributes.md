---
title: "GenAI Semantic Conventions - Attribute Reference"
description: "Complete attribute reference for OpenTelemetry GenAI semantic conventions covering operations, models, tokens, tools, and agents"
tags: ["opentelemetry", "genai", "semantic-conventions", "attributes", "llm", "observability"]
category: observability
subcategory: llm-tracing
type: attribute-reference
version: "1.0"
status: stable
sources:
  - name: "OpenTelemetry GenAI Semantic Conventions"
    url: "https://opentelemetry.io/docs/specs/semconv/gen-ai/"
  - name: "OpenTelemetry GenAI Spans"
    url: "https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/"
related:
  - "../spans/llm-spans.md"
  - "content-handling.md"
  - "../frameworks/pydantic-ai.md"
---

# GenAI Semantic Conventions - Attribute Reference

This document provides a complete reference for OpenTelemetry GenAI semantic conventions attributes used when instrumenting LLM applications.

## Operation Attributes (Required)

These attributes identify the type of GenAI operation being performed.

| Attribute | Values | Description |
|-----------|--------|-------------|
| `gen_ai.operation.name` | `chat`, `text_completion`, `generate_content`, `embeddings`, `execute_tool` | Operation type being performed |
| `gen_ai.provider.name` | `openai`, `anthropic`, `aws.bedrock`, `azure.ai.openai`, `vertex_ai`, `ollama`, `cohere`, `mistral_ai`, `groq` | Provider identifier (lowercase) |

**Usage Example:**

```python
from opentelemetry import trace

tracer = trace.get_tracer("genai.tracer")

with tracer.start_as_current_span("chat openai") as span:
    span.set_attribute("gen_ai.operation.name", "chat")
    span.set_attribute("gen_ai.provider.name", "openai")
```

## Model Attributes

Attributes describing the model used for inference.

| Attribute | Requirement | Type | Example |
|-----------|-------------|------|---------|
| `gen_ai.request.model` | Conditionally Required | string | `gpt-4`, `claude-3-opus-20240229` |
| `gen_ai.response.model` | Recommended | string | `gpt-4-0613` |
| `gen_ai.response.id` | Recommended | string | `chatcmpl-123abc` |

**Notes:**
- `gen_ai.request.model` is required when available to the instrumentation
- `gen_ai.response.model` captures the actual model used (may differ from request)
- `gen_ai.response.id` is the provider-specific response identifier

**Usage Example:**

```python
span.set_attribute("gen_ai.request.model", "gpt-4")
span.set_attribute("gen_ai.response.model", "gpt-4-0613")
span.set_attribute("gen_ai.response.id", "chatcmpl-abc123xyz")
```

## Token Attributes

Attributes tracking token usage for cost and performance monitoring.

| Attribute | Type | Description |
|-----------|------|-------------|
| `gen_ai.usage.input_tokens` | int | Number of tokens in the input/prompt |
| `gen_ai.usage.output_tokens` | int | Number of tokens in the generated output |
| `gen_ai.token.type` | string | Token type: `input` or `output` (metrics only) |

**Usage Example:**

```python
response = client.chat.completions.create(...)

span.set_attribute("gen_ai.usage.input_tokens", response.usage.prompt_tokens)
span.set_attribute("gen_ai.usage.output_tokens", response.usage.completion_tokens)
```

**Metrics Integration:**

```python
from opentelemetry import metrics

meter = metrics.get_meter("genai.meter")
token_counter = meter.create_counter(
    "gen_ai.client.token.usage",
    unit="{token}",
    description="Token usage by type"
)

token_counter.add(
    response.usage.prompt_tokens,
    {"gen_ai.token.type": "input", "gen_ai.provider.name": "openai"}
)
token_counter.add(
    response.usage.completion_tokens,
    {"gen_ai.token.type": "output", "gen_ai.provider.name": "openai"}
)
```

## Request Parameters

Attributes capturing model configuration parameters.

| Attribute | Type | Range | Description |
|-----------|------|-------|-------------|
| `gen_ai.request.temperature` | double | 0.0-2.0 | Sampling temperature |
| `gen_ai.request.top_p` | double | 0.0-1.0 | Nucleus sampling parameter |
| `gen_ai.request.top_k` | int | Integer | Top-k sampling parameter |
| `gen_ai.request.max_tokens` | int | Integer | Maximum output tokens |
| `gen_ai.request.frequency_penalty` | double | -2.0 to 2.0 | Repetition penalty by frequency |
| `gen_ai.request.presence_penalty` | double | -2.0 to 2.0 | Repetition penalty by presence |
| `gen_ai.request.seed` | int | Integer | Deterministic seed for reproducibility |
| `gen_ai.request.stop_sequences` | string[] | Array | Stop sequences |

**Usage Example:**

```python
span.set_attribute("gen_ai.request.temperature", 0.7)
span.set_attribute("gen_ai.request.top_p", 0.95)
span.set_attribute("gen_ai.request.max_tokens", 1000)
span.set_attribute("gen_ai.request.seed", 42)
```

## Tool Attributes

Attributes for function calling and tool use instrumentation.

| Attribute | Type | Description |
|-----------|------|-------------|
| `gen_ai.tool.name` | string | Tool or function identifier |
| `gen_ai.tool.type` | string | `function`, `extension`, `datastore` |
| `gen_ai.tool.call.id` | string | Unique identifier for the tool call |
| `gen_ai.tool.call.arguments` | JSON string | Input parameters as JSON |
| `gen_ai.tool.call.result` | JSON string | Return value as JSON |

**Usage Example:**

```python
with tracer.start_as_current_span("execute_tool") as span:
    span.set_attribute("gen_ai.operation.name", "execute_tool")
    span.set_attribute("gen_ai.tool.name", "get_weather")
    span.set_attribute("gen_ai.tool.type", "function")
    span.set_attribute("gen_ai.tool.call.id", "call_abc123")
    span.set_attribute("gen_ai.tool.call.arguments", '{"location": "San Francisco"}')

    result = execute_tool(tool_call)

    span.set_attribute("gen_ai.tool.call.result", json.dumps(result))
```

## Agent Attributes

Attributes for multi-agent and conversational systems.

| Attribute | Type | Description |
|-----------|------|-------------|
| `gen_ai.agent.id` | string | Unique agent identifier |
| `gen_ai.agent.name` | string | Human-readable agent name |
| `gen_ai.agent.description` | string | Agent purpose or description |
| `gen_ai.conversation.id` | string | Multi-turn conversation identifier |

**Usage Example:**

```python
with tracer.start_as_current_span("agent_task") as span:
    span.set_attribute("gen_ai.agent.id", "agent-001")
    span.set_attribute("gen_ai.agent.name", "Research Assistant")
    span.set_attribute("gen_ai.agent.description", "Performs web research and summarization")
    span.set_attribute("gen_ai.conversation.id", "conv-abc123")
```

## Provider-Specific Patterns

### OpenAI

```python
span.set_attribute("gen_ai.provider.name", "openai")
span.set_attribute("gen_ai.request.model", "gpt-4")
span.set_attribute("gen_ai.response.model", "gpt-4-0613")
```

For embeddings:
```python
span.set_attribute("gen_ai.operation.name", "embeddings")
span.set_attribute("gen_ai.request.model", "text-embedding-3-large")
```

### Anthropic

```python
span.set_attribute("gen_ai.provider.name", "anthropic")
span.set_attribute("gen_ai.request.model", "claude-3-opus-20240229")
```

System instructions are part of input messages, captured via events or attributes.

### AWS Bedrock

Bedrock hosts multiple providers. Use cloud attributes alongside GenAI attributes:

```python
span.set_attribute("gen_ai.provider.name", "aws.bedrock")
span.set_attribute("gen_ai.request.model", "anthropic.claude-3-sonnet-20240229-v1:0")
span.set_attribute("cloud.platform", "aws_bedrock")
span.set_attribute("cloud.region", "us-east-1")
```

### Azure OpenAI

```python
span.set_attribute("gen_ai.provider.name", "azure.ai.openai")
span.set_attribute("gen_ai.request.model", "my-gpt4-deployment")
span.set_attribute("cloud.platform", "azure_openai")
span.set_attribute("cloud.region", "eastus")
```

### Google Vertex AI

```python
span.set_attribute("gen_ai.provider.name", "vertex_ai")
span.set_attribute("gen_ai.request.model", "gemini-1.5-pro")
span.set_attribute("cloud.platform", "gcp_vertex_ai")
span.set_attribute("cloud.region", "us-central1")
```

### Ollama (Local)

```python
span.set_attribute("gen_ai.provider.name", "ollama")
span.set_attribute("gen_ai.request.model", "llama3:70b")
span.set_attribute("server.address", "localhost")
span.set_attribute("server.port", 11434)
```

## Deprecated Attributes

The following attributes have been deprecated. Update instrumentation to use replacements.

| Deprecated Attribute | Replacement | Notes |
|----------------------|-------------|-------|
| `gen_ai.system` | `gen_ai.provider.name` | Renamed for clarity |
| `gen_ai.usage.prompt_tokens` | `gen_ai.usage.input_tokens` | Standardized naming |
| `gen_ai.usage.completion_tokens` | `gen_ai.usage.output_tokens` | Standardized naming |

**Migration Example:**

```python
# Deprecated
span.set_attribute("gen_ai.system", "openai")
span.set_attribute("gen_ai.usage.prompt_tokens", 100)
span.set_attribute("gen_ai.usage.completion_tokens", 50)

# Current
span.set_attribute("gen_ai.provider.name", "openai")
span.set_attribute("gen_ai.usage.input_tokens", 100)
span.set_attribute("gen_ai.usage.output_tokens", 50)
```

## Attribute Cardinality Considerations

When selecting attributes to record, consider cardinality impact on backends:

| Attribute | Cardinality | Recommendation |
|-----------|-------------|----------------|
| `gen_ai.provider.name` | Low | Always include |
| `gen_ai.operation.name` | Low | Always include |
| `gen_ai.request.model` | Medium | Always include |
| `gen_ai.response.id` | High | Include on spans, avoid on metrics |
| `gen_ai.conversation.id` | High | Include on spans, avoid on metrics |
| `gen_ai.tool.call.id` | High | Include on spans, avoid on metrics |

## Complete Span Example

```python
import json
from opentelemetry import trace

tracer = trace.get_tracer("genai.tracer", "1.0.0")

def traced_chat_completion(client, messages, **kwargs):
    model = kwargs.get("model", "gpt-4")

    with tracer.start_as_current_span(f"chat {model}") as span:
        span.set_attribute("gen_ai.operation.name", "chat")
        span.set_attribute("gen_ai.provider.name", "openai")
        span.set_attribute("gen_ai.request.model", model)

        if "temperature" in kwargs:
            span.set_attribute("gen_ai.request.temperature", kwargs["temperature"])
        if "max_tokens" in kwargs:
            span.set_attribute("gen_ai.request.max_tokens", kwargs["max_tokens"])

        response = client.chat.completions.create(
            messages=messages,
            **kwargs
        )

        span.set_attribute("gen_ai.response.model", response.model)
        span.set_attribute("gen_ai.response.id", response.id)
        span.set_attribute("gen_ai.usage.input_tokens", response.usage.prompt_tokens)
        span.set_attribute("gen_ai.usage.output_tokens", response.usage.completion_tokens)

        return response
```

## Related Documentation

- [Span Hierarchy](../spans/llm-spans.md) - Span structure and nesting
- [Content Handling](content-handling.md) - Prompts, completions, and PII
- [OpenAI Instrumentation](../frameworks/pydantic-ai.md) - OpenAI-specific patterns

## References

- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [OpenTelemetry GenAI Spans](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/)
- [OpenTelemetry GenAI Metrics](https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-metrics/)
