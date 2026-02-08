---
title: "Agent Span Instrumentation"
description: "Trace agent orchestration and multi-step reasoning workflows in LLM applications"
tags:
  - opentelemetry
  - agents
  - orchestration
  - spans
  - tracing
  - genai
  - react
category: observability
subcategory: tracing
type: span-guide
version: "1.0"
status: stable
related:
  - "llm-spans.md"
  - "tool-spans.md"
  - "retriever-spans.md"
  - "../conventions/genai-attributes.md"
sources:
  - name: OpenTelemetry GenAI Span Conventions
    url: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
  - name: OpenInference Semantic Conventions
    url: https://arize-ai.github.io/openinference/spec/semantic_conventions.html
---

# Agent Span Instrumentation

Agent spans capture higher-level agentic behaviors and multi-step reasoning workflows, serving as parent spans that orchestrate LLM calls and tool executions.

## Span Identification

| Property | Value |
|----------|-------|
| OpenInference Span Kind | `AGENT` |
| OTel Span Kind | `INTERNAL` or `CLIENT` (context-dependent) |
| Typical Position | Top-level or near top-level |

## Use Cases

- Multi-step reasoning with LLM guidance
- ReAct (Reasoning + Acting) agent patterns
- Autonomous workflows with planning and execution
- Tool-using agents that iterate until task completion

## Agent-Specific Attributes

| Attribute | Requirement | Type | Description | Example |
|-----------|-------------|------|-------------|---------|
| `gen_ai.agent.id` | Recommended | string | Unique agent identifier | `agent-uuid-123` |
| `gen_ai.agent.name` | Recommended | string | Human-readable agent name | `research_assistant` |
| `gen_ai.agent.description` | Opt-In | string | Free-form agent description | `Conducts web research and summarization` |
| `gen_ai.data_source.id` | Recommended | string | External database/storage identifier | `vector_db_prod` |

**OpenInference Attributes:**
| Attribute | Description |
|-----------|-------------|
| `openinference.span.kind` | Set to `"AGENT"` |
| `agent.name` | Agent identifier |
| `input.value` | Agent input/query |
| `output.value` | Agent final response |

## Span Hierarchy Pattern

Agent spans serve as parents for LLM and TOOL spans, creating a clear trace structure.

```
AGENT (research_assistant)
├── LLM (chat gpt-4) [planning]
├── TOOL (execute_tool web_search)
├── TOOL (execute_tool vector_search)
└── LLM (chat gpt-4) [synthesis]
```

**ReAct Agent Pattern:**
```
AGENT (react_agent)
├── LLM (chat gpt-4) [thought: what tool to use]
├── TOOL (execute_tool calculator)
├── LLM (chat gpt-4) [thought: analyze result]
├── TOOL (execute_tool search)
├── LLM (chat gpt-4) [thought: synthesize]
└── LLM (chat gpt-4) [final answer]
```

## Code Examples

### Decorator Pattern with Phoenix

```python
from phoenix.otel import register

tracer_provider = register(project_name="my-agent-app")
tracer = tracer_provider.get_tracer(__name__)

@tracer.agent
def research_agent(query: str) -> str:
    """
    Multi-step agent that researches a topic using tools and LLM reasoning.
    """
    plan = create_research_plan(query)

    findings = []
    for step in plan.steps:
        if step.requires_search:
            results = web_search(step.query)
            findings.extend(results)
        elif step.requires_analysis:
            analysis = analyze_documents(findings)
            findings.append(analysis)

    return synthesize_findings(query, findings)

response = research_agent("What are the latest developments in AI safety?")
```

### Context Manager with Nested Spans

```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer(__name__)

def run_agent(user_query: str) -> str:
    with tracer.start_as_current_span("research_assistant") as agent_span:
        agent_span.set_attributes({
            "openinference.span.kind": "AGENT",
            "gen_ai.agent.name": "research_assistant",
            "gen_ai.agent.id": "agent-001",
            "input.value": user_query,
        })

        with tracer.start_as_current_span("chat gpt-4") as plan_span:
            plan_span.set_attributes({
                "openinference.span.kind": "LLM",
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "gpt-4",
            })
            plan = llm.create_plan(user_query)

        with tracer.start_as_current_span("execute_tool web_search") as tool_span:
            tool_span.set_attributes({
                "openinference.span.kind": "TOOL",
                "gen_ai.tool.name": "web_search",
            })
            search_results = web_search(plan.search_query)

        with tracer.start_as_current_span("chat gpt-4") as synth_span:
            synth_span.set_attributes({
                "openinference.span.kind": "LLM",
                "gen_ai.operation.name": "chat",
                "gen_ai.request.model": "gpt-4",
            })
            response = llm.synthesize(user_query, search_results)

        agent_span.set_attribute("output.value", response)
        agent_span.set_status(Status(StatusCode.OK))
        return response
```

### OpenInference Manual Implementation

```python
from openinference.semconv.trace import SpanAttributes
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

def agent_router(message: str, context: dict) -> str:
    """Agent with routing logic"""
    with tracer.start_as_current_span("code_based_agent") as span:
        span.set_attribute(SpanAttributes.INPUT_VALUE, message)
        span.set_attribute(SpanAttributes.OPENINFERENCE_SPAN_KIND, "AGENT")
        span.set_attribute("gen_ai.agent.name", "code_based_agent")

        agent_response = router(message, context)

        span.set_attribute(SpanAttributes.OUTPUT_VALUE, agent_response)
        span.set_status(trace.Status(trace.StatusCode.OK))
        return agent_response
```

## Agent Workflow Tracking

Track agent iterations and reasoning steps for debugging.

```python
def run_iterative_agent(query: str, max_iterations: int = 10) -> str:
    with tracer.start_as_current_span("iterative_agent") as agent_span:
        agent_span.set_attributes({
            "openinference.span.kind": "AGENT",
            "gen_ai.agent.name": "iterative_agent",
            "agent.max_iterations": max_iterations,
        })

        iteration = 0
        while iteration < max_iterations:
            iteration += 1

            with tracer.start_as_current_span(f"iteration_{iteration}") as iter_span:
                iter_span.set_attribute("agent.iteration", iteration)

                action = llm.decide_action(query, context)
                if action.type == "finish":
                    agent_span.set_attribute("agent.total_iterations", iteration)
                    agent_span.set_attribute("output.value", action.response)
                    return action.response

                result = execute_action(action)
                context.update(result)

        agent_span.set_attribute("agent.reached_max_iterations", True)
        raise MaxIterationsError(f"Agent did not complete in {max_iterations} iterations")
```

## Related Documentation

- [LLM Spans](llm-spans.md) - Individual inference call instrumentation
- [Tool Spans](tool-spans.md) - Function execution within agents
- [Retriever Spans](retriever-spans.md) - RAG retrieval in agent workflows
