---
title: "Sampling Strategies"
description: "Understanding and configuring sampling for OpenTelemetry traces"
type: "configuration-guide"
tags:
  - opentelemetry
  - sampling
  - traces
  - performance
  - cost-optimization
category: observability
subcategory: tracing
version: "1.0"
status: stable
sources:
  - name: "OpenTelemetry Sampling Specification"
    url: "https://opentelemetry.io/docs/specs/otel/trace/sdk/#sampling"
  - name: "OpenTelemetry Python SDK Sampling"
    url: "https://opentelemetry.io/docs/languages/python/instrumentation/#sampling"
related:
  - "../overview/introduction.md"
  - "./otel-sdk-config.md"
  - "./performance-tuning.md"
author: unknown
contributors: []
---

# Sampling Strategies

Sampling determines which traces are recorded and exported. Proper sampling configuration balances observability needs against cost and performance overhead.

## Sampling Concepts

### Two Decision Flags

Every sampling decision produces two boolean flags:

- **IsRecording**: Controls data collection (attributes, events, links)
- **Sampled**: Propagates to descendants via SpanContext

### Valid Combinations

| IsRecording | Sampled | Use Case |
|-------------|---------|----------|
| true | true | Full tracing - record and export |
| true | false | Local recording, downstream decides |
| false | false | No tracing - minimal overhead |
| false | true | INVALID - never produced by SDK |

### Decision Flow

```
Sampling Decision Flow:

  Parent Span Context     Root Span (no parent)
         │                        │
         ▼                        ▼
  ┌─────────────────┐      ┌─────────────────┐
  │ ParentBased     │      │ Root Sampler    │
  │ Sampler         │      │ (e.g., Ratio)   │
  └────────┬────────┘      └────────┬────────┘
           │                        │
           ▼                        ▼
  ┌─────────────────────────────────────────┐
  │        SamplingResult                    │
  │  - Decision (DROP, RECORD, RECORD_SAMPLE)│
  │  - Attributes (optional)                 │
  │  - TraceState (optional)                 │
  └─────────────────────────────────────────┘
```

## Built-in Samplers

### AlwaysOn / AlwaysOff

```python
from opentelemetry.sdk.trace.sampling import ALWAYS_ON, ALWAYS_OFF
from opentelemetry.sdk.trace import TracerProvider

# Sample everything (development)
tracer_provider = TracerProvider(sampler=ALWAYS_ON)

# Sample nothing (disable tracing)
tracer_provider = TracerProvider(sampler=ALWAYS_OFF)
```

### TraceIdRatioBased

Samples a deterministic percentage based on trace ID hash.

```python
from opentelemetry.sdk.trace.sampling import TraceIdRatioBased

# Sample 10% of traces
sampler = TraceIdRatioBased(0.1)

# Sample 1% of traces
sampler = TraceIdRatioBased(0.01)
```

**Characteristics:**
- Deterministic: same trace ID always produces same decision
- Consistent across services: all services sample same traces
- No coordination needed between services

### ParentBased

Respects parent span's sampling decision for child spans.

```python
from opentelemetry.sdk.trace.sampling import ParentBased, TraceIdRatioBased

# Sample 10% of root spans, respect parent decision for children
sampler = ParentBased(root=TraceIdRatioBased(0.1))
```

**ParentBased Parameters:**

| Parameter | Purpose | Default |
|-----------|---------|---------|
| root | Sampler for root spans | Required |
| remote_parent_sampled | Remote parent sampled | ALWAYS_ON |
| remote_parent_not_sampled | Remote parent not sampled | ALWAYS_OFF |
| local_parent_sampled | Local parent sampled | ALWAYS_ON |
| local_parent_not_sampled | Local parent not sampled | ALWAYS_OFF |

```python
from opentelemetry.sdk.trace.sampling import (
    ParentBased,
    TraceIdRatioBased,
    ALWAYS_ON,
    ALWAYS_OFF,
)

sampler = ParentBased(
    root=TraceIdRatioBased(0.1),
    remote_parent_sampled=ALWAYS_ON,
    remote_parent_not_sampled=ALWAYS_OFF,
    local_parent_sampled=ALWAYS_ON,
    local_parent_not_sampled=ALWAYS_OFF,
)
```

## Environment Variable Configuration

Configure sampling without code changes.

```bash
# Always sample
OTEL_TRACES_SAMPLER=always_on

# Never sample
OTEL_TRACES_SAMPLER=always_off

# Ratio-based
OTEL_TRACES_SAMPLER=traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1

# Parent-based with ratio root
OTEL_TRACES_SAMPLER=parentbased_traceidratio
OTEL_TRACES_SAMPLER_ARG=0.1

# Parent-based always on
OTEL_TRACES_SAMPLER=parentbased_always_on

# Parent-based always off
OTEL_TRACES_SAMPLER=parentbased_always_off
```

### Available Sampler Types

| Value | Description |
|-------|-------------|
| always_on | Sample all traces |
| always_off | Sample no traces |
| traceidratio | Sample percentage (use ARG) |
| parentbased_always_on | Parent-based, root always on |
| parentbased_always_off | Parent-based, root always off |
| parentbased_traceidratio | Parent-based, root ratio (use ARG) |

## Production Recommendations

### Cost vs Observability Trade-off

| Environment | Sampler | Rate | Reasoning |
|-------------|---------|------|-----------|
| Development | always_on | 100% | Full visibility for debugging |
| Staging | traceidratio | 50% | Good coverage, test sampling |
| Production (low traffic) | parentbased_traceidratio | 10-25% | Balance cost and coverage |
| Production (high traffic) | parentbased_traceidratio | 1-5% | Manage volume and cost |
| Production (critical) | parentbased_always_on | 100% | Full visibility required |

### Volume-Based Guidelines

```
Traffic Volume        Recommended Rate    Estimated Daily Spans
─────────────────────────────────────────────────────────────────
< 1K req/day          100%                ~10K spans
1K - 10K req/day      50%                 ~50K spans
10K - 100K req/day    10%                 ~100K spans
100K - 1M req/day     5%                  ~500K spans
> 1M req/day          1%                  ~1M spans
```

## Custom Samplers

### Error-Based Sampling

Always capture errors even with low sampling rate.

```python
from opentelemetry.sdk.trace.sampling import (
    Sampler,
    SamplingResult,
    Decision,
    TraceIdRatioBased,
)
from opentelemetry.trace import SpanKind

class ErrorPreservingSampler(Sampler):
    def __init__(self, base_rate: float):
        self.base_sampler = TraceIdRatioBased(base_rate)

    def should_sample(
        self,
        parent_context,
        trace_id,
        name,
        kind,
        attributes,
        links,
    ) -> SamplingResult:
        # Always sample if error attribute present
        if attributes and attributes.get("error"):
            return SamplingResult(
                Decision.RECORD_AND_SAMPLE,
                attributes,
            )

        # Fall back to base sampler
        return self.base_sampler.should_sample(
            parent_context, trace_id, name, kind, attributes, links
        )

    def get_description(self) -> str:
        return "ErrorPreservingSampler"
```

### Endpoint-Based Sampling

Different rates for different endpoints.

```python
class EndpointSampler(Sampler):
    def __init__(self):
        self.high_value = TraceIdRatioBased(1.0)  # 100%
        self.standard = TraceIdRatioBased(0.1)    # 10%
        self.health = TraceIdRatioBased(0.001)    # 0.1%

    def should_sample(
        self,
        parent_context,
        trace_id,
        name,
        kind,
        attributes,
        links,
    ) -> SamplingResult:
        http_target = attributes.get("http.target", "") if attributes else ""

        # Health checks: minimal sampling
        if "/health" in http_target or "/ready" in http_target:
            return self.health.should_sample(
                parent_context, trace_id, name, kind, attributes, links
            )

        # Payment/checkout: full sampling
        if "/payment" in http_target or "/checkout" in http_target:
            return self.high_value.should_sample(
                parent_context, trace_id, name, kind, attributes, links
            )

        # Everything else: standard rate
        return self.standard.should_sample(
            parent_context, trace_id, name, kind, attributes, links
        )

    def get_description(self) -> str:
        return "EndpointSampler"
```

### LLM-Specific Sampling

Higher rates for expensive LLM operations.

```python
class LLMSampler(Sampler):
    def __init__(self, llm_rate: float = 1.0, default_rate: float = 0.1):
        self.llm_sampler = TraceIdRatioBased(llm_rate)
        self.default_sampler = TraceIdRatioBased(default_rate)

    def should_sample(
        self,
        parent_context,
        trace_id,
        name,
        kind,
        attributes,
        links,
    ) -> SamplingResult:
        # Sample all LLM spans (expensive operations worth tracking)
        if name.startswith("llm.") or (
            attributes and "llm.model" in attributes
        ):
            return self.llm_sampler.should_sample(
                parent_context, trace_id, name, kind, attributes, links
            )

        return self.default_sampler.should_sample(
            parent_context, trace_id, name, kind, attributes, links
        )

    def get_description(self) -> str:
        return "LLMSampler"
```

## Tail-Based Sampling

Head-based sampling decides at trace start. Tail-based sampling waits until trace completes.

### When to Use Tail-Based

| Use Case | Head vs Tail |
|----------|--------------|
| Simple percentage sampling | Head |
| Sample based on latency | Tail |
| Sample based on errors | Tail |
| Sample based on specific attributes | Both |
| Lowest overhead | Head |
| Most flexibility | Tail |

### Collector-Level Tail Sampling

```yaml
# OpenTelemetry Collector config
processors:
  tail_sampling:
    decision_wait: 10s
    num_traces: 100000
    policies:
      # Always sample errors
      - name: errors
        type: status_code
        status_code:
          status_codes: [ERROR]
      # Sample slow traces
      - name: latency
        type: latency
        latency:
          threshold_ms: 5000
      # Probabilistic for rest
      - name: probabilistic
        type: probabilistic
        probabilistic:
          sampling_percentage: 10
```

## Cost Optimization

### Estimating Costs

```
Cost Factors:
  - Span volume (count)
  - Span size (attributes, events)
  - Retention period
  - Query frequency

Span Size Estimation:
  Minimal span: ~500 bytes
  Typical span: ~1-2 KB
  Large span (many attributes): ~5-10 KB

Monthly Storage:
  1M spans/day x 30 days x 2KB = ~60 GB
```

### Reducing Costs

1. **Lower sampling rate** for high-volume, low-value operations
2. **Higher sampling rate** for critical paths
3. **Filter attributes** to reduce span size
4. **Shorter retention** for non-critical traces
5. **Tail-based sampling** for intelligent selection

### Sampling Rate Calculator

```python
def calculate_sampling_rate(
    daily_requests: int,
    target_daily_spans: int,
    spans_per_request: int = 10,
) -> float:
    """Calculate sampling rate to meet span budget."""
    potential_spans = daily_requests * spans_per_request
    rate = target_daily_spans / potential_spans
    return min(1.0, max(0.001, rate))

# Example: 1M requests/day, budget 100K spans/day, ~10 spans/request
rate = calculate_sampling_rate(1_000_000, 100_000, 10)
print(f"Recommended rate: {rate:.1%}")  # 1.0%
```

## Testing Sampling Configuration

### Verify Sampling Rate

```python
from opentelemetry import trace

tracer = trace.get_tracer(__name__)

sampled_count = 0
total_count = 1000

for i in range(total_count):
    with tracer.start_as_current_span(f"test-span-{i}") as span:
        if span.is_recording():
            sampled_count += 1

actual_rate = sampled_count / total_count
print(f"Actual sampling rate: {actual_rate:.1%}")
```

### Validate Propagation

```python
# Ensure child spans follow parent decision
with tracer.start_as_current_span("parent") as parent:
    parent_sampled = parent.get_span_context().trace_flags.sampled

    with tracer.start_as_current_span("child") as child:
        child_sampled = child.get_span_context().trace_flags.sampled

        assert parent_sampled == child_sampled, "Sampling should propagate"
```

## Related Documentation

- [Core Concepts](../overview/introduction.md) - Telemetry fundamentals
- [SDK Configuration](./otel-sdk-config.md) - Exporter and processor setup
- [Performance Tuning](./performance-tuning.md) - Optimize telemetry overhead
