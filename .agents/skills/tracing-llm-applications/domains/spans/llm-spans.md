---
title: "LLM Inference Span Instrumentation"
description: "Comprehensive guide for instrumenting LLM inference calls with OpenTelemetry GenAI conventions"
tags:
  - opentelemetry
  - llm
  - inference
  - spans
  - tracing
  - genai
category: observability
subcategory: tracing
type: span-guide
version: "1.0"
status: stable
related:
  - "agent-spans.md"
  - "tool-spans.md"
  - "embedding-spans.md"
  - "../conventions/genai-attributes.md"
sources:
  - name: OpenTelemetry GenAI Span Conventions
    url: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
  - name: OpenInference Semantic Conventions
    url: https://arize-ai.github.io/openinference/spec/semantic_conventions.html
---

# LLM Inference Span Instrumentation

This guide covers the instrumentation of Large Language Model inference calls, the most fundamental span type in AI observability.

## Span Identification

| Property | Value |
|----------|-------|
| OpenInference Span Kind | `LLM` |
| OTel GenAI Operation | Inference Span |
| Span Naming | `{gen_ai.operation.name} {gen_ai.request.model}` |
| OTel Span Kind | `CLIENT` (or `INTERNAL` for same-process) |

**Examples:**
- `chat gpt-4`
- `text_completion claude-3-opus`
- `generate_content gemini-pro`

## Required Attributes

Every LLM span must include these attributes for proper trace classification.

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `gen_ai.operation.name` | string | Operation type being performed | `chat`, `text_completion`, `generate_content` |
| `gen_ai.provider.name` | string | Provider identifier | `openai`, `anthropic`, `aws.bedrock`, `azure.ai.openai` |

## Token Usage (Recommended)

Track token consumption for cost analysis and optimization.

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `gen_ai.usage.input_tokens` | int | Tokens consumed in prompt | `150` |
| `gen_ai.usage.output_tokens` | int | Tokens generated in response | `75` |

**Cost Calculation Pattern:**
```python
input_cost = input_tokens * input_price_per_1k_tokens / 1000
output_cost = output_tokens * output_price_per_1k_tokens / 1000
total_cost = input_cost + output_cost
```

## Model Parameters (Recommended)

Capture generation settings to understand behavior and enable reproducibility.

| Attribute | Type | Description | Typical Range |
|-----------|------|-------------|---------------|
| `gen_ai.request.model` | string | Model name being invoked | `gpt-4`, `claude-3-opus-20240229` |
| `gen_ai.request.temperature` | double | Creativity/randomness control | 0.0-2.0 |
| `gen_ai.request.top_p` | double | Nucleus sampling threshold | 0.0-1.0 |
| `gen_ai.request.top_k` | double | Top-k sampling limit | Integer |
| `gen_ai.request.max_tokens` | int | Maximum tokens to generate | Integer |
| `gen_ai.request.frequency_penalty` | double | Repetition penalty | -2.0 to 2.0 |
| `gen_ai.request.presence_penalty` | double | Topic repetition penalty | -2.0 to 2.0 |
| `gen_ai.request.stop_sequences` | string[] | Custom termination patterns | `["END", "\n\n"]` |
| `gen_ai.request.seed` | int | Deterministic generation seed | Integer |

## Response Metadata (Recommended)

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `gen_ai.response.finish_reasons` | string[] | Completion status per choice | `["stop"]`, `["tool_calls"]` |
| `gen_ai.response.id` | string | Unique response identifier | `chatcmpl-123abc` |
| `gen_ai.response.model` | string | Actual model used (may differ from request) | `gpt-4-0613` |

**Finish Reasons:**
- `stop` - Natural completion
- `length` - Max tokens reached
- `tool_calls` - Model requests tool execution
- `content_filter` - Content policy violation

## Code Examples

### Auto-Instrumentation with Pydantic AI

```python
from pydantic_ai import Agent
from phoenix.otel import register

tracer_provider = register(
    project_name="my-llm-app",
    auto_instrument=True
)

agent = Agent("openai:gpt-4o")

@agent.tool_plain
def get_weather(city: str) -> str:
    return f"Weather in {city}: 72F, sunny"

result = agent.run_sync("What's the weather in Boston?")
```

### Manual Span Creation with Context Manager

```python
from opentelemetry import trace
from opentelemetry.trace import SpanKind, Status, StatusCode

tracer = trace.get_tracer(__name__)

def invoke_llm(messages: list, model: str = "gpt-4") -> str:
    with tracer.start_as_current_span(
        f"chat {model}",
        kind=SpanKind.CLIENT
    ) as span:
        span.set_attributes({
            "gen_ai.operation.name": "chat",
            "gen_ai.provider.name": "openai",
            "gen_ai.request.model": model,
            "gen_ai.request.temperature": 0.7,
            "gen_ai.request.max_tokens": 500,
        })

        try:
            response = client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.7,
                max_tokens=500,
            )

            span.set_attributes({
                "gen_ai.usage.input_tokens": response.usage.prompt_tokens,
                "gen_ai.usage.output_tokens": response.usage.completion_tokens,
                "gen_ai.response.id": response.id,
                "gen_ai.response.model": response.model,
                "gen_ai.response.finish_reasons": [
                    choice.finish_reason for choice in response.choices
                ],
            })

            span.set_status(Status(StatusCode.OK))
            return response.choices[0].message.content

        except Exception as e:
            span.set_status(Status(StatusCode.ERROR))
            span.set_attribute("error.type", type(e).__name__)
            span.record_exception(e)
            raise
```

### Error Handling Pattern

```python
from opentelemetry.trace import Status, StatusCode

with tracer.start_as_current_span("chat gpt-4", kind=SpanKind.CLIENT) as span:
    span.set_attributes({
        "gen_ai.operation.name": "chat",
        "gen_ai.provider.name": "openai",
        "gen_ai.request.model": "gpt-4",
    })

    try:
        response = client.chat.completions.create(...)
        span.set_status(Status(StatusCode.OK))
    except RateLimitError as e:
        span.set_attribute("error.type", "rate_limit_exceeded")
        span.set_status(Status(StatusCode.ERROR, "Rate limit exceeded"))
        span.record_exception(e)
        raise
    except InvalidRequestError as e:
        span.set_attribute("error.type", "invalid_request")
        span.set_status(Status(StatusCode.ERROR, str(e)))
        span.record_exception(e)
        raise
    except APIError as e:
        span.set_attribute("error.type", "api_error")
        span.set_status(Status(StatusCode.ERROR))
        span.record_exception(e)
        raise
```

## Content Capture (Opt-In)

By default, omit prompts and completions to minimize storage costs and privacy risks.

**When enabled:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `gen_ai.input.messages` | JSON string | Chat history provided to model |
| `gen_ai.output.messages` | JSON string | Model responses |
| `gen_ai.system_instructions` | JSON string | System prompts |

**Privacy Warning:** Input/output attributes likely contain sensitive information including user data and PII.

```python
import json

if capture_content_enabled:
    span.set_attribute("gen_ai.input.messages", json.dumps([
        {"role": "user", "content": "What is the capital of France?"}
    ]))
    span.set_attribute("gen_ai.output.messages", json.dumps([
        {"role": "assistant", "content": "The capital of France is Paris."}
    ]))
```

## Related Documentation

- [Agent Spans](agent-spans.md) - Multi-step reasoning workflows
- [Tool Spans](tool-spans.md) - Function execution instrumentation
- [Embedding Spans](embedding-spans.md) - Vector embedding generation
