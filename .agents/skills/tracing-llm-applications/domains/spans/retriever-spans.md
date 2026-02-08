---
title: "Retriever Span Instrumentation"
description: "Trace RAG retrieval operations including vector search and document retrieval"
tags:
  - opentelemetry
  - retriever
  - rag
  - vector-search
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
  - "embedding-spans.md"
  - "agent-spans.md"
  - "../conventions/genai-attributes.md"
sources:
  - name: OpenInference Semantic Conventions
    url: https://arize-ai.github.io/openinference/spec/semantic_conventions.html
  - name: Phoenix Tracing Documentation
    url: https://arize.com/docs/phoenix/tracing
---

# Retriever Span Instrumentation

Retriever spans capture data retrieval operations, typically from vector stores, databases, or document stores in RAG (Retrieval-Augmented Generation) pipelines.

## Span Identification

| Property | Value |
|----------|-------|
| OpenInference Span Kind | `RETRIEVER` |
| OTel Span Kind | `INTERNAL` |
| Typical Position | Mid-level in RAG pipelines |

## Use Cases

- Vector similarity search
- Database queries for context
- Document retrieval from knowledge bases
- RAG retrieval step before LLM generation

## Retriever Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `openinference.span.kind` | string | Span classification | `"RETRIEVER"` |
| `input.value` | string | Query used for retrieval | `"postal service regulations"` |

### Document Attributes

Retrieved documents use indexed attributes:

| Attribute | Type | Description |
|-----------|------|-------------|
| `retrieval.documents.N.document.id` | string | Document identifier |
| `retrieval.documents.N.document.content` | string | Document text content |
| `retrieval.documents.N.document.score` | float | Relevance/similarity score |
| `retrieval.documents.N.document.metadata` | JSON string | Document metadata |

Where `N` is the zero-based document index (0, 1, 2, ...).

## Reranker Spans

For document reranking operations using cross-encoders.

| Property | Value |
|----------|-------|
| OpenInference Span Kind | `RERANKER` |
| Purpose | Reorder retrieved documents by relevance |

**Reranker Attributes:**
| Attribute | Description |
|-----------|-------------|
| `reranker.model_name` | Reranker model identifier |
| `reranker.query` | Query used for reranking |
| `reranker.input_documents` | Documents before reranking |
| `reranker.output_documents` | Documents after reranking |
| `reranker.top_k` | Number of documents returned |

## RAG Pipeline Pattern

```
CHAIN (rag_pipeline)
├── EMBEDDING (query_embedding)
├── RETRIEVER (vector_search)
├── RERANKER (rerank_top_k)
└── LLM (generate_answer)
```

## Code Examples

### Manual Retriever Span with Document Attributes

```python
import json
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer(__name__)

def retrieve_documents(query: str, k: int = 5) -> list:
    with tracer.start_as_current_span("vector_search") as span:
        span.set_attributes({
            "openinference.span.kind": "RETRIEVER",
            "input.value": query,
        })

        results = vector_store.similarity_search(query, k=k)

        for idx, doc in enumerate(results):
            prefix = f"retrieval.documents.{idx}.document"
            span.set_attribute(f"{prefix}.id", doc.id)
            span.set_attribute(f"{prefix}.content", doc.text)
            span.set_attribute(f"{prefix}.score", doc.score)
            span.set_attribute(
                f"{prefix}.metadata",
                json.dumps(doc.metadata)
            )

        span.set_status(Status(StatusCode.OK))
        return results
```

### Auto-Instrumented with LlamaIndex

```python
from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
from phoenix.otel import register
from llama_index.core import VectorStoreIndex, SimpleDirectoryReader

tracer_provider = register(project_name="rag-app")
LlamaIndexInstrumentor().instrument(tracer_provider=tracer_provider)

documents = SimpleDirectoryReader("./data").load_data()
index = VectorStoreIndex.from_documents(documents)
query_engine = index.as_query_engine()

response = query_engine.query("What is RAG?")
```

### Reranker Span Implementation

```python
def rerank_documents(query: str, documents: list, top_k: int = 5) -> list:
    with tracer.start_as_current_span("rerank_documents") as span:
        span.set_attributes({
            "openinference.span.kind": "RERANKER",
            "reranker.query": query,
            "reranker.model_name": "cross-encoder/ms-marco-MiniLM-L-6-v2",
            "reranker.top_k": top_k,
        })

        reranked = cross_encoder.rerank(
            query=query,
            documents=documents,
            top_k=top_k
        )

        span.set_status(Status(StatusCode.OK))
        return reranked
```

### Complete RAG Pipeline

```python
@tracer.chain
def rag_pipeline(query: str) -> str:
    """Full RAG pipeline with retrieval and reranking."""

    with tracer.start_as_current_span("embed_query") as embed_span:
        embed_span.set_attribute("openinference.span.kind", "EMBEDDING")
        query_embedding = embeddings.embed_query(query)

    with tracer.start_as_current_span("vector_search") as retrieve_span:
        retrieve_span.set_attribute("openinference.span.kind", "RETRIEVER")
        retrieve_span.set_attribute("input.value", query)
        documents = vector_store.similarity_search_by_vector(
            query_embedding, k=20
        )
        for idx, doc in enumerate(documents[:5]):
            retrieve_span.set_attribute(
                f"retrieval.documents.{idx}.document.score",
                doc.score
            )

    with tracer.start_as_current_span("rerank") as rerank_span:
        rerank_span.set_attribute("openinference.span.kind", "RERANKER")
        rerank_span.set_attribute("reranker.top_k", 5)
        top_docs = reranker.rerank(query, documents, top_k=5)

    with tracer.start_as_current_span("chat gpt-4") as llm_span:
        llm_span.set_attributes({
            "openinference.span.kind": "LLM",
            "gen_ai.operation.name": "chat",
            "gen_ai.request.model": "gpt-4",
        })
        context = "\n\n".join([doc.content for doc in top_docs])
        response = llm.invoke(
            f"Context:\n{context}\n\nQuestion: {query}\n\nAnswer:"
        )

    return response
```

## Example Span Data

```json
{
    "name": "retrieve",
    "attributes": {
        "openinference.span.kind": "RETRIEVER",
        "input.value": "tell me about postal service",
        "retrieval.documents.0.document.id": "6d4e27be-1d6d-4084-a619-351a44834f38",
        "retrieval.documents.0.document.score": 0.7711453293100421,
        "retrieval.documents.0.document.content": "<document-chunk-1>",
        "retrieval.documents.0.document.metadata": "{\"page_label\": \"7\", \"file_name\": \"101.pdf\"}",
        "retrieval.documents.1.document.id": "a2b3c4d5-e6f7-8901-2345-678901234567",
        "retrieval.documents.1.document.score": 0.6892341234567890,
        "retrieval.documents.1.document.content": "<document-chunk-2>"
    }
}
```

## Related Documentation

- [Embedding Spans](embedding-spans.md) - Query and document embedding
- [LLM Spans](llm-spans.md) - Generation after retrieval
- [Agent Spans](agent-spans.md) - RAG within agent workflows
