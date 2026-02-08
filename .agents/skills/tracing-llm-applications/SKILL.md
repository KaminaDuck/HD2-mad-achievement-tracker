---
name: tracing-llm-applications
description: Comprehensive guide for instrumenting and observing LLM applications with OpenTelemetry and Arize Phoenix. Covers GenAI semantic conventions, span kinds for AI operations (LLM, AGENT, TOOL, RETRIEVER, EMBEDDING), production deployment, and evaluation integration. Use when adding observability to AI/LLM systems, setting up Phoenix tracing, implementing OpenInference spans, or debugging agent workflows.
allowed-tools: Read, Grep, Glob, WebFetch, Bash
---

# Tracing LLM Applications

Comprehensive skill for instrumenting and observing LLM applications using OpenTelemetry, OpenInference semantic conventions, and Arize Phoenix.

## Quick Navigation

| Need | Go To |
|------|-------|
| Getting started | [overview/quick-start.md](overview/quick-start.md) |
| Span kinds reference | [reference/span-kinds-table.md](reference/span-kinds-table.md) |
| GenAI attributes | [domains/conventions/genai-attributes.md](domains/conventions/genai-attributes.md) |
| Production deployment | [deployment/phoenix-docker.md](deployment/phoenix-docker.md) |
| Troubleshooting | [reference/troubleshooting.md](reference/troubleshooting.md) |

## Skill Structure

```
tracing-llm-applications/
├── overview/              # Tier 1: Getting started
│   ├── introduction       # What is LLM observability
│   ├── quick-start        # 5-minute setup
│   └── architecture       # Component relationships
├── domains/               # Tier 2: Core concepts
│   ├── spans/             # Span kind guides
│   │   ├── llm-spans      # LLM inference calls
│   │   ├── agent-spans    # Multi-step agent workflows
│   │   ├── tool-spans     # Tool/function execution
│   │   ├── retriever-spans # RAG retrieval operations
│   │   └── embedding-spans # Vector embedding generation
│   ├── conventions/       # OpenInference & GenAI semantics
│   │   ├── genai-attributes  # Attribute reference
│   │   └── content-handling  # Prompts, PII, privacy
│   └── frameworks/        # Framework integration
│       ├── pydantic-ai    # Pydantic AI auto-instrumentation
│       └── tanstack-ai    # TanStack AI manual instrumentation
├── deployment/            # Tier 3: Production setup
│   ├── phoenix-docker     # Self-hosted Phoenix
│   ├── collector-patterns # OTel Collector configurations
│   └── security-auth      # Authentication and TLS
├── reference/             # Quick lookup
│   ├── span-kinds-table   # OpenInference span kinds
│   ├── cheat-sheet        # Common patterns quick reference
│   └── troubleshooting    # Common issues & fixes
└── internals/             # Deep knowledge
    ├── otel-sdk-config    # SDK configuration options
    ├── sampling-strategies # Sampling configuration
    └── performance-tuning # Optimization techniques
```

## Key Concepts

### OpenTelemetry vs OpenInference vs Arize Phoenix

| Component | Role | Scope |
|-----------|------|-------|
| **OpenTelemetry** | Industry-standard observability framework | General tracing, metrics, logs |
| **OpenInference** | Semantic conventions for AI/ML | LLM-specific span attributes |
| **Arize Phoenix** | Trace collector and visualization UI | LLM debugging, evaluation |

**Relationship:**
- OpenTelemetry provides the transport layer (OTLP protocol)
- OpenInference defines what LLM traces should contain
- Phoenix consumes OpenInference-formatted spans and provides visualization

### Span Kinds for LLM Applications

OpenInference defines 6 span kinds for AI operations:

| Span Kind | Purpose | Example |
|-----------|---------|---------|
| `LLM` | Language model inference | `openai.chat.completions` |
| `AGENT` | Autonomous agent execution | `pydantic_ai.agent.run` |
| `TOOL` | Tool/function execution | `search_database()` |
| `RETRIEVER` | RAG document retrieval | `vector_store.query()` |
| `EMBEDDING` | Embedding generation | `openai.embeddings.create` |
| `CHAIN` | Multi-step workflow | `langchain.chain.invoke` |

Span kinds enable filtering, aggregation, and specialized visualization in Phoenix.

## User Journeys

### New User: Add Observability to an LLM App

1. [Introduction](overview/introduction.md) - Understand why LLM tracing matters
2. [Quick Start](overview/quick-start.md) - Get traces flowing in 5 minutes
3. [Span Kinds](reference/span-kinds-table.md) - Learn what spans represent

### Migrator: Adopt OpenTelemetry Standards

1. [Architecture](overview/architecture.md) - Understand OTel + OpenInference
2. [GenAI Attributes](domains/conventions/genai-attributes.md) - Map existing telemetry
3. [LLM Spans](domains/spans/llm-spans.md) - Manual span creation patterns

### Power User: Production-Grade Observability

1. [Phoenix Docker](deployment/phoenix-docker.md) - Self-hosted deployment
2. [Sampling Strategies](internals/sampling-strategies.md) - Control trace volume
3. [Performance Tuning](internals/performance-tuning.md) - Optimize overhead

## Hello World: Basic Instrumentation

```python
from phoenix.otel import register
from pydantic_ai import Agent

# Register with Phoenix (starts OTLP exporter)
tracer_provider = register(project_name="my-app")

# Enable auto-instrumentation for all agents
Agent.instrument_all()

# Use agent normally - traces appear automatically
agent = Agent('openai:gpt-4')
result = agent.run_sync('Hello, world!')

# View traces at http://localhost:6006
```

**What this produces:**
- `AGENT` span for `pydantic_ai.agent.run`
- `LLM` span for `openai.chat.completions` (child of agent)
- Token counts, latency, model info as span attributes

## Framework Auto-Instrumentation

| Framework | Instrumentation Package |
|-----------|------------------------|
| OpenAI | `openinference-instrumentation-openai` |
| Anthropic | `openinference-instrumentation-anthropic` |
| Pydantic AI | Built-in via `Agent.instrument_all()` |
| LangChain | `openinference-instrumentation-langchain` |
| LlamaIndex | `openinference-instrumentation-llama-index` |

See [Pydantic AI](domains/frameworks/pydantic-ai.md) or [TanStack AI](domains/frameworks/tanstack-ai.md) for framework-specific setup.

## Related Resources

### OpenTelemetry
- [OpenTelemetry Python Docs](https://opentelemetry.io/docs/languages/python/)
- [OTLP Specification](https://opentelemetry.io/docs/specs/otlp/)
- [Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/)

### OpenInference
- [OpenInference Spec](https://github.com/Arize-ai/openinference/tree/main/spec)
- [GenAI Semantic Conventions](https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md)

### Arize Phoenix
- [Phoenix Documentation](https://docs.arize.com/phoenix/)
- [Phoenix GitHub](https://github.com/Arize-ai/phoenix)
- [Phoenix Quickstart](https://docs.arize.com/phoenix/quickstart)

---

*This skill provides practical guidance for LLM observability. For general OpenTelemetry concepts, see the OpenTelemetry official documentation.*
