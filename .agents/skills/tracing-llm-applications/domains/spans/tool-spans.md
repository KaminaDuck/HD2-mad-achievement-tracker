---
title: "Tool Span Instrumentation"
description: "Instrument tool and function execution during LLM agent workflows"
tags:
  - opentelemetry
  - tools
  - function-calling
  - spans
  - tracing
  - genai
category: observability
subcategory: tracing
type: span-guide
version: "1.0"
status: stable
related:
  - "llm-spans.md"
  - "agent-spans.md"
  - "retriever-spans.md"
  - "../conventions/genai-attributes.md"
sources:
  - name: OpenTelemetry GenAI Span Conventions
    url: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
  - name: OpenInference Semantic Conventions
    url: https://arize-ai.github.io/openinference/spec/semantic_conventions.html
---

# Tool Span Instrumentation

Tool spans capture the execution of external tools, functions, and APIs invoked by LLM agents during agentic workflows.

## Span Identification

| Property | Value |
|----------|-------|
| OpenInference Span Kind | `TOOL` |
| OTel Span Naming | `execute_tool {gen_ai.tool.name}` |
| OTel Span Kind | `INTERNAL` |
| Typical Position | Child of AGENT or LLM spans |

**Examples:**
- `execute_tool get_weather`
- `execute_tool search_database`
- `execute_tool calculate`

## Tool-Specific Attributes

| Attribute | Requirement | Type | Description | Example |
|-----------|-------------|------|-------------|---------|
| `gen_ai.tool.name` | Recommended | string | Tool identifier | `get_weather`, `search_database` |
| `gen_ai.tool.type` | Recommended | string | Tool category | `function`, `extension`, `datastore` |
| `gen_ai.tool.call.id` | Recommended | string | Unique invocation identifier | `call_abc123` |
| `gen_ai.tool.call.arguments` | Opt-In | JSON string | Input parameters | `{"location": "Boston"}` |
| `gen_ai.tool.call.result` | Opt-In | JSON string | Return value | `{"temp": 72, "conditions": "sunny"}` |

**OpenInference Attributes:**
| Attribute | Description |
|-----------|-------------|
| `openinference.span.kind` | Set to `"TOOL"` |
| `tool.name` | Name of the tool |
| `tool.description` | Tool description |
| `tool.parameters` | Input parameters |
| `tool.json_schema` | JSON schema for tool definition |

## Tool Call Workflow Pattern

Tools are typically invoked when an LLM requests function execution.

```
Inference Span (chat gpt-4) - requests tools
├── Tool Execution Span (execute_tool get_weather)
├── Tool Execution Span (execute_tool search_database)
Inference Span (chat gpt-4) - with tool results
```

The parent inference span includes the tool call request; child spans execute the tools; a subsequent inference span receives the results.

## Code Examples

### Decorator Pattern with Phoenix

```python
from phoenix.otel import register

tracer_provider = register(project_name="my-tool-app")
tracer = tracer_provider.get_tracer(__name__)

@tracer.tool
def get_weather(city: str, units: str = "celsius") -> dict:
    """
    Fetches current weather for a given city.

    Args:
        city: The city name to get weather for
        units: Temperature units (celsius or fahrenheit)

    Returns:
        Weather data including temperature and conditions
    """
    response = weather_api.get(city=city, units=units)
    return {
        "temperature": response.temp,
        "conditions": response.conditions,
        "humidity": response.humidity
    }

result = get_weather("San Francisco", units="fahrenheit")
```

### Manual Context Manager

```python
import json
from opentelemetry import trace
from opentelemetry.trace import SpanKind, Status, StatusCode

tracer = trace.get_tracer(__name__)

def execute_tool(tool_name: str, arguments: dict) -> dict:
    with tracer.start_as_current_span(
        f"execute_tool {tool_name}",
        kind=SpanKind.INTERNAL
    ) as span:
        span.set_attributes({
            "openinference.span.kind": "TOOL",
            "gen_ai.tool.name": tool_name,
            "gen_ai.tool.type": "function",
            "gen_ai.tool.call.id": generate_call_id(),
        })

        span.set_attribute(
            "gen_ai.tool.call.arguments",
            json.dumps(arguments)
        )

        try:
            result = TOOL_REGISTRY[tool_name](**arguments)

            span.set_attribute(
                "gen_ai.tool.call.result",
                json.dumps(result)
            )
            span.set_status(Status(StatusCode.OK))
            return result

        except Exception as e:
            span.set_status(Status(StatusCode.ERROR))
            span.record_exception(e)
            raise
```

### Function Calling Integration

```python
from openai import OpenAI

client = OpenAI()
tracer = trace.get_tracer(__name__)

def process_tool_calls(tool_calls: list) -> list:
    """Process tool calls from LLM response."""
    results = []

    for tool_call in tool_calls:
        with tracer.start_as_current_span(
            f"execute_tool {tool_call.function.name}"
        ) as span:
            span.set_attributes({
                "openinference.span.kind": "TOOL",
                "gen_ai.tool.name": tool_call.function.name,
                "gen_ai.tool.call.id": tool_call.id,
                "gen_ai.tool.type": "function",
            })

            arguments = json.loads(tool_call.function.arguments)
            span.set_attribute(
                "gen_ai.tool.call.arguments",
                tool_call.function.arguments
            )

            result = execute_function(
                tool_call.function.name,
                arguments
            )

            span.set_attribute(
                "gen_ai.tool.call.result",
                json.dumps(result)
            )

            results.append({
                "tool_call_id": tool_call.id,
                "role": "tool",
                "content": json.dumps(result)
            })

    return results
```

## Tool Definition Tracking

Capture tool definitions provided to the LLM.

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get current weather for a location",
            "parameters": {
                "type": "object",
                "properties": {
                    "location": {"type": "string"},
                    "units": {"type": "string", "enum": ["celsius", "fahrenheit"]}
                },
                "required": ["location"]
            }
        }
    }
]

with tracer.start_as_current_span("chat gpt-4") as span:
    span.set_attribute("gen_ai.tool.definitions", json.dumps(tools))
```

## Related Documentation

- [LLM Spans](llm-spans.md) - LLM calls that request tool execution
- [Agent Spans](agent-spans.md) - Agent orchestration using tools
- [Retriever Spans](retriever-spans.md) - Specialized retrieval tools
