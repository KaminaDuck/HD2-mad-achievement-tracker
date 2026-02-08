---
title: Phoenix Docker Deployment Guide
description: Production deployment of Arize Phoenix with Docker Compose, PostgreSQL persistence, and resource configuration
type: deployment-guide
status: stable
tags:
  - phoenix
  - docker
  - deployment
  - postgresql
  - production
related:
  - ../SKILL.md
  - ./collector-patterns.md
  - ./security-auth.md
---

# Phoenix Docker Deployment Guide

Deploy Arize Phoenix for LLM observability using Docker with production-ready configurations.

## Quick Start

### Single Container (Development)

```bash
docker pull arizephoenix/phoenix:latest
docker run -p 6006:6006 -p 4317:4317 arizephoenix/phoenix:latest
```

Access UI: http://localhost:6006

### Verify Installation

```bash
# Check Phoenix is running
curl http://localhost:6006/health

# Test OTLP endpoint
curl -X POST http://localhost:6006/v1/traces \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```

## Port Configuration

| Port | Protocol | Purpose | Environment Variable |
|------|----------|---------|---------------------|
| 6006 | HTTP | UI + OTLP HTTP collector | PHOENIX_PORT |
| 4317 | gRPC | OTLP gRPC collector | PHOENIX_GRPC_PORT |
| 9090 | HTTP | Prometheus metrics | PHOENIX_ENABLE_PROMETHEUS=true |

### Port Mapping Examples

```yaml
# Default ports
ports:
  - "6006:6006"
  - "4317:4317"

# Custom ports (avoid conflicts)
ports:
  - "8080:6006"
  - "4318:4317"
environment:
  - PHOENIX_PORT=6006
  - PHOENIX_GRPC_PORT=4317
```

## Production Setup with PostgreSQL

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  phoenix:
    image: arizephoenix/phoenix:12.9.0
    container_name: phoenix
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "6006:6006"
      - "4317:4317"
      - "9090:9090"
    environment:
      - PHOENIX_SQL_DATABASE_URL=postgresql://postgres:${DB_PASSWORD}@db:5432/phoenix
      - PHOENIX_ENABLE_PROMETHEUS=true
      - PHOENIX_DEFAULT_RETENTION_POLICY_DAYS=30
      - PHOENIX_LOG_LEVEL=INFO
    restart: unless-stopped
    networks:
      - phoenix-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6006/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  db:
    image: postgres:16-alpine
    container_name: phoenix-db
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=phoenix
    volumes:
      - phoenix_db:/var/lib/postgresql/data
    networks:
      - phoenix-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d phoenix"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  phoenix_db:
    driver: local

networks:
  phoenix-network:
    driver: bridge
```

### Environment File (.env)

```bash
# Database
DB_PASSWORD=your-secure-password-here

# Phoenix (optional overrides)
PHOENIX_PORT=6006
PHOENIX_LOG_LEVEL=INFO
```

### Deploy

```bash
# Start services
docker compose up -d

# View logs
docker compose logs -f phoenix

# Check status
docker compose ps
```

## Environment Variables Reference

### Server Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| PHOENIX_PORT | HTTP server port | 6006 |
| PHOENIX_GRPC_PORT | gRPC port for OTLP | 4317 |
| PHOENIX_HOST | Bind address | 0.0.0.0 |
| PHOENIX_WORKING_DIR | Data/config directory | ~/.phoenix/ |
| PHOENIX_LOG_LEVEL | Logging verbosity (DEBUG, INFO, WARNING, ERROR) | INFO |

### Database Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| PHOENIX_SQL_DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| PHOENIX_DEFAULT_RETENTION_POLICY_DAYS | Auto-delete traces older than N days | 30 |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| PHOENIX_ENABLE_PROMETHEUS | Expose /metrics endpoint on port 9090 | false |
| PHOENIX_DISABLE_RATE_LIMIT | Disable API rate limiting | false |

### Authentication

| Variable | Description | Required |
|----------|-------------|----------|
| PHOENIX_ENABLE_AUTH | Enable authentication | No |
| PHOENIX_SECRET | JWT signing secret (min 32 characters) | If auth enabled |
| PHOENIX_API_KEY | Default system API key | No |
| PHOENIX_DEFAULT_ADMIN_INITIAL_PASSWORD | Initial admin password | No |

See [security-auth.md](./security-auth.md) for detailed authentication setup.

## Sending Traces to Phoenix

### Configure Python Client

```python
import os
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

# HTTP endpoint (port 6006)
exporter = OTLPSpanExporter(
    endpoint="http://phoenix:6006/v1/traces"
)

# With API key authentication (note: lowercase header)
exporter = OTLPSpanExporter(
    endpoint="http://phoenix:6006/v1/traces",
    headers={"authorization": "Bearer your-api-key"}
)
```

### Configure gRPC Client

```python
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

# gRPC endpoint (port 4317)
exporter = OTLPSpanExporter(
    endpoint="phoenix:4317",
    insecure=True  # Set to False with TLS
)
```

### Environment Variable Configuration

```bash
# HTTP
export OTEL_EXPORTER_OTLP_ENDPOINT=http://phoenix:6006
export OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

# gRPC
export OTEL_EXPORTER_OTLP_ENDPOINT=http://phoenix:4317
export OTEL_EXPORTER_OTLP_PROTOCOL=grpc
```

## Resource Limits and Scaling

### Memory and CPU Limits

```yaml
services:
  phoenix:
    image: arizephoenix/phoenix:12.9.0
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: "2.0"
        reservations:
          memory: 512M
          cpus: "0.5"
```

### Sizing Guidelines

| Workload | Memory | CPUs | PostgreSQL |
|----------|--------|------|------------|
| Development | 512MB | 0.5 | SQLite (built-in) |
| Small (< 100K spans/day) | 1GB | 1.0 | PostgreSQL 1GB |
| Medium (< 1M spans/day) | 2GB | 2.0 | PostgreSQL 2GB |
| Large (< 10M spans/day) | 4GB | 4.0 | PostgreSQL 4GB+ |

### PostgreSQL Tuning

```yaml
db:
  image: postgres:16-alpine
  command:
    - "postgres"
    - "-c"
    - "shared_buffers=256MB"
    - "-c"
    - "max_connections=100"
    - "-c"
    - "work_mem=4MB"
  deploy:
    resources:
      limits:
        memory: 1G
```

## Data Persistence

### SQLite (Development Only)

```yaml
phoenix:
  volumes:
    - phoenix_data:/root/.phoenix
```

**Warning:** SQLite is not recommended for production. Use PostgreSQL.

### PostgreSQL Backups

```bash
# Manual backup
docker compose exec db pg_dump -U postgres phoenix > backup.sql

# Automated backup (add to compose)
backup:
  image: prodrigestivill/postgres-backup-local
  environment:
    - POSTGRES_HOST=db
    - POSTGRES_DB=phoenix
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=${DB_PASSWORD}
    - SCHEDULE=@daily
    - BACKUP_KEEP_DAYS=7
  volumes:
    - ./backups:/backups
```

### Data Retention

```yaml
environment:
  # Auto-delete traces older than 30 days
  - PHOENIX_DEFAULT_RETENTION_POLICY_DAYS=30
```

## Prometheus Metrics

### Enable Metrics Export

```yaml
environment:
  - PHOENIX_ENABLE_PROMETHEUS=true
ports:
  - "9090:9090"
```

### Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| phoenix_spans_received_total | Counter | Total spans received |
| phoenix_traces_active | Gauge | Currently active traces |
| phoenix_http_request_duration_seconds | Histogram | HTTP request latency |

### Prometheus Scrape Config

```yaml
scrape_configs:
  - job_name: 'phoenix'
    static_configs:
      - targets: ['phoenix:9090']
    scrape_interval: 15s
```

## Health Checks and Monitoring

### Container Health Check

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:6006/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 30s
```

### Readiness Check

```bash
# Check Phoenix is ready to accept traces
curl -s http://localhost:6006/health | jq .
```

## Networking

### Docker Network Configuration

```yaml
networks:
  phoenix-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.28.0.0/16
```

### External Access

```yaml
# Expose only UI, keep OTLP internal
ports:
  - "6006:6006"  # UI accessible externally
# Do not expose 4317 externally without TLS
```

### Reverse Proxy (Nginx)

```nginx
upstream phoenix {
    server phoenix:6006;
}

server {
    listen 443 ssl;
    server_name traces.example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;

    location / {
        proxy_pass http://phoenix;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # gRPC passthrough
    location /opentelemetry.proto.collector {
        grpc_pass grpc://phoenix:4317;
    }
}
```

## Troubleshooting

### Common Issues

**Phoenix won't start:**
```bash
# Check logs
docker compose logs phoenix

# Verify database connectivity
docker compose exec phoenix nc -zv db 5432
```

**No traces appearing:**
```bash
# Verify OTLP endpoint
curl -v http://localhost:6006/v1/traces

# Check exporter configuration
echo $OTEL_EXPORTER_OTLP_ENDPOINT
```

**Database connection failures:**
```bash
# Check PostgreSQL health
docker compose exec db pg_isready -U postgres -d phoenix

# Verify connection string
docker compose exec phoenix printenv | grep DATABASE_URL
```

**High memory usage:**
```bash
# Check container stats
docker stats phoenix

# Reduce retention
PHOENIX_DEFAULT_RETENTION_POLICY_DAYS=7
```

### Debug Mode

```yaml
environment:
  - PHOENIX_LOG_LEVEL=DEBUG
```

## Production Checklist

### Security

- [ ] Pin Docker image to specific version (e.g., `12.9.0`)
- [ ] Use strong, unique PostgreSQL password
- [ ] Enable authentication with `PHOENIX_ENABLE_AUTH=true`
- [ ] Set `PHOENIX_SECRET` to random 32+ character string
- [ ] Use TLS for external connections
- [ ] Restrict network access to OTLP ports

### Data Persistence

- [ ] Use PostgreSQL (not SQLite) for production
- [ ] Configure volume mounts for PostgreSQL data
- [ ] Set up automated backups
- [ ] Configure retention policy

### Monitoring

- [ ] Enable Prometheus metrics
- [ ] Set up alerting for container health
- [ ] Monitor disk usage for database volume
- [ ] Configure log aggregation

### Performance

- [ ] Set appropriate resource limits
- [ ] Configure PostgreSQL connection pooling
- [ ] Use gRPC for high-throughput scenarios
- [ ] Consider OpenTelemetry Collector for batching

## Version Pinning

Always pin Phoenix version in production:

```yaml
# Good - pinned version
image: arizephoenix/phoenix:12.9.0

# Bad - mutable tag
image: arizephoenix/phoenix:latest
```

Check for updates: https://github.com/Arize-ai/phoenix/releases

## Quick Reference

| Action | Command |
|--------|---------|
| Start | `docker compose up -d` |
| Stop | `docker compose down` |
| Logs | `docker compose logs -f phoenix` |
| Shell | `docker compose exec phoenix sh` |
| Backup | `docker compose exec db pg_dump -U postgres phoenix > backup.sql` |
| Health | `curl http://localhost:6006/health` |
