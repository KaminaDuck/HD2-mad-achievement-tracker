---
title: "OpenInference Span Kinds Reference"
description: "Complete reference for OpenInference span kinds including LLM, TOOL, AGENT, RETRIEVER, EMBEDDING, and other span types with attributes, hierarchies, and usage patterns"
tags:
  - openinference
  - span-kinds
  - tracing
  - llm
  - semantic-conventions
  - observability
category: observability
subcategory: tracing
type: reference-table
version: "1.0"
status: stable
sources:
  - name: "OpenInference Semantic Conventions"
    url: "https://github.com/Arize-ai/openinference/blob/main/spec/semantic_conventions.md"
  - name: "Arize Phoenix Documentation"
    url: "https://docs.arize.com/phoenix"
related:
  - "../overview/introduction.md"
  - "cheat-sheet.md"
  - "troubleshooting.md"
author: "AI Engineering Team"
contributors: []
---

# OpenInference Span Kinds Reference

Complete reference for OpenInference span kinds used in LLM application tracing.

---

## Span Kinds Overview

| Span Kind | Primary Use | Typical Position | Auto-Instrumented By |
|-----------|-------------|------------------|----------------------|
| `CHAIN` | Orchestration logic, entry points | Top / Mid | LangChain, custom |
| `LLM` | Language model API calls | Mid / Leaf | OpenAI, Anthropic, Cohere |
| `TOOL` | External function/API calls | Leaf | Framework-dependent |
| `AGENT` | Multi-step reasoning with tools | Top | Pydantic AI, LangChain Agents |
| `RETRIEVER` | Document/data retrieval | Mid | LlamaIndex, LangChain |
| `RERANKER` | Document reranking | Mid | Cohere, custom |
| `EMBEDDING` | Embedding generation | Leaf | OpenAI, Cohere |
| `GUARDRAIL` | Safety/validation checks | Any | Guardrails AI |
| `EVALUATOR` | Quality evaluation | Any | Phoenix Evals |
| `UNKNOWN` | Unclassified operations | Any | N/A |

---

## Detailed Span Kind Specifications

### CHAIN

**Purpose:** Starting point or linking component in LLM application workflows.

**Use Cases:**
- Application entry points receiving user requests
- Orchestration logic connecting multiple LLM operations
- Pipelines combining retrieval, generation, and post-processing

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"CHAIN"` |
| `input.value` | string | Input to the chain |
| `output.value` | string | Output from the chain |
| `input.mime_type` | string | MIME type of input |
| `output.mime_type` | string | MIME type of output |

**Example:**

```python
with tracer.start_as_current_span("rag_pipeline", kind=SpanKind.INTERNAL) as span:
    span.set_attribute("openinference.span.kind", "CHAIN")
    span.set_attribute("input.value", user_query)

    # Child spans for embedding, retrieval, generation
    result = run_rag_pipeline(user_query)

    span.set_attribute("output.value", result)
```

---

### LLM

**Purpose:** Calls to language models for chat completion, text completion, or other inference.

**Use Cases:**
- Chat completions (GPT-4, Claude, etc.)
- Text completions
- Structured output generation
- Function calling

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"LLM"` |
| `gen_ai.system` | string | Provider name (openai, anthropic) |
| `gen_ai.request.model` | string | Requested model ID |
| `gen_ai.response.model` | string | Actual model used |
| `gen_ai.operation.name` | string | Operation type (chat, completion) |
| `gen_ai.request.temperature` | float | Temperature setting |
| `gen_ai.request.max_tokens` | int | Max tokens requested |
| `gen_ai.usage.input_tokens` | int | Prompt token count |
| `gen_ai.usage.output_tokens` | int | Completion token count |
| `llm.input_messages` | json | Input messages array |
| `llm.output_messages` | json | Output messages array |

**Message Format:**

```json
{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"},
    {"role": "assistant", "content": "Hi there!"}
  ]
}
```

**Example:**

```python
with tracer.start_as_current_span("chat gpt-4o", kind=SpanKind.CLIENT) as span:
    span.set_attributes({
        "openinference.span.kind": "LLM",
        "gen_ai.system": "openai",
        "gen_ai.operation.name": "chat",
        "gen_ai.request.model": "gpt-4o",
        "gen_ai.request.temperature": 0.7,
        "llm.input_messages": json.dumps(messages),
    })

    response = client.chat.completions.create(model="gpt-4o", messages=messages)

    span.set_attributes({
        "gen_ai.response.model": response.model,
        "gen_ai.usage.input_tokens": response.usage.prompt_tokens,
        "gen_ai.usage.output_tokens": response.usage.completion_tokens,
        "llm.output_messages": json.dumps([{
            "role": "assistant",
            "content": response.choices[0].message.content
        }]),
    })
```

---

### TOOL

**Purpose:** Execution of external functions, APIs, or tools invoked by an LLM.

**Use Cases:**
- Function calling (OpenAI functions, Anthropic tools)
- Calculator operations
- Database queries
- External API calls
- File operations

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"TOOL"` |
| `tool.name` | string | Tool/function name |
| `tool.description` | string | Tool description |
| `tool.parameters` | json | Input parameters |
| `tool.result` | json/string | Tool execution result |

**Example:**

```python
with tracer.start_as_current_span(f"tool:{tool_name}", kind=SpanKind.INTERNAL) as span:
    span.set_attributes({
        "openinference.span.kind": "TOOL",
        "tool.name": tool_name,
        "tool.description": tool_schema.get("description", ""),
        "tool.parameters": json.dumps(tool_args),
    })

    result = execute_tool(tool_name, tool_args)

    span.set_attribute("tool.result", json.dumps(result))
```

---

### AGENT

**Purpose:** High-level span encompassing multi-step reasoning with LLM and tool calls.

**Use Cases:**
- ReAct agents (Reason + Act)
- Autonomous agents with planning
- Multi-step task execution
- Conversational agents with tools

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"AGENT"` |
| `agent.name` | string | Agent identifier |
| `agent.description` | string | Agent purpose |
| `input.value` | string | User input/task |
| `output.value` | string | Final agent output |

**Typical Child Spans:**
- Multiple `LLM` spans for reasoning steps
- Multiple `TOOL` spans for action execution
- Optional `RETRIEVER` spans for knowledge lookup

**Example:**

```python
with tracer.start_as_current_span("research_agent", kind=SpanKind.INTERNAL) as span:
    span.set_attributes({
        "openinference.span.kind": "AGENT",
        "agent.name": "research_agent",
        "agent.description": "Researches topics using web search and summarization",
        "input.value": user_query,
    })

    # Agent execution creates child LLM and TOOL spans automatically
    result = agent.run(user_query)

    span.set_attribute("output.value", result.output)
```

---

### RETRIEVER

**Purpose:** Data retrieval operations from vector stores, databases, or search engines.

**Use Cases:**
- Vector similarity search
- Keyword search
- Hybrid search
- Document retrieval for RAG

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"RETRIEVER"` |
| `retrieval.query` | string | Search query |
| `retrieval.top_k` | int | Number of documents requested |
| `retrieval.documents.{i}.id` | string | Document ID |
| `retrieval.documents.{i}.content` | string | Document content |
| `retrieval.documents.{i}.score` | float | Relevance score |
| `retrieval.documents.{i}.metadata` | json | Document metadata |

**Example:**

```python
with tracer.start_as_current_span("vector_search", kind=SpanKind.INTERNAL) as span:
    span.set_attributes({
        "openinference.span.kind": "RETRIEVER",
        "retrieval.query": query,
        "retrieval.top_k": k,
    })

    documents = vector_store.similarity_search(query, k=k)

    for i, doc in enumerate(documents):
        span.set_attributes({
            f"retrieval.documents.{i}.id": doc.id,
            f"retrieval.documents.{i}.content": doc.content[:1000],
            f"retrieval.documents.{i}.score": doc.score,
        })
```

---

### RERANKER

**Purpose:** Reranking retrieved documents for improved relevance.

**Use Cases:**
- Cross-encoder reranking
- LLM-based reranking
- Hybrid score fusion
- Top-K selection refinement

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"RERANKER"` |
| `reranker.model_name` | string | Reranking model |
| `reranker.query` | string | Query for reranking |
| `reranker.top_k` | int | Output document count |
| `reranker.input_documents` | json | Documents before reranking |
| `reranker.output_documents` | json | Documents after reranking |

**Example:**

```python
with tracer.start_as_current_span("rerank", kind=SpanKind.INTERNAL) as span:
    span.set_attributes({
        "openinference.span.kind": "RERANKER",
        "reranker.model_name": "cohere-rerank-v3",
        "reranker.query": query,
        "reranker.top_k": 3,
    })

    reranked = reranker.rerank(query, documents, top_n=3)

    span.set_attribute("reranker.output_documents", json.dumps([
        {"id": d.id, "score": d.relevance_score} for d in reranked
    ]))
```

---

### EMBEDDING

**Purpose:** Generation of vector embeddings for text or other data.

**Use Cases:**
- Query embedding for retrieval
- Document embedding for indexing
- Semantic similarity computation

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"EMBEDDING"` |
| `embedding.model_name` | string | Embedding model |
| `embedding.text` | string | Input text |
| `embedding.embeddings` | json | Output vectors (optional) |
| `gen_ai.usage.total_tokens` | int | Token count |

**Example:**

```python
with tracer.start_as_current_span("embed_query", kind=SpanKind.CLIENT) as span:
    span.set_attributes({
        "openinference.span.kind": "EMBEDDING",
        "embedding.model_name": "text-embedding-3-small",
        "embedding.text": text[:500],  # Truncate for logging
    })

    response = client.embeddings.create(model="text-embedding-3-small", input=text)

    span.set_attribute("gen_ai.usage.total_tokens", response.usage.total_tokens)
```

---

### GUARDRAIL

**Purpose:** Safety checks, content filtering, and validation operations.

**Use Cases:**
- Input validation and sanitization
- PII detection and redaction
- Toxicity filtering
- Output validation
- Schema validation

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"GUARDRAIL"` |
| `guardrail.name` | string | Guardrail identifier |
| `guardrail.type` | string | Check type (input/output) |
| `guardrail.passed` | bool | Whether check passed |
| `guardrail.details` | json | Violation details if failed |

**Example:**

```python
with tracer.start_as_current_span("content_filter", kind=SpanKind.INTERNAL) as span:
    span.set_attributes({
        "openinference.span.kind": "GUARDRAIL",
        "guardrail.name": "toxicity_filter",
        "guardrail.type": "output",
    })

    result = toxicity_check(content)

    span.set_attributes({
        "guardrail.passed": result.passed,
        "guardrail.details": json.dumps(result.scores) if not result.passed else None,
    })
```

---

### EVALUATOR

**Purpose:** Quality evaluation of LLM outputs, often using LLM-as-judge patterns.

**Use Cases:**
- Hallucination detection
- Relevance scoring
- Faithfulness evaluation
- Answer correctness
- Custom quality metrics

**Key Attributes:**

| Attribute | Type | Description |
|-----------|------|-------------|
| `openinference.span.kind` | string | `"EVALUATOR"` |
| `eval.name` | string | Evaluation metric name |
| `eval.score` | float | Numeric score |
| `eval.label` | string | Categorical label |
| `eval.explanation` | string | Reasoning for score |

---

## Common Span Hierarchies

### RAG Pipeline

```
CHAIN (rag_pipeline)
├── EMBEDDING (query_embedding)
├── RETRIEVER (vector_search)
│   └── (indexed documents with scores)
├── RERANKER (rerank_top_k) [optional]
└── LLM (generate_answer)
    └── (input: query + context, output: answer)
```

### Agent with Tools

```
AGENT (research_agent)
├── LLM (reasoning_step_1)
│   └── (decides to search)
├── TOOL (web_search)
│   └── (returns search results)
├── LLM (reasoning_step_2)
│   └── (decides to calculate)
├── TOOL (calculator)
│   └── (returns calculation)
└── LLM (final_answer)
    └── (synthesizes final response)
```

### Guarded LLM Pipeline

```
CHAIN (safe_llm_pipeline)
├── GUARDRAIL (input_validation)
│   └── (PII detection, prompt injection check)
├── LLM (generate_response)
│   └── (main generation)
├── GUARDRAIL (output_filtering)
│   └── (toxicity check, format validation)
└── EVALUATOR (quality_check) [optional]
    └── (hallucination score)
```

### Multi-Agent Collaboration

```
CHAIN (multi_agent_task)
├── AGENT (planner_agent)
│   ├── LLM (create_plan)
│   └── (outputs task breakdown)
├── AGENT (researcher_agent)
│   ├── LLM (research_step)
│   ├── TOOL (web_search)
│   └── LLM (summarize)
├── AGENT (writer_agent)
│   ├── RETRIEVER (get_context)
│   └── LLM (write_content)
└── AGENT (reviewer_agent)
    ├── LLM (review)
    └── EVALUATOR (quality_score)
```

### Embedding Pipeline

```
CHAIN (document_indexing)
├── CHAIN (chunking)
│   └── (split documents)
└── EMBEDDING (batch_embed)
    └── (embed all chunks)
```

---

## Span Kind Selection Guide

| Scenario | Recommended Kind |
|----------|------------------|
| Calling OpenAI/Anthropic API | `LLM` |
| Executing a tool/function | `TOOL` |
| Vector similarity search | `RETRIEVER` |
| Generating embeddings | `EMBEDDING` |
| Multi-step agent loop | `AGENT` (parent) + `LLM`/`TOOL` (children) |
| Input/output validation | `GUARDRAIL` |
| Quality scoring | `EVALUATOR` |
| General orchestration | `CHAIN` |
| Document reranking | `RERANKER` |

---

## Related

- [Cheat Sheet](cheat-sheet.md)
- [Troubleshooting Guide](troubleshooting.md)
- [Concepts Overview](../overview/introduction.md)
