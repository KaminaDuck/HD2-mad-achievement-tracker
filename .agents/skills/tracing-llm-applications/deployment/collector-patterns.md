---
title: OpenTelemetry Collector Patterns
description: Deployment patterns for OpenTelemetry Collector with Phoenix including agent, gateway, and high-availability configurations
type: deployment-guide
status: stable
tags:
  - opentelemetry
  - collector
  - deployment
  - architecture
  - load-balancing
related:
  - ../SKILL.md
  - ./phoenix-docker.md
  - ./security-auth.md
---

# OpenTelemetry Collector Patterns

Configure OpenTelemetry Collector as an intermediary between your applications and Phoenix.

## Deployment Patterns

### Pattern 1: No Collector (Direct)

```
Application → Phoenix
```

**Use when:**
- Single application
- Development environment
- Low trace volume
- Minimal latency requirements

**Configuration:**
```python
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

exporter = OTLPSpanExporter(endpoint="http://phoenix:6006/v1/traces")
```

### Pattern 2: Agent (Sidecar)

```
Application → Local Collector → Phoenix
```

**Use when:**
- Need trace processing/sampling
- Multiple export destinations
- Reliability requirements (buffering, retry)
- Credential management separation

**Deployment:**
```yaml
services:
  app:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318

  collector:
    image: otel/opentelemetry-collector-contrib:0.92.0
    volumes:
      - ./otel-config.yaml:/etc/otel/config.yaml
    command: ["--config=/etc/otel/config.yaml"]
```

### Pattern 3: Gateway (Centralized)

```
App1 → ─┐
App2 → ─┼─→ Central Collector → Phoenix
App3 → ─┘
```

**Use when:**
- Multiple services across hosts
- Centralized configuration
- Single egress point for security
- Aggregation before export

**Deployment:**
```yaml
services:
  collector-gateway:
    image: otel/opentelemetry-collector-contrib:0.92.0
    ports:
      - "4317:4317"  # gRPC
      - "4318:4318"  # HTTP
    deploy:
      replicas: 2
```

## Basic Collector Configuration

### Minimal Setup

```yaml
# otel-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
  batch:
    send_batch_size: 512
    timeout: 5s

exporters:
  otlphttp:
    endpoint: http://phoenix:6006

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlphttp]
```

### With Sampling

```yaml
processors:
  probabilistic_sampler:
    sampling_percentage: 10  # Keep 10% of traces

  tail_sampling:
    decision_wait: 10s
    policies:
      - name: errors-policy
        type: status_code
        status_code: {status_codes: [ERROR]}
      - name: slow-traces
        type: latency
        latency: {threshold_ms: 1000}
      - name: sample-remainder
        type: probabilistic
        probabilistic: {sampling_percentage: 5}

service:
  pipelines:
    traces:
      processors: [memory_limiter, tail_sampling, batch]
```

### With Authentication

```yaml
exporters:
  otlphttp:
    endpoint: http://phoenix:6006
    headers:
      authorization: "Bearer ${PHOENIX_API_KEY}"
```

## High Availability

### Load Balancing Considerations

**Layer 4 (TCP) Load Balancer:**
- Simple but limited to connection-level distribution
- May cause uneven load with persistent connections

**Layer 7 (gRPC-aware) Load Balancer:**
- Required for proper gRPC load distribution
- Distributes requests across connections
- Examples: Envoy, HAProxy with gRPC support

### Sidecar Pattern for Better Distribution

```yaml
# Per-application sidecar collector
services:
  app:
    environment:
      - OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
    network_mode: "service:collector-sidecar"

  collector-sidecar:
    image: otel/opentelemetry-collector-contrib:0.92.0
```

**Benefits:**
- Each app has dedicated collector
- Natural load distribution
- Collector failure isolated to single app

### Kubernetes DaemonSet Pattern

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: otel-collector
spec:
  template:
    spec:
      containers:
        - name: collector
          image: otel/opentelemetry-collector-contrib:0.92.0
          env:
            - name: K8S_NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
```

## When to Use a Collector

### Use Collector When:

| Scenario | Reason |
|----------|--------|
| Multiple services | Centralized configuration |
| Need sampling | Reduce storage costs |
| Multiple backends | Fan-out to Phoenix + other systems |
| Reliability required | Buffering, retry, queue |
| Security compliance | Single egress point |
| Credential management | Keep secrets out of apps |

### Skip Collector When:

| Scenario | Reason |
|----------|--------|
| Single application | Unnecessary complexity |
| Development/testing | Direct connection simpler |
| Ultra-low latency | Extra hop adds ~1-5ms |
| Resource constrained | Collector uses memory/CPU |

## Environment Variable Defaults

### Batch Processor

| Variable | Default | Description |
|----------|---------|-------------|
| OTEL_BSP_SCHEDULE_DELAY | 5000 ms | Time between exports |
| OTEL_BSP_EXPORT_TIMEOUT | 30000 ms | Export timeout |
| OTEL_BSP_MAX_QUEUE_SIZE | 2048 | Max spans in queue |
| OTEL_BSP_MAX_EXPORT_BATCH_SIZE | 512 | Spans per batch |

### Tuning for High Throughput

```yaml
processors:
  batch:
    send_batch_size: 1024
    send_batch_max_size: 2048
    timeout: 1s
```

### Tuning for Low Latency

```yaml
processors:
  batch:
    send_batch_size: 64
    timeout: 100ms
```

## Docker Compose with Collector

```yaml
version: '3.8'

services:
  collector:
    image: otel/opentelemetry-collector-contrib:0.92.0
    container_name: otel-collector
    command: ["--config=/etc/otel/config.yaml"]
    volumes:
      - ./otel-config.yaml:/etc/otel/config.yaml:ro
    ports:
      - "4317:4317"   # gRPC
      - "4318:4318"   # HTTP
      - "8888:8888"   # Metrics
    environment:
      - PHOENIX_API_KEY=${PHOENIX_API_KEY}
    depends_on:
      - phoenix
    networks:
      - observability

  phoenix:
    image: arizephoenix/phoenix:12.9.0
    ports:
      - "6006:6006"
    networks:
      - observability

networks:
  observability:
    driver: bridge
```

## Troubleshooting

### Collector Not Receiving Data

```bash
# Check collector is listening
docker compose exec collector nc -zv localhost 4317

# Enable debug logging
service:
  telemetry:
    logs:
      level: debug
```

### Export Failures

```yaml
# Add retry configuration
exporters:
  otlphttp:
    endpoint: http://phoenix:6006
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
      max_elapsed_time: 300s
```

### Memory Issues

```yaml
processors:
  memory_limiter:
    check_interval: 1s
    limit_mib: 512
    spike_limit_mib: 128  # Refusal threshold
```

## Quick Reference

| Component | Port | Protocol |
|-----------|------|----------|
| OTLP gRPC | 4317 | gRPC |
| OTLP HTTP | 4318 | HTTP |
| Collector Metrics | 8888 | HTTP |
| Phoenix | 6006 | HTTP |
