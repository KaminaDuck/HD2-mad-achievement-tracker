---
title: "LLM Observability Introduction"
description: "Introduction to LLM observability concepts, the OpenTelemetry + OpenInference + Phoenix stack, and use cases for AI application tracing"
tags: ["llm", "observability", "opentelemetry", "openinference", "phoenix", "tracing"]
category: observability
subcategory: llm-tracing
type: concept-guide
version: "1.0"
status: stable
sources:
  - name: "OpenTelemetry Documentation"
    url: "https://opentelemetry.io/docs/"
  - name: "OpenInference Specification"
    url: "https://github.com/Arize-ai/openinference"
  - name: "Arize Phoenix Documentation"
    url: "https://docs.arize.com/phoenix"
related:
  - "./quick-start.md"
  - "./architecture.md"
  - "../domains/spans/llm-spans.md"
author: "unknown"
contributors: []
---

# LLM Observability Introduction

This guide explains what LLM observability is, why it matters for AI applications, and how the OpenTelemetry + OpenInference + Phoenix stack provides a comprehensive solution.

## What is LLM Observability?

LLM observability extends traditional application monitoring to AI systems. It provides visibility into:

- **Traces**: End-to-end request journeys through your AI pipeline
- **Spans**: Individual operations (LLM calls, tool executions, retrievals)
- **Metrics**: Token usage, latency measurements, error rates
- **Attributes**: Structured metadata (prompts, responses, model parameters)

Unlike conventional observability, LLM observability captures AI-specific telemetry: the prompts sent, responses received, token counts, and model configurations.

## Why Trace AI Applications?

### Debug Prompt Issues and Hallucinations

When your LLM produces incorrect or unexpected output, traces reveal:

- Exact prompts sent (including system prompts and context)
- Retrieved documents that may have caused confusion
- Tool outputs that influenced the response
- Multi-turn conversation history

This visibility transforms debugging from guesswork to systematic analysis.

### Track Token Costs and Model Performance

LLM APIs charge per token. Observability enables:

- Per-request cost attribution
- Identification of expensive operations
- Comparison of token efficiency across prompts
- Budget monitoring and alerting

### Monitor Latency

AI applications have unique latency concerns:

- **Time-to-first-token (TTFT)**: How quickly does the response start?
- **Total duration**: End-to-end request time
- **Per-span breakdown**: Which operation is the bottleneck?

Trace data identifies whether slowdowns come from model inference, retrieval, or tool execution.

### Evaluate Output Quality

Traces provide the foundation for:

- Storing prompt/response pairs for evaluation
- Running automated quality assessments
- A/B testing different prompts or models
- Building golden datasets for regression testing

## The Technology Stack

### OpenTelemetry (OTel)

OpenTelemetry is the vendor-neutral observability standard. It provides:

- **Instrumentation APIs**: Create spans and record attributes
- **SDK**: Process and export telemetry data
- **Protocol (OTLP)**: Standard wire format for telemetry export
- **Semantic Conventions**: Standardized attribute names

OTel forms the foundation - it handles the "plumbing" of collecting and exporting telemetry.

### OpenInference

OpenInference extends OpenTelemetry with AI/ML-specific semantic conventions. It defines:

- **Span kinds**: LLM, CHAIN, AGENT, TOOL, RETRIEVER, EMBEDDING, RERANKER
- **Attribute schemas**: Standard names for prompts, responses, token counts
- **Message formats**: Structured representation of chat messages

OpenInference bridges the gap between generic observability and AI-specific needs.

### Arize Phoenix

Phoenix is an observability platform that consumes OpenInference traces and provides:

- **Trace visualization**: Waterfall views of AI request flows
- **Search and filtering**: Query traces by attributes
- **Evaluations**: Run LLM-as-judge assessments on traces
- **Experimentation**: Compare prompt variations
- **Local deployment**: Run entirely on your machine

Phoenix acts as both the collector and UI for your AI telemetry.

## When to Use This Skill

This skill applies when you need to:

### Add Tracing to LLM Applications

- **Pydantic AI**: Auto-instrument agents and tool calls
- **LangChain**: Capture chain execution and retrievals
- **Custom applications**: Manual span creation for any LLM integration

### Set Up Phoenix Deployment

- **Local development**: Single Docker container for exploration
- **Team environments**: Persistent storage with PostgreSQL
- **Production**: OTLP collector integration with existing infrastructure

### Understand GenAI Semantic Conventions

- Map your application concepts to standard span kinds
- Record attributes that downstream tools expect
- Ensure traces are compatible with evaluation frameworks

## Key Concepts

| Concept | Description |
|---------|-------------|
| **Trace** | Complete journey of a request through your system |
| **Span** | Single operation within a trace (LLM call, tool use) |
| **TracerProvider** | Factory for creating tracers, manages export configuration |
| **SpanProcessor** | Handles spans before export (batching, filtering) |
| **Exporter** | Sends telemetry to backends (Phoenix, OTLP collectors) |
| **Context Propagation** | Links spans across async operations and services |

## Next Steps

- [Quick Start](./quick-start.md) - Get tracing working in 5 minutes
- [Architecture](./architecture.md) - Understand system design and data flow
- [LLM Spans](../domains/spans/llm-spans.md) - Deep dive into LLM span attributes
