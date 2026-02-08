---
title: "Embedding Span Instrumentation"
description: "Instrument embedding generation operations for vector representations"
tags:
  - opentelemetry
  - embeddings
  - vectors
  - spans
  - tracing
  - genai
category: observability
subcategory: tracing
type: span-guide
version: "1.0"
status: stable
related:
  - "retriever-spans.md"
  - "llm-spans.md"
  - "../conventions/genai-attributes.md"
sources:
  - name: OpenTelemetry GenAI Span Conventions
    url: https://opentelemetry.io/docs/specs/semconv/gen-ai/gen-ai-spans/
  - name: OpenInference Semantic Conventions
    url: https://arize-ai.github.io/openinference/spec/semantic_conventions.html
---

# Embedding Span Instrumentation

Embedding spans capture operations that generate vector representations from text, used for semantic search, similarity matching, and RAG pipelines.

## Span Identification

| Property | Value |
|----------|-------|
| OpenInference Span Kind | `EMBEDDING` |
| OTel GenAI Operation | `embeddings` |
| Span Naming | `embeddings {gen_ai.request.model}` |
| OTel Span Kind | `CLIENT` |

**Examples:**
- `embeddings text-embedding-3-large`
- `embeddings text-embedding-ada-002`
- `embeddings cohere-embed-v3`

## Embedding Attributes

| Attribute | Requirement | Type | Description | Example |
|-----------|-------------|------|-------------|---------|
| `gen_ai.operation.name` | Required | string | Always `embeddings` | `embeddings` |
| `gen_ai.provider.name` | Required | string | Provider identifier | `openai`, `cohere`, `vertex_ai` |
| `gen_ai.request.model` | Conditionally Required | string | Embedding model name | `text-embedding-3-large` |
| `gen_ai.embeddings.dimension.count` | Recommended | int | Output vector dimensionality | `512`, `1024`, `1536`, `3072` |
| `gen_ai.request.encoding_formats` | Recommended | string[] | Requested output formats | `["float"]`, `["base64"]` |
| `gen_ai.usage.input_tokens` | Recommended | int | Tokens in input text | `42` |

**OpenInference Attributes:**
| Attribute | Description |
|-----------|-------------|
| `openinference.span.kind` | Set to `"EMBEDDING"` |
| `embedding.model_name` | Embedding model identifier |
| `embedding.text` | Input text for embedding |
| `embedding.embeddings` | Array of generated embeddings |

## Common Embedding Models

| Provider | Model | Dimensions |
|----------|-------|------------|
| OpenAI | `text-embedding-3-large` | 3072 (default), 256-3072 |
| OpenAI | `text-embedding-3-small` | 1536 (default), 256-1536 |
| OpenAI | `text-embedding-ada-002` | 1536 |
| Cohere | `embed-english-v3.0` | 1024 |
| Google | `textembedding-gecko` | 768 |
| Voyage | `voyage-large-2` | 1536 |

## Code Examples

### Auto-Instrumented with OpenAI

```python
from phoenix.otel import register
import openai

tracer_provider = register(
    project_name="embedding-app",
    auto_instrument=True
)

client = openai.OpenAI()

response = client.embeddings.create(
    model="text-embedding-3-large",
    input="OpenTelemetry provides observability for AI systems",
    dimensions=1024
)

embedding = response.data[0].embedding
```

### Manual Span Creation

```python
from opentelemetry import trace
from opentelemetry.trace import SpanKind, Status, StatusCode

tracer = trace.get_tracer(__name__)

def generate_embedding(text: str, model: str = "text-embedding-3-large") -> list:
    with tracer.start_as_current_span(
        f"embeddings {model}",
        kind=SpanKind.CLIENT
    ) as span:
        span.set_attributes({
            "gen_ai.operation.name": "embeddings",
            "gen_ai.provider.name": "openai",
            "gen_ai.request.model": model,
            "gen_ai.embeddings.dimension.count": 1536,
        })

        try:
            response = client.embeddings.create(
                model=model,
                input=text
            )

            span.set_attribute(
                "gen_ai.usage.input_tokens",
                response.usage.prompt_tokens
            )

            span.set_status(Status(StatusCode.OK))
            return response.data[0].embedding

        except Exception as e:
            span.set_status(Status(StatusCode.ERROR))
            span.record_exception(e)
            raise
```

### Batch Embedding with Phoenix

```python
from phoenix.otel import register

tracer_provider = register(project_name="batch-embed")
tracer = tracer_provider.get_tracer(__name__)

def embed_documents(documents: list[str]) -> list[list[float]]:
    with tracer.start_as_current_span("embeddings text-embedding-3-small") as span:
        span.set_attributes({
            "openinference.span.kind": "EMBEDDING",
            "gen_ai.operation.name": "embeddings",
            "gen_ai.provider.name": "openai",
            "gen_ai.request.model": "text-embedding-3-small",
            "embedding.batch_size": len(documents),
        })

        response = client.embeddings.create(
            model="text-embedding-3-small",
            input=documents
        )

        span.set_attribute(
            "gen_ai.usage.input_tokens",
            response.usage.total_tokens
        )

        return [item.embedding for item in response.data]
```

### Embedding in RAG Pipeline

```python
@tracer.chain
def rag_query(query: str) -> str:
    """RAG pipeline with explicit embedding span."""

    with tracer.start_as_current_span("embeddings text-embedding-3-large") as span:
        span.set_attributes({
            "openinference.span.kind": "EMBEDDING",
            "gen_ai.operation.name": "embeddings",
            "gen_ai.request.model": "text-embedding-3-large",
        })
        query_vector = embeddings.embed_query(query)
        span.set_attribute("gen_ai.embeddings.dimension.count", len(query_vector))

    results = vector_store.similarity_search_by_vector(query_vector, k=5)

    context = "\n".join([doc.content for doc in results])
    response = llm.invoke(f"Context: {context}\n\nQuestion: {query}")

    return response
```

## Use Cases

- **Query Embedding**: Convert user queries to vectors for similarity search
- **Document Indexing**: Generate embeddings for documents during ingestion
- **Semantic Caching**: Create cache keys based on semantic similarity
- **Clustering**: Group similar content using embedding vectors
- **Classification**: Use embeddings as features for downstream classification

## Related Documentation

- [Retriever Spans](retriever-spans.md) - Vector search using embeddings
- [LLM Spans](llm-spans.md) - Generation after retrieval
