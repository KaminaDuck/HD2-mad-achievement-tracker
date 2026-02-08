---
title: "LLM Tracing Troubleshooting Guide"
description: "Diagnose and fix common LLM tracing issues including missing traces, connection errors, database problems, SDK configuration, and performance issues with Phoenix and OpenTelemetry"
tags:
  - troubleshooting
  - debugging
  - tracing
  - opentelemetry
  - phoenix
  - observability
  - errors
category: observability
subcategory: tracing
type: troubleshooting-guide
version: "1.0"
status: stable
sources:
  - name: "Arize Phoenix Troubleshooting"
    url: "https://docs.arize.com/phoenix/troubleshooting"
  - name: "OpenTelemetry Troubleshooting"
    url: "https://opentelemetry.io/docs/collector/troubleshooting/"
related:
  - "cheat-sheet.md"
  - "span-kinds-table.md"
  - "../deployment/phoenix-docker.md"
author: "AI Engineering Team"
contributors: []
---

# LLM Tracing Troubleshooting Guide

Diagnose and fix common issues with LLM application tracing using Phoenix and OpenTelemetry.

---

## Quick Diagnostic Checklist

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| Traces not appearing | Collector not running | Check `curl http://localhost:6006/health` |
| Connection refused | Wrong endpoint/port | Verify OTEL_EXPORTER_OTLP_ENDPOINT |
| Auth errors | Missing/invalid API key | Check PHOENIX_API_KEY or auth headers |
| Partial traces | Missing instrumentation | Call `Agent.instrument_all()` |
| High latency | Sync export or network | Use BatchSpanProcessor |
| Missing attributes | Added after span.end() | Set attributes before ending span |

---

## Traces Not Appearing

### Check Phoenix Is Running

```bash
# Health check
curl http://localhost:6006/health

# Expected response
{"status": "ok"}

# If using Docker
docker ps | grep phoenix
docker logs <phoenix-container-id>
```

### Verify Endpoint Is Reachable

```bash
# From application host
curl -X POST http://localhost:6006/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans": []}'

# Expected: 200 OK (empty response is fine)

# From inside Docker container
docker exec <app-container> curl http://phoenix:6006/v1/traces
```

### Check Environment Variables

```python
import os

print("OTEL_EXPORTER_OTLP_ENDPOINT:", os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT"))
print("PHOENIX_COLLECTOR_ENDPOINT:", os.getenv("PHOENIX_COLLECTOR_ENDPOINT"))
print("OTEL_SERVICE_NAME:", os.getenv("OTEL_SERVICE_NAME"))

# Verify tracer provider is set
from opentelemetry import trace
provider = trace.get_tracer_provider()
print("Tracer Provider:", type(provider).__name__)
```

### Force Flush Spans

```python
from opentelemetry import trace

provider = trace.get_tracer_provider()
if hasattr(provider, 'force_flush'):
    success = provider.force_flush(timeout_millis=5000)
    print("Flush success:", success)
```

---

## Connection Errors

### Docker Networking Issues

**Problem:** Application can't reach Phoenix in Docker.

**Diagnosis:**

```bash
# Check network
docker network ls
docker network inspect <network-name>

# Check Phoenix is on correct network
docker inspect phoenix | grep NetworkMode
```

**Fix:**

| Location | Use This Endpoint |
|----------|-------------------|
| Inside container (same network) | `http://phoenix:6006` |
| From host machine | `http://localhost:6006` |
| Different Docker network | Use container IP or shared network |

**docker-compose.yml fix:**

```yaml
services:
  app:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://phoenix:6006
    depends_on:
      - phoenix
    networks:
      - app-network

  phoenix:
    image: arizephoenix/phoenix:latest
    ports:
      - "6006:6006"
      - "4317:4317"
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

### Port Conflicts

```bash
# Check what's using ports
lsof -i :6006
lsof -i :4317

# Kill conflicting process
kill -9 <pid>

# Or use different ports
docker run -p 6007:6006 -p 4318:4317 arizephoenix/phoenix:latest
```

### SSL/TLS Errors

**Problem:** Certificate verification failures.

**Fix:**

```python
# Disable SSL verification (development only!)
import os
os.environ["OTEL_EXPORTER_OTLP_INSECURE"] = "true"

# Or provide custom CA
os.environ["OTEL_EXPORTER_OTLP_CERTIFICATE"] = "/path/to/ca.crt"
```

---

## Authentication Errors

### Check API Key Configuration

```python
import os

api_key = os.getenv("PHOENIX_API_KEY")
print("API Key present:", api_key is not None)
print("API Key length:", len(api_key) if api_key else 0)
```

### Header Format

**Correct format (lowercase `authorization`):**

```python
from phoenix.otel import register

tracer_provider = register(
    endpoint="https://app.phoenix.arize.com",
    headers={"authorization": f"Bearer {api_key}"},  # lowercase!
)
```

**For OTLP exporter:**

```python
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

exporter = OTLPSpanExporter(
    endpoint="https://app.phoenix.arize.com/v1/traces",
    headers={"authorization": f"Bearer {api_key}"},
)
```

### Environment Variable Format

```bash
# Correct
export OTEL_EXPORTER_OTLP_HEADERS="authorization=Bearer phx_abc123"

# Incorrect (will fail)
export OTEL_EXPORTER_OTLP_HEADERS="Authorization: Bearer phx_abc123"
```

---

## Database Connection Errors

### PostgreSQL Not Ready

**Problem:** Phoenix starts before PostgreSQL is ready.

**Fix with healthcheck:**

```yaml
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_USER: phoenix
      POSTGRES_PASSWORD: phoenix
      POSTGRES_DB: phoenix
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U phoenix"]
      interval: 5s
      timeout: 5s
      retries: 5

  phoenix:
    image: arizephoenix/phoenix:latest
    environment:
      PHOENIX_SQL_DATABASE_URL: postgresql://phoenix:phoenix@db:5432/phoenix
    depends_on:
      db:
        condition: service_healthy
```

### Connection String Format

```bash
# Correct format
PHOENIX_SQL_DATABASE_URL=postgresql://user:password@host:5432/database

# Incorrect (use postgresql://, not postgres://)
PHOENIX_SQL_DATABASE_URL=postgres://user:password@host:5432/database
```

### Database Permissions

```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE phoenix TO phoenix_user;
GRANT ALL ON SCHEMA public TO phoenix_user;
```

---

## Missing Data in Traces

### Spans Missing Attributes

**Problem:** Attributes not appearing in Phoenix UI.

**Diagnosis:** Attributes must be set before span ends.

```python
# Wrong - attributes set after span ends
with tracer.start_as_current_span("my_span") as span:
    result = do_work()
span.set_attribute("result", result)  # Too late!

# Correct - attributes set before span ends
with tracer.start_as_current_span("my_span") as span:
    result = do_work()
    span.set_attribute("result", result)  # Inside context manager
```

### Attribute Limits

Default limits per span:
- 128 attributes per span
- 128 events per span
- 128 links per span

**Increase limits:**

```python
from opentelemetry.sdk.trace import SpanLimits, TracerProvider

provider = TracerProvider(
    span_limits=SpanLimits(
        max_attributes=256,
        max_events=256,
        max_links=256,
        max_attribute_length=4096,
    )
)
```

### Content Not Captured

**Problem:** Message content not appearing.

**Fix:** Enable content capture in instrumentation settings.

```python
from openinference.instrumentation import InstrumentationSettings

settings = InstrumentationSettings(
    include_input_content=True,
    include_output_content=True,
)

# Apply to specific instrumentor
from openinference.instrumentation.openai import OpenAIInstrumentor
OpenAIInstrumentor().instrument(settings=settings)
```

---

## SDK Configuration Errors

### Missing Tracer Provider

**Problem:** `NoOpTracerProvider` being used.

```python
from opentelemetry import trace

provider = trace.get_tracer_provider()
print(type(provider))  # Should NOT be NoOpTracerProvider
```

**Fix:** Set tracer provider before any instrumentation.

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider

# Must be done FIRST, before importing instrumented libraries
provider = TracerProvider()
trace.set_tracer_provider(provider)

# Now import and use instrumented libraries
from openai import OpenAI
```

### Duplicate Instrumentation

**Problem:** Spans appear twice or instrumentation conflicts.

**Fix:** Only call instrumentation once.

```python
# Wrong - calling multiple times
from pydantic_ai import Agent
Agent.instrument_all()
Agent.instrument_all()  # Duplicate!

# Correct - guard against duplicates
_instrumented = False

def setup_instrumentation():
    global _instrumented
    if _instrumented:
        return
    Agent.instrument_all()
    _instrumented = True
```

### Import Order Issues

**Problem:** Auto-instrumentation not capturing calls.

**Fix:** Instrument before importing SDK clients.

```python
# Wrong order
from openai import OpenAI  # Imported first
from openinference.instrumentation.openai import OpenAIInstrumentor
OpenAIInstrumentor().instrument()  # Too late!

# Correct order
from openinference.instrumentation.openai import OpenAIInstrumentor
OpenAIInstrumentor().instrument()  # Instrument first
from openai import OpenAI  # Then import
```

---

## Performance Issues

### High Memory Usage

**Problem:** Phoenix consuming too much memory.

**Fix:** Set resource limits.

```yaml
services:
  phoenix:
    image: arizephoenix/phoenix:latest
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2'
        reservations:
          memory: 2G
```

### Slow Trace Export

**Problem:** Application blocked on trace export.

**Fix:** Use BatchSpanProcessor (not SimpleSpanProcessor).

```python
from opentelemetry.sdk.trace.export import BatchSpanProcessor, SimpleSpanProcessor

# Wrong - blocks on every span
processor = SimpleSpanProcessor(exporter)

# Correct - batches exports
processor = BatchSpanProcessor(
    exporter,
    max_queue_size=2048,
    max_export_batch_size=512,
    schedule_delay_millis=5000,
)
```

### Tune Batch Processor

```bash
# Environment variables
export OTEL_BSP_MAX_QUEUE_SIZE=4096
export OTEL_BSP_MAX_EXPORT_BATCH_SIZE=512
export OTEL_BSP_SCHEDULE_DELAY=5000
export OTEL_BSP_EXPORT_TIMEOUT=30000
```

### Large Span Payloads

**Problem:** Spans too large, causing slow exports.

**Fix:** Truncate large content.

```python
def safe_set_attribute(span, key, value, max_length=4096):
    if isinstance(value, str) and len(value) > max_length:
        value = value[:max_length] + "...[truncated]"
    span.set_attribute(key, value)
```

---

## Quick Diagnostic Script

```python
#!/usr/bin/env python3
"""Diagnose LLM tracing setup issues."""

import os
import sys

def check_environment():
    print("=== Environment Variables ===")
    vars_to_check = [
        "OTEL_EXPORTER_OTLP_ENDPOINT",
        "OTEL_SERVICE_NAME",
        "PHOENIX_COLLECTOR_ENDPOINT",
        "PHOENIX_API_KEY",
    ]
    for var in vars_to_check:
        value = os.getenv(var)
        if value:
            # Mask API keys
            if "KEY" in var or "TOKEN" in var:
                value = value[:8] + "..." if len(value) > 8 else "***"
        print(f"  {var}: {value or 'NOT SET'}")

def check_tracer_provider():
    print("\n=== Tracer Provider ===")
    from opentelemetry import trace
    provider = trace.get_tracer_provider()
    print(f"  Type: {type(provider).__name__}")

    if "NoOp" in type(provider).__name__:
        print("  WARNING: Using NoOpTracerProvider - traces will not be exported!")

def check_connectivity():
    print("\n=== Connectivity ===")
    import urllib.request
    import urllib.error

    endpoint = os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:6006")
    health_url = f"{endpoint}/health"

    try:
        with urllib.request.urlopen(health_url, timeout=5) as response:
            print(f"  {health_url}: OK ({response.status})")
    except urllib.error.URLError as e:
        print(f"  {health_url}: FAILED ({e.reason})")
    except Exception as e:
        print(f"  {health_url}: ERROR ({e})")

def check_instrumentation():
    print("\n=== Instrumentation ===")
    try:
        from opentelemetry.instrumentation import get_instrumentations
        instrumentations = list(get_instrumentations())
        if instrumentations:
            for instr in instrumentations:
                name = type(instr).__name__
                active = getattr(instr, 'is_instrumented', lambda: 'unknown')()
                print(f"  {name}: {active}")
        else:
            print("  No instrumentations registered")
    except ImportError:
        print("  Could not load instrumentation module")

if __name__ == "__main__":
    check_environment()
    check_tracer_provider()
    check_connectivity()
    check_instrumentation()
    print("\n=== Diagnostics Complete ===")
```

---

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Connection refused` | Collector not running | Start Phoenix: `docker run -p 6006:6006 arizephoenix/phoenix` |
| `Failed to export spans` | Network/auth issue | Check endpoint and credentials |
| `NoOpTracerProvider` | Provider not set | Call `trace.set_tracer_provider()` first |
| `Span attribute limit` | Too many attributes | Increase limits or reduce attributes |
| `DEADLINE_EXCEEDED` | Export timeout | Increase timeout or check network |
| `RESOURCE_EXHAUSTED` | Collector overloaded | Add rate limiting, increase resources |

---

## Getting Help

1. Check [Phoenix GitHub Issues](https://github.com/Arize-ai/phoenix/issues)
2. Review [OpenTelemetry Python Docs](https://opentelemetry.io/docs/languages/python/)
3. Join [Arize Community Slack](https://arize.com/community)
4. Include in bug reports:
   - Phoenix version (`curl localhost:6006/version`)
   - Python/SDK versions
   - Full error messages with stack traces
   - Minimal reproduction code

---

## Related

- [Cheat Sheet](cheat-sheet.md)
- [Span Kinds Reference](span-kinds-table.md)
- [Docker Compose Deployment](../deployment/phoenix-docker.md)
