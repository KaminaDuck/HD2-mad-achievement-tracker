---
title: "Performance Tuning"
description: "Optimize telemetry performance and minimize overhead in production systems"
type: "performance-guide"
tags:
  - opentelemetry
  - performance
  - optimization
  - memory
  - batching
category: observability
subcategory: tracing
version: "1.0"
status: stable
sources:
  - name: "OpenTelemetry Performance Specification"
    url: "https://opentelemetry.io/docs/specs/otel/performance/"
  - name: "OpenTelemetry SDK Design Principles"
    url: "https://opentelemetry.io/docs/specs/otel/overview/"
related:
  - "../overview/introduction.md"
  - "./otel-sdk-config.md"
  - "./sampling-strategies.md"
author: unknown
contributors: []
---

# Performance Tuning

Optimize OpenTelemetry SDK performance to minimize overhead while maintaining observability.

## Core Principles

The OpenTelemetry SDK follows two fundamental design principles:

1. **Library should not block end-user application** - Telemetry operations must not impact application latency
2. **Library should not consume unbounded memory** - Memory usage must be predictable and bounded

## Memory Management

### Span Limits

Control memory usage by limiting span data collection.

| Limit | Default | Environment Variable |
|-------|---------|---------------------|
| Attributes per span | 128 | OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT |
| Events per span | 128 | OTEL_SPAN_EVENT_COUNT_LIMIT |
| Links per span | 128 | OTEL_SPAN_LINK_COUNT_LIMIT |
| Attribute value length | unlimited | OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT |
| Attributes per event | 128 | OTEL_EVENT_ATTRIBUTE_COUNT_LIMIT |
| Attributes per link | 128 | OTEL_LINK_ATTRIBUTE_COUNT_LIMIT |

### Reduce Memory for High-Volume Apps

```bash
# Conservative limits for high-throughput services
OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT=32
OTEL_SPAN_EVENT_COUNT_LIMIT=16
OTEL_SPAN_LINK_COUNT_LIMIT=8
OTEL_SPAN_ATTRIBUTE_VALUE_LENGTH_LIMIT=1024
```

### Programmatic Limits

```python
from opentelemetry.sdk.trace import TracerProvider, SpanLimits

limits = SpanLimits(
    max_attributes=32,
    max_events=16,
    max_links=8,
    max_attribute_length=1024,
)

tracer_provider = TracerProvider(span_limits=limits)
```

### Memory Impact

```
Memory per span (approximate):
  Base span structure: ~200 bytes
  Per attribute: ~50-100 bytes (key + value)
  Per event: ~100 bytes + attributes
  Per link: ~100 bytes + attributes

Example calculations:
  Default limits (128 attrs, 128 events):
    ~200 + (128 * 75) + (128 * 100) = ~22 KB per span

  Conservative limits (32 attrs, 16 events):
    ~200 + (32 * 75) + (16 * 100) = ~4 KB per span

  Queue with 2048 spans:
    Default: ~45 MB
    Conservative: ~8 MB
```

## Batching Optimization

### Batch Processor Tuning

```python
from opentelemetry.sdk.trace.export import BatchSpanProcessor

processor = BatchSpanProcessor(
    exporter,
    max_queue_size=4096,         # Increase for high volume
    max_export_batch_size=1024,  # Larger batches, fewer exports
    schedule_delay_millis=2000,  # Reduce export frequency
    export_timeout_millis=30000, # Allow time for large batches
)
```

### Configuration Profiles

```
High Volume (>1000 spans/sec):
  max_queue_size: 8192
  max_export_batch_size: 2048
  schedule_delay_millis: 1000

Standard Volume (100-1000 spans/sec):
  max_queue_size: 4096
  max_export_batch_size: 512
  schedule_delay_millis: 5000

Low Volume (<100 spans/sec):
  max_queue_size: 2048
  max_export_batch_size: 256
  schedule_delay_millis: 5000
```

### When to Use SimpleSpanProcessor

The SimpleSpanProcessor exports spans synchronously, blocking the application.

**Use only for:**
- Development and debugging
- Very low throughput (<10 spans/sec)
- Debugging export issues
- Console exporter output

```python
from opentelemetry.sdk.trace.export import SimpleSpanProcessor, ConsoleSpanExporter

# Development only
tracer_provider.add_span_processor(
    SimpleSpanProcessor(ConsoleSpanExporter())
)
```

## Non-Blocking vs Information Preservation

The SDK provides two operational modes.

### Non-Blocking Mode (Default)

```
Behavior:
  - Drops data under excessive load
  - Prevents memory exhaustion
  - Logs warning when data dropped
  - Application latency unaffected

Configuration:
  - Default behavior
  - Bounded queue size enforced
```

### Information Preservation Mode

```
Behavior:
  - Retains all data
  - May block under load
  - Can cause application slowdown
  - Use only when data loss unacceptable

When to use:
  - Compliance requirements
  - Critical audit trails
  - Debugging sessions
```

### Detecting Data Loss

```python
import logging

# Enable SDK logging to see drop warnings
logging.getLogger("opentelemetry.sdk.trace.export").setLevel(logging.WARNING)

# Watch for: "Dropping X spans, queue full"
```

## Shutdown and Flushing

### Graceful Shutdown

```python
import atexit
import signal

def setup_graceful_shutdown(tracer_provider):
    """Ensure spans are exported before process exit."""

    def shutdown_handler(signum=None, frame=None):
        tracer_provider.force_flush(timeout_millis=30000)
        tracer_provider.shutdown()

    # Register for normal exit
    atexit.register(shutdown_handler)

    # Register for signals
    signal.signal(signal.SIGTERM, shutdown_handler)
    signal.signal(signal.SIGINT, shutdown_handler)
```

### Force Flush Before Critical Operations

```python
def before_deployment():
    """Flush all pending spans before deployment."""
    success = tracer_provider.force_flush(timeout_millis=30000)
    if not success:
        print("Warning: Some spans may not have been exported")
```

### Async Context Considerations

```python
import asyncio

async def shutdown_async():
    """Async-safe shutdown."""
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None,
        lambda: tracer_provider.force_flush(timeout_millis=30000)
    )
    await loop.run_in_executor(None, tracer_provider.shutdown)
```

## Common Anti-Patterns

### Avoid These Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Span per function | High overhead | Trace meaningful operations only |
| Many large attributes | Memory pressure | Limit attributes, truncate values |
| SimpleSpanProcessor in prod | Blocks application | Use BatchSpanProcessor |
| No span limits | Unbounded memory | Set appropriate limits |
| Blocking I/O in span callbacks | Latency impact | Keep callbacks fast |
| Not closing spans | Memory leaks | Use context managers |

### Spans Per Function (Anti-Pattern)

```python
# BAD: Creates excessive spans
def process_order(order):
    with tracer.start_as_current_span("validate_order"):
        validate(order)
    with tracer.start_as_current_span("check_inventory"):
        check_inventory(order)
    with tracer.start_as_current_span("calculate_total"):
        calculate_total(order)
    # ... many more spans
```

```python
# GOOD: Single meaningful span with attributes
def process_order(order):
    with tracer.start_as_current_span("process_order") as span:
        span.set_attribute("order.id", order.id)

        validate(order)
        check_inventory(order)
        total = calculate_total(order)

        span.set_attribute("order.total", total)
```

### Large Attribute Values (Anti-Pattern)

```python
# BAD: Large attribute values consume memory
span.set_attribute("request.body", large_json_string)  # Could be MB
span.set_attribute("response.body", huge_response)
```

```python
# GOOD: Truncate or summarize large values
span.set_attribute("request.body_size", len(body))
span.set_attribute("request.body_preview", body[:500])
span.set_attribute("response.status", response.status)
```

## Best Practices

### Do These

1. **Use batch processor** - Always in production
2. **Set appropriate limits** - Based on your volume
3. **Sample in production** - Balance cost and observability
4. **Close spans promptly** - Use context managers
5. **Use context managers** - Ensures spans close on exception
6. **Monitor SDK health** - Watch for drop warnings
7. **Graceful shutdown** - Flush before exit

### Span Creation Guidance

```
When to create spans:
  - External service calls (HTTP, gRPC, database)
  - Significant business operations
  - Operations that may fail or have variable latency
  - Operations you need to troubleshoot

When NOT to create spans:
  - Every function call
  - Simple synchronous operations
  - Operations <1ms
  - Tight loops
```

## Monitoring SDK Health

### Queue Size Monitoring

```python
# Access processor internals (implementation-specific)
# Note: Not part of public API
processor = tracer_provider._active_span_processor

# Check for backpressure signs in logs
# "Dropping spans, queue full" indicates issues
```

### Key Metrics to Watch

| Metric | Healthy | Action if Unhealthy |
|--------|---------|---------------------|
| Dropped spans | 0 | Increase queue size or reduce volume |
| Export latency | <1s | Check network, exporter config |
| Queue utilization | <80% | Monitor for spikes |
| Memory usage | Stable | Check for leaks, reduce limits |

### Health Check Endpoint

```python
from fastapi import FastAPI

app = FastAPI()

@app.get("/health/telemetry")
def telemetry_health():
    return {
        "tracer_provider": "active" if trace.get_tracer_provider() else "none",
        "exporter_configured": bool(os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT")),
        "sampling_rate": os.getenv("OTEL_TRACES_SAMPLER_ARG", "1.0"),
    }
```

## Performance Benchmarks

### Overhead Estimates

```
Span creation overhead:
  Empty span: ~1-5 microseconds
  Span with 10 attributes: ~5-20 microseconds
  Span with 50 attributes: ~20-50 microseconds

Memory overhead:
  Per span (typical): 2-5 KB
  Queue (2048 spans): 4-10 MB
  Queue (8192 spans): 16-40 MB

Network overhead:
  Per span (OTLP protobuf): ~500-2000 bytes
  Batch of 512 spans: ~250 KB - 1 MB
```

### Measuring Overhead

```python
import time

def measure_span_overhead(iterations=10000):
    """Measure span creation overhead."""
    tracer = trace.get_tracer(__name__)

    # Warm up
    for _ in range(100):
        with tracer.start_as_current_span("warmup"):
            pass

    # Measure
    start = time.perf_counter()
    for _ in range(iterations):
        with tracer.start_as_current_span("test"):
            pass
    elapsed = time.perf_counter() - start

    per_span = (elapsed / iterations) * 1_000_000
    print(f"Average span overhead: {per_span:.2f} microseconds")
```

## Environment-Specific Tuning

### Development

```bash
OTEL_TRACES_SAMPLER=always_on
OTEL_LOG_LEVEL=debug
# Use SimpleSpanProcessor + Console for debugging
```

### Staging

```bash
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.5
OTEL_BSP_MAX_QUEUE_SIZE=2048
```

### Production (Standard)

```bash
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1
OTEL_BSP_MAX_QUEUE_SIZE=4096
OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT=64
```

### Production (High Volume)

```bash
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.01
OTEL_BSP_MAX_QUEUE_SIZE=8192
OTEL_BSP_MAX_EXPORT_BATCH_SIZE=2048
OTEL_SPAN_ATTRIBUTE_COUNT_LIMIT=32
OTEL_SPAN_EVENT_COUNT_LIMIT=16
```

## Related Documentation

- [Core Concepts](../overview/introduction.md) - Telemetry fundamentals
- [SDK Configuration](./otel-sdk-config.md) - Exporter and processor setup
- [Sampling Strategies](./sampling-strategies.md) - Configure sampling rates
