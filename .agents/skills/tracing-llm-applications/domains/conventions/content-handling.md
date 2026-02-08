---
title: "GenAI Content Handling - Prompts, Completions, and PII"
description: "Strategies for handling LLM prompts and completions in telemetry, including PII protection patterns and content storage approaches"
tags: ["opentelemetry", "genai", "content", "pii", "privacy", "prompts", "completions"]
category: observability
subcategory: llm-tracing
type: pattern-guide
version: "1.0"
status: stable
sources:
  - name: "OpenTelemetry GenAI Semantic Conventions"
    url: "https://opentelemetry.io/docs/specs/semconv/gen-ai/"
related:
  - "genai-attributes.md"
  - "../spans/llm-spans.md"
---

# GenAI Content Handling - Prompts, Completions, and PII

This guide covers strategies for capturing, storing, and protecting LLM input/output content in observability systems.

## Content Capture Overview

GenAI semantic conventions define optional attributes for content:

| Attribute | Type | Description |
|-----------|------|-------------|
| `gen_ai.input.messages` | JSON string | Input messages array |
| `gen_ai.output.messages` | JSON string | Output messages/completions |
| `gen_ai.system` | string | System prompt content |

**Important:** These attributes are opt-in. By default, instrumentation should NOT capture content.

## Content Capture Strategies

### Strategy 1: No Capture (Default, Recommended)

Omit `gen_ai.input.messages` and `gen_ai.output.messages` entirely.

```python
with tracer.start_as_current_span("chat openai") as span:
    span.set_attribute("gen_ai.operation.name", "chat")
    span.set_attribute("gen_ai.provider.name", "openai")
    span.set_attribute("gen_ai.request.model", "gpt-4")

    response = client.chat.completions.create(messages=messages, model="gpt-4")

    span.set_attribute("gen_ai.usage.input_tokens", response.usage.prompt_tokens)
    span.set_attribute("gen_ai.usage.output_tokens", response.usage.completion_tokens)
```

**Advantages:**
- No PII exposure risk
- Minimal storage costs
- Fast processing and export
- GDPR/CCPA compliant by default

**Disadvantages:**
- Cannot debug prompt-related issues
- Cannot reproduce problematic interactions
- Limited root cause analysis

**Use When:**
- Privacy regulations prohibit content storage
- Cost minimization is critical
- Production environments with sensitive data

### Strategy 2: Direct Attribute Storage (Opt-In)

Store content directly in span attributes when explicitly enabled.

```python
import json

CAPTURE_CONTENT = os.getenv("OTEL_GENAI_CAPTURE_CONTENT", "false").lower() == "true"

with tracer.start_as_current_span("chat openai") as span:
    span.set_attribute("gen_ai.operation.name", "chat")
    span.set_attribute("gen_ai.provider.name", "openai")
    span.set_attribute("gen_ai.request.model", "gpt-4")

    if CAPTURE_CONTENT:
        span.set_attribute("gen_ai.input.messages", json.dumps([
            {"role": "user", "content": "What is the capital of France?"}
        ]))

    response = client.chat.completions.create(messages=messages, model="gpt-4")

    if CAPTURE_CONTENT:
        span.set_attribute("gen_ai.output.messages", json.dumps([
            {"role": "assistant", "content": response.choices[0].message.content}
        ]))
```

**Advantages:**
- Immediate content access in traces
- Simple implementation
- Full debugging capability

**Disadvantages:**
- High storage costs for long conversations
- PII stored in observability backend
- May violate compliance requirements

**Use When:**
- Development and staging environments
- Short, non-sensitive interactions
- Explicit user consent obtained

### Strategy 3: External Storage with References (Production)

Store content in external systems with reference IDs in telemetry.

```python
import hashlib
import json
from datetime import datetime

def store_content(content_data, retention_days=30):
    """Store content in external system, return reference ID."""
    content_id = hashlib.sha256(
        json.dumps(content_data).encode() + str(datetime.utcnow()).encode()
    ).hexdigest()[:16]

    storage_client.put(
        key=f"genai-content/{content_id}",
        value=json.dumps(content_data),
        ttl_days=retention_days
    )

    return content_id

with tracer.start_as_current_span("chat openai") as span:
    span.set_attribute("gen_ai.operation.name", "chat")
    span.set_attribute("gen_ai.provider.name", "openai")

    response = client.chat.completions.create(messages=messages, model="gpt-4")

    content_id = store_content({
        "input": messages,
        "output": [{"role": "assistant", "content": response.choices[0].message.content}],
        "timestamp": datetime.utcnow().isoformat()
    })

    span.set_attribute("gen_ai.content.reference.id", content_id)
    span.set_attribute("gen_ai.content.reference.url", f"s3://genai-content/{content_id}")
```

**Advantages:**
- Scalable for long conversations
- Separate retention policies
- Encryption at rest
- Access controls per content store

**Disadvantages:**
- Additional infrastructure required
- Retrieval latency for debugging
- Two systems to maintain

**Use When:**
- Production environments
- Long conversations or documents
- Compliance requirements mandate separate storage

## PII Protection Patterns

### Content Filtering

Remove or mask sensitive patterns before storage.

```python
import re

def sanitize_content(messages):
    """Remove PII patterns from message content."""
    sanitized = []
    for msg in messages:
        content = msg.get("content", "")

        content = re.sub(
            r'\b[\w.-]+@[\w.-]+\.\w{2,}\b',
            '[EMAIL]',
            content
        )

        content = re.sub(
            r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b',
            '[PHONE]',
            content
        )

        content = re.sub(
            r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b',
            '[SSN]',
            content
        )

        content = re.sub(
            r'\b\d{13,19}\b',
            '[CARD]',
            content
        )

        sanitized.append({**msg, "content": content})

    return sanitized

if CAPTURE_CONTENT:
    sanitized_messages = sanitize_content(messages)
    span.set_attribute("gen_ai.input.messages", json.dumps(sanitized_messages))
```

### Hashing Identifiers

Hash user identifiers for correlation without exposing identity.

```python
import hashlib

def hash_identifier(identifier, salt=""):
    """Create one-way hash of identifier."""
    return hashlib.sha256(
        (str(identifier) + salt).encode()
    ).hexdigest()

user_id_hash = hash_identifier(user_id, salt=os.getenv("PII_HASH_SALT", ""))
span.set_attribute("user.id.hash", user_id_hash)
```

### Content Truncation

Limit content length to reduce storage and exposure.

```python
def truncate_messages(messages, max_chars=500):
    """Truncate long message content."""
    truncated = []
    for msg in messages:
        content = msg.get("content", "")
        if len(content) > max_chars:
            content = content[:max_chars] + "... [truncated]"
        truncated.append({**msg, "content": content})
    return truncated

if CAPTURE_CONTENT:
    truncated_messages = truncate_messages(messages, max_chars=500)
    span.set_attribute("gen_ai.input.messages", json.dumps(truncated_messages))
```

### Consent-Based Capture

Only capture content when user has explicitly opted in.

```python
def should_capture_content(user_context):
    """Check if content capture is allowed for this user."""
    if not os.getenv("OTEL_GENAI_CAPTURE_CONTENT_ENABLED", "false").lower() == "true":
        return False

    if hasattr(user_context, "telemetry_consent"):
        return user_context.telemetry_consent

    return False

if should_capture_content(user):
    span.set_attribute("gen_ai.input.messages", json.dumps(messages))
    span.set_attribute("gen_ai.content.consent", True)
```

## Combined Protection Example

Production-ready content handling with multiple protections.

```python
import json
import re
import hashlib
import os
from opentelemetry import trace

tracer = trace.get_tracer("genai.tracer")

class ContentHandler:
    def __init__(self):
        self.capture_enabled = os.getenv("OTEL_GENAI_CAPTURE_CONTENT", "false").lower() == "true"
        self.max_content_length = int(os.getenv("OTEL_GENAI_MAX_CONTENT_LENGTH", "500"))
        self.hash_salt = os.getenv("OTEL_GENAI_HASH_SALT", "")

    def sanitize(self, text):
        """Remove PII patterns."""
        patterns = [
            (r'\b[\w.-]+@[\w.-]+\.\w{2,}\b', '[EMAIL]'),
            (r'\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b', '[PHONE]'),
            (r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b', '[SSN]'),
        ]
        for pattern, replacement in patterns:
            text = re.sub(pattern, replacement, text)
        return text

    def truncate(self, text):
        """Truncate to max length."""
        if len(text) > self.max_content_length:
            return text[:self.max_content_length] + "... [truncated]"
        return text

    def process_messages(self, messages):
        """Apply all protections to messages."""
        processed = []
        for msg in messages:
            content = msg.get("content", "")
            content = self.sanitize(content)
            content = self.truncate(content)
            processed.append({**msg, "content": content})
        return processed

    def add_to_span(self, span, input_messages, output_messages, user_consent=False):
        """Add content to span with appropriate protections."""
        if not self.capture_enabled:
            return

        if not user_consent:
            return

        span.set_attribute("gen_ai.input.messages", json.dumps(
            self.process_messages(input_messages)
        ))
        span.set_attribute("gen_ai.output.messages", json.dumps(
            self.process_messages(output_messages)
        ))
        span.set_attribute("gen_ai.content.sanitized", True)

content_handler = ContentHandler()
```

## Configuration Reference

Environment variables for content handling.

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_GENAI_CAPTURE_CONTENT` | `false` | Enable content capture |
| `OTEL_GENAI_MAX_CONTENT_LENGTH` | `500` | Max characters per message |
| `OTEL_GENAI_HASH_SALT` | `` | Salt for identifier hashing |
| `OTEL_GENAI_CONTENT_STORAGE_URL` | `` | External storage endpoint |

## Related Documentation

- [GenAI Attributes](genai-attributes.md) - Complete attribute reference
- [Span Hierarchy](../spans/llm-spans.md) - Span structure patterns

## References

- [OpenTelemetry GenAI Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/gen-ai/)
- [GDPR Article 17 - Right to Erasure](https://gdpr-info.eu/art-17-gdpr/)
