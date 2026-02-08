---
title: "OpenTelemetry SDK Configuration"
description: "Advanced SDK configuration for exporters, processors, resources, and context propagation"
type: "configuration-guide"
tags:
  - opentelemetry
  - sdk
  - configuration
  - exporters
  - processors
  - resources
category: observability
subcategory: tracing
version: "1.0"
status: stable
sources:
  - name: "OpenTelemetry Python SDK"
    url: "https://opentelemetry.io/docs/languages/python/"
  - name: "OpenTelemetry SDK Specification"
    url: "https://opentelemetry.io/docs/specs/otel/configuration/sdk-environment-variables/"
related:
  - "../overview/introduction.md"
  - "./sampling-strategies.md"
  - "./performance-tuning.md"
author: unknown
contributors: []
---

# OpenTelemetry SDK Configuration

Advanced configuration options for the OpenTelemetry SDK including exporters, processors, resources, and context propagation.

## Exporter Configuration

### OTLP Protocol Options

| Protocol | Endpoint | Use Case |
|----------|----------|----------|
| HTTP/Protobuf | http://localhost:4318 | Recommended default |
| HTTP/JSON | http://localhost:4318 | Debugging |
| gRPC | http://localhost:4317 | High volume |

### Programmatic Configuration

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource

# Create resource with service metadata
resource = Resource.create({
    "service.name": "my-app",
    "service.version": "1.0.0",
    "deployment.environment.name": "production",
})

# Configure tracer provider
tracer_provider = TracerProvider(resource=resource)
trace.set_tracer_provider(tracer_provider)

# Configure exporter
exporter = OTLPSpanExporter(
    endpoint="http://localhost:6006/v1/traces",
    headers={"authorization": "Bearer api-key"},
)

# Add processor
processor = BatchSpanProcessor(exporter)
tracer_provider.add_span_processor(processor)
```

### Multiple Exporters

```python
from opentelemetry.sdk.trace.export import ConsoleSpanExporter

# Send to multiple destinations
tracer_provider.add_span_processor(BatchSpanProcessor(otlp_exporter))
tracer_provider.add_span_processor(BatchSpanProcessor(ConsoleSpanExporter()))
```

### Exporter-Specific Headers

```python
# Phoenix
exporter = OTLPSpanExporter(
    endpoint="https://app.phoenix.arize.com/v1/traces",
    headers={"api_key": "your-phoenix-api-key"},
)

# Honeycomb
exporter = OTLPSpanExporter(
    endpoint="https://api.honeycomb.io/v1/traces",
    headers={
        "x-honeycomb-team": "your-api-key",
        "x-honeycomb-dataset": "llm-traces",
    },
)

# Grafana Cloud
exporter = OTLPSpanExporter(
    endpoint="https://otlp-gateway-prod-us-central-0.grafana.net/otlp/v1/traces",
    headers={"authorization": "Basic base64-encoded-credentials"},
)
```

## Batch Processor Settings

The BatchSpanProcessor buffers spans and exports them in batches for efficiency.

### Configuration Parameters

| Variable | Default | Purpose |
|----------|---------|---------|
| OTEL_BSP_SCHEDULE_DELAY | 5000 ms | Export interval |
| OTEL_BSP_EXPORT_TIMEOUT | 30000 ms | Export timeout |
| OTEL_BSP_MAX_QUEUE_SIZE | 2048 | Queue capacity |
| OTEL_BSP_MAX_EXPORT_BATCH_SIZE | 512 | Batch size |

### Programmatic Tuning

```python
from opentelemetry.sdk.trace.export import BatchSpanProcessor

processor = BatchSpanProcessor(
    exporter,
    max_queue_size=4096,
    max_export_batch_size=1024,
    schedule_delay_millis=2000,
    export_timeout_millis=30000,
)
```

### When to Adjust Defaults

```
High Volume (>1000 spans/sec):
  max_queue_size: 8192
  max_export_batch_size: 2048
  schedule_delay_millis: 1000

Low Latency Requirements:
  schedule_delay_millis: 500
  max_export_batch_size: 128

Memory Constrained:
  max_queue_size: 1024
  max_export_batch_size: 256
```

## Resource Configuration

Resources provide metadata about the entity producing telemetry.

### Resource Detectors

```python
from opentelemetry.sdk.resources import Resource, get_aggregated_resources
from opentelemetry.sdk.resources import ProcessResourceDetector

# Automatic detection
resource = get_aggregated_resources([
    ProcessResourceDetector(),
    # ContainerResourceDetector(),  # for Docker
    # AwsEc2ResourceDetector(),  # for AWS
])
```

### Semantic Conventions

```python
from opentelemetry.sdk.resources import Resource
from opentelemetry.semconv.resource import ResourceAttributes

resource = Resource.create({
    ResourceAttributes.SERVICE_NAME: "llm-gateway",
    ResourceAttributes.SERVICE_VERSION: "2.1.0",
    ResourceAttributes.SERVICE_NAMESPACE: "ai-platform",
    ResourceAttributes.DEPLOYMENT_ENVIRONMENT_NAME: "production",
    ResourceAttributes.HOST_NAME: "llm-gateway-pod-abc123",
    ResourceAttributes.CLOUD_PROVIDER: "aws",
    ResourceAttributes.CLOUD_REGION: "us-east-1",
})
```

### LLM-Specific Resources

```python
# Custom LLM service resources
resource = Resource.create({
    "service.name": "llm-service",
    "service.version": "1.0.0",
    "llm.provider": "openai",
    "llm.model.default": "gpt-4",
    "deployment.environment.name": "production",
})
```

## Environment Variables

### Core Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| OTEL_SERVICE_NAME | Service name | my-app |
| OTEL_RESOURCE_ATTRIBUTES | Additional attributes | key1=val1,key2=val2 |
| OTEL_TRACES_EXPORTER | Exporter type | otlp |
| OTEL_EXPORTER_OTLP_ENDPOINT | Base endpoint | http://localhost:4318 |
| OTEL_EXPORTER_OTLP_TRACES_ENDPOINT | Traces endpoint | http://localhost:4318/v1/traces |
| OTEL_EXPORTER_OTLP_PROTOCOL | Protocol | http/protobuf |
| OTEL_LOG_LEVEL | SDK log level | info |

### Signal-Specific Endpoints

```bash
# Different endpoints per signal
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://traces-collector:4318/v1/traces
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://metrics-collector:4318/v1/metrics
OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://logs-collector:4318/v1/logs
```

### Headers via Environment

```bash
# Single header
OTEL_EXPORTER_OTLP_HEADERS="authorization=Bearer token123"

# Multiple headers
OTEL_EXPORTER_OTLP_HEADERS="authorization=Bearer token123,x-tenant-id=acme"
```

### Complete Environment Configuration

```bash
export OTEL_SERVICE_NAME="llm-gateway"
export OTEL_RESOURCE_ATTRIBUTES="deployment.environment.name=production,service.version=1.0.0"
export OTEL_TRACES_EXPORTER="otlp"
export OTEL_EXPORTER_OTLP_PROTOCOL="http/protobuf"
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4318"
export OTEL_EXPORTER_OTLP_HEADERS="authorization=Bearer api-key"
export OTEL_BSP_SCHEDULE_DELAY=5000
export OTEL_BSP_MAX_QUEUE_SIZE=4096
```

## Context Propagation

Context propagation ensures trace context flows across service boundaries.

### Default Propagators

```python
# Default: W3C Trace Context + Baggage
# Headers: traceparent, tracestate, baggage
```

### Override Propagators

```python
from opentelemetry.propagate import set_global_textmap
from opentelemetry.propagators.b3 import B3Format
from opentelemetry.propagators.composite import CompositePropagator

# For legacy systems using B3
set_global_textmap(B3Format())

# Multiple propagators
set_global_textmap(CompositePropagator([
    B3Format(),
    TraceContextTextMapPropagator(),
    BaggagePropagator(),
]))
```

### Environment Variable Configuration

```bash
# Use B3 propagation
OTEL_PROPAGATORS="b3,baggage"

# Multiple formats for migration
OTEL_PROPAGATORS="tracecontext,baggage,b3multi"
```

### Manual Context Injection

```python
from opentelemetry.propagate import inject

# Inject context into HTTP headers
headers = {}
inject(headers)
requests.get("http://service-b/api", headers=headers)
```

### Manual Context Extraction

```python
from opentelemetry.propagate import extract
from opentelemetry import trace

# Extract context from incoming request
context = extract(request.headers)

# Create span with extracted context
with trace.get_tracer(__name__).start_as_current_span(
    "handle-request",
    context=context
):
    pass
```

## Processor Pipelines

Multiple processors can be chained for filtering, enrichment, or routing.

### Chaining Processors

```python
# Order matters: processors execute in order added
tracer_provider.add_span_processor(AttributeFilterProcessor())
tracer_provider.add_span_processor(SensitiveDataRedactor())
tracer_provider.add_span_processor(BatchSpanProcessor(exporter))
```

### Custom Processor Example

```python
from opentelemetry.sdk.trace import SpanProcessor
from opentelemetry.sdk.trace import ReadableSpan

class SensitiveDataRedactor(SpanProcessor):
    def on_start(self, span, parent_context=None):
        pass

    def on_end(self, span: ReadableSpan):
        # Note: ReadableSpan is immutable, use sampling or filtering instead
        pass

    def shutdown(self):
        pass

    def force_flush(self, timeout_millis=30000):
        return True
```

### Filtering Spans

```python
class FilteringProcessor(SpanProcessor):
    def __init__(self, delegate: SpanProcessor, filter_fn):
        self.delegate = delegate
        self.filter_fn = filter_fn

    def on_end(self, span: ReadableSpan):
        if self.filter_fn(span):
            self.delegate.on_end(span)
```

## Initialization Patterns

### Application Startup

```python
def configure_telemetry():
    """Configure OpenTelemetry at application startup."""
    resource = Resource.create({
        "service.name": os.getenv("OTEL_SERVICE_NAME", "unknown"),
        "service.version": os.getenv("APP_VERSION", "0.0.0"),
    })

    tracer_provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(tracer_provider)

    if os.getenv("OTEL_EXPORTER_OTLP_ENDPOINT"):
        exporter = OTLPSpanExporter()
        processor = BatchSpanProcessor(exporter)
        tracer_provider.add_span_processor(processor)

    return tracer_provider
```

### Graceful Shutdown

```python
import atexit

def setup_shutdown(tracer_provider):
    def shutdown():
        tracer_provider.shutdown()

    atexit.register(shutdown)
```

### FastAPI Integration

```python
from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    tracer_provider = configure_telemetry()
    yield
    tracer_provider.shutdown()

app = FastAPI(lifespan=lifespan)
```

## Debugging Configuration

### Enable SDK Logging

```python
import logging

logging.basicConfig(level=logging.DEBUG)
logging.getLogger("opentelemetry").setLevel(logging.DEBUG)
```

### Verify Exporter Connection

```python
# Add console exporter to see spans locally
from opentelemetry.sdk.trace.export import ConsoleSpanExporter, SimpleSpanProcessor

tracer_provider.add_span_processor(
    SimpleSpanProcessor(ConsoleSpanExporter())
)
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| No spans exported | Exporter misconfigured | Check endpoint URL |
| Spans missing attributes | Attribute limits exceeded | Increase limits |
| Context not propagating | Wrong propagator | Match propagator format |
| High memory usage | Queue too large | Reduce max_queue_size |

## Related Documentation

- [Core Concepts](../overview/introduction.md) - Telemetry fundamentals
- [Sampling Strategies](./sampling-strategies.md) - Configure sampling rates
- [Performance Tuning](./performance-tuning.md) - Optimize telemetry overhead
