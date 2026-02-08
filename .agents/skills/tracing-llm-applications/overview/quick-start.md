---
title: "LLM Tracing Quick Start"
description: "Get LLM tracing working in 5 minutes with Pydantic AI, OpenTelemetry, and Phoenix"
tags: ["quickstart", "pydantic-ai", "phoenix", "opentelemetry", "tracing", "setup"]
category: observability
subcategory: llm-tracing
type: quickstart-guide
version: "1.0"
status: stable
sources:
  - name: "Arize Phoenix Quick Start"
    url: "https://docs.arize.com/phoenix/quickstart"
  - name: "Pydantic AI Instrumentation"
    url: "https://ai.pydantic.dev/tracing/"
related:
  - "./introduction.md"
  - "./architecture.md"
  - "../deployment/phoenix-docker.md"
  - "../domains/spans/llm-spans.md"
author: "unknown"
contributors: []
---

# LLM Tracing Quick Start

Get full observability for your LLM applications in 5 minutes. This guide uses Pydantic AI with Phoenix as the trace backend.

## Prerequisites

Before starting, ensure you have:

- **Python 3.9+** installed
- **Docker** installed and running
- **LLM API key** (OpenAI, Anthropic, or other supported provider)

## Step 1: Start Phoenix

Phoenix runs as a Docker container that collects and visualizes traces.

```bash
docker pull arizephoenix/phoenix:latest
docker run -d \
  --name phoenix \
  -p 6006:6006 \
  -p 4317:4317 \
  arizephoenix/phoenix:latest
```

**Ports explained:**
- `6006`: Phoenix UI and HTTP trace endpoint
- `4317`: gRPC OTLP endpoint (optional, for high-volume scenarios)

Verify Phoenix is running by opening http://localhost:6006 in your browser.

## Step 2: Install Dependencies

Create a virtual environment and install the required packages:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

pip install pydantic-ai arize-phoenix opentelemetry-sdk opentelemetry-exporter-otlp
```

**Package breakdown:**
- `pydantic-ai`: LLM agent framework with built-in tracing support
- `arize-phoenix`: Phoenix client library with OTel helpers
- `opentelemetry-sdk`: Core OpenTelemetry implementation
- `opentelemetry-exporter-otlp`: OTLP protocol exporter

## Step 3: Create Your First Traced Application

Create a file `traced_agent.py`:

```python
from phoenix.otel import register
from pydantic_ai import Agent

# Step 1: Connect to Phoenix
# This creates a TracerProvider configured to export to Phoenix
tracer_provider = register(
    project_name="quickstart",
    endpoint="http://localhost:6006/v1/traces"
)

# Step 2: Enable auto-instrumentation for all Pydantic AI agents
# This patches Agent to create spans automatically
Agent.instrument_all()

# Step 3: Create and use an agent
agent = Agent('openai:gpt-4')

# Step 4: Run the agent - traces are captured automatically
result = agent.run_sync('What is OpenTelemetry in one sentence?')
print(result.data)
```

Set your API key and run:

```bash
export OPENAI_API_KEY="your-key-here"
python traced_agent.py
```

## Step 4: Verify Traces in Phoenix

1. Open http://localhost:6006 in your browser
2. Navigate to the **Traces** tab
3. Find your trace in the list (project: "quickstart")
4. Click to expand the trace waterfall view

You should see a span hierarchy like:

```
agent run
├── llm (openai:gpt-4)
│   ├── input: "What is OpenTelemetry in one sentence?"
│   ├── output: "OpenTelemetry is..."
│   ├── token_count_prompt: 15
│   ├── token_count_completion: 25
│   └── duration: 1.2s
```

## Step 5: Add Tool Calls

Extend your agent with tools to see richer traces:

```python
from phoenix.otel import register
from pydantic_ai import Agent

tracer_provider = register(
    project_name="quickstart-tools",
    endpoint="http://localhost:6006/v1/traces"
)

Agent.instrument_all()

agent = Agent('openai:gpt-4')

@agent.tool
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    # Simulated weather data
    return f"Weather in {city}: 72F, sunny"

@agent.tool
def get_time(timezone: str) -> str:
    """Get the current time in a timezone."""
    from datetime import datetime
    return f"Current time: {datetime.now().isoformat()}"

# Run with a query that triggers tool use
result = agent.run_sync('What is the weather in Seattle and the current time in UTC?')
print(result.data)
```

The trace now shows:

```
agent run
├── llm (tool selection)
├── tool: get_weather
│   └── input: {"city": "Seattle"}
├── tool: get_time
│   └── input: {"timezone": "UTC"}
└── llm (final response)
```

## Step 6: Export Environment Variables (Optional)

For production-like setup, configure via environment variables:

```bash
export PHOENIX_PROJECT_NAME="my-project"
export PHOENIX_COLLECTOR_ENDPOINT="http://localhost:6006/v1/traces"
```

Then simplify your code:

```python
from phoenix.otel import register
from pydantic_ai import Agent

# Uses environment variables automatically
register()
Agent.instrument_all()

agent = Agent('openai:gpt-4')
result = agent.run_sync('Hello!')
```

## Common Issues

### Phoenix Not Receiving Traces

1. Verify Phoenix is running: `docker ps | grep phoenix`
2. Check the endpoint URL matches your Phoenix instance
3. Ensure no firewall blocks ports 6006/4317

### Missing Token Counts

Token usage depends on the LLM provider returning this information:
- OpenAI: Full support
- Anthropic: Full support
- Local models: May not report tokens

### Spans Not Linked

If async operations create disconnected spans, ensure context propagation:

```python
import asyncio
from opentelemetry import context

async def traced_operation():
    # Context is automatically propagated in async with proper instrumentation
    result = await agent.run('Query')
    return result
```

## Configuration Reference

### TracerProvider Options

```python
tracer_provider = register(
    project_name="my-project",           # Groups traces in Phoenix UI
    endpoint="http://localhost:6006/v1/traces",  # Phoenix HTTP endpoint
    batch=True,                          # Batch spans before export (default)
    set_global_tracer_provider=True,     # Set as global provider (default)
)
```

### Using gRPC Instead of HTTP

For higher throughput:

```python
tracer_provider = register(
    project_name="my-project",
    endpoint="http://localhost:4317",    # gRPC endpoint
    protocol="grpc",                     # Use gRPC protocol
)
```

## Next Steps

Now that traces are flowing:

1. **[Architecture Guide](./architecture.md)** - Understand the system design
2. **[LLM Span Attributes](../domains/spans/llm-spans.md)** - Learn what data is captured
3. **[Phoenix Docker Deployment](../deployment/phoenix-docker.md)** - Production setup with persistence
4. **[Framework Integration](../domains/frameworks/)** - Instrument LangChain, custom code

## Quick Reference

| Action | Command/Code |
|--------|--------------|
| Start Phoenix | `docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest` |
| View traces | http://localhost:6006 |
| Install deps | `pip install pydantic-ai arize-phoenix opentelemetry-sdk opentelemetry-exporter-otlp` |
| Register provider | `register(project_name="...", endpoint="...")` |
| Enable auto-instrumentation | `Agent.instrument_all()` |
| Stop Phoenix | `docker stop phoenix && docker rm phoenix` |
