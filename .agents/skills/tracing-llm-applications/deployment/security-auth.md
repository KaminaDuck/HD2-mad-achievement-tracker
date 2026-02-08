---
title: Phoenix Security and Authentication
description: Secure production Phoenix deployments with authentication, API keys, OAuth2/OIDC, and TLS configuration
type: security-guide
status: stable
tags:
  - phoenix
  - security
  - authentication
  - oauth2
  - tls
  - api-keys
related:
  - ../SKILL.md
  - ./phoenix-docker.md
  - ./collector-patterns.md
---

# Phoenix Security and Authentication

Secure production Phoenix deployments with authentication, API key management, and TLS.

## Phoenix Authentication

### Enable Authentication

```yaml
# docker-compose.yml
services:
  phoenix:
    environment:
      - PHOENIX_ENABLE_AUTH=true
      - PHOENIX_SECRET=your-secret-key-minimum-32-characters-long
      - PHOENIX_USE_SECURE_COOKIES=true
```

**Requirements:**
- `PHOENIX_SECRET` must be at least 32 characters
- Use cryptographically random string
- Never commit secrets to version control

### Generate Secret

```bash
# Generate random secret
openssl rand -hex 32

# Or using Python
python -c "import secrets; print(secrets.token_hex(32))"
```

### Default Admin Account

When authentication is first enabled:

| Field | Default Value |
|-------|---------------|
| Email | admin@localhost |
| Password | admin |

**Override initial password:**
```yaml
environment:
  - PHOENIX_DEFAULT_ADMIN_INITIAL_PASSWORD=your-secure-admin-password
```

**Important:** Change the admin password immediately after first login.

## API Key Management

### Creating API Keys

**Via UI:**
1. Login as admin
2. Navigate to Settings > API Keys
3. Click "Create System API Key"
4. Copy and store the key securely (shown only once)

**Key Types:**
| Type | Scope | Use Case |
|------|-------|----------|
| System API Key | Full access | Server-to-server |
| User API Key | User-scoped | Individual access |

### Using API Keys

**Environment Variable:**
```bash
export PHOENIX_API_KEY=your-system-or-user-key
```

**Python SDK:**
```python
import os
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

exporter = OTLPSpanExporter(
    endpoint="http://phoenix:6006/v1/traces",
    headers={"authorization": f"Bearer {os.environ['PHOENIX_API_KEY']}"}
)
```

**Note:** Header key must be lowercase `authorization`.

**cURL:**
```bash
curl -X POST http://phoenix:6006/v1/traces \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"resourceSpans":[]}'
```

### API Key Best Practices

- Rotate keys regularly (monthly minimum)
- Use separate keys per service/environment
- Store keys in secrets manager (Vault, AWS Secrets Manager)
- Monitor key usage for anomalies
- Revoke unused keys immediately

## OAuth2/OIDC Integration

### Google OAuth2

```yaml
environment:
  - PHOENIX_OAUTH2_GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
  - PHOENIX_OAUTH2_GOOGLE_CLIENT_SECRET=GOCSPX-abc123xyz
  - PHOENIX_OAUTH2_GOOGLE_OIDC_CONFIG_URL=https://accounts.google.com/.well-known/openid-configuration
  - PHOENIX_OAUTH2_GOOGLE_DISPLAY_NAME=Sign in with Google
```

### Generic OIDC Provider

```yaml
environment:
  - PHOENIX_OAUTH2_CUSTOM_CLIENT_ID=your-client-id
  - PHOENIX_OAUTH2_CUSTOM_CLIENT_SECRET=your-client-secret
  - PHOENIX_OAUTH2_CUSTOM_OIDC_CONFIG_URL=https://your-idp/.well-known/openid-configuration
  - PHOENIX_OAUTH2_CUSTOM_DISPLAY_NAME=Sign in with SSO
```

### OAuth2 Configuration Steps

1. Create OAuth2 application in your IdP
2. Set redirect URI: `https://your-phoenix-domain/oauth2/callback`
3. Configure environment variables
4. Test authentication flow

## TLS Configuration

### Client-Side TLS

```yaml
# Application environment
environment:
  - OTEL_EXPORTER_OTLP_CERTIFICATE=/path/to/ca-cert.pem
  - OTEL_EXPORTER_OTLP_CLIENT_KEY=/path/to/client-key.pem
  - OTEL_EXPORTER_OTLP_CLIENT_CERTIFICATE=/path/to/client-cert.pem
```

**Python:**
```python
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter

exporter = OTLPSpanExporter(
    endpoint="https://phoenix:4317",
    credentials=ssl_channel_credentials(
        root_certificates=open("/path/to/ca-cert.pem", "rb").read(),
        private_key=open("/path/to/client-key.pem", "rb").read(),
        certificate_chain=open("/path/to/client-cert.pem", "rb").read()
    )
)
```

### Reverse Proxy TLS Termination

```nginx
server {
    listen 443 ssl;
    server_name traces.example.com;

    ssl_certificate /etc/ssl/certs/phoenix.crt;
    ssl_certificate_key /etc/ssl/private/phoenix.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://phoenix:6006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Network Security

### Restrict Database Access

```yaml
services:
  db:
    networks:
      - internal
    # No ports exposed externally

  phoenix:
    networks:
      - internal
      - external
    ports:
      - "6006:6006"

networks:
  internal:
    internal: true
  external:
```

### Firewall Rules

```bash
# Allow HTTPS only from specific IPs
iptables -A INPUT -p tcp --dport 443 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j DROP

# Block direct access to OTLP ports from external
iptables -A INPUT -p tcp --dport 4317 -s 10.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 4317 -j DROP
```

## Security Checklist

### Authentication

- [ ] Enable `PHOENIX_ENABLE_AUTH=true`
- [ ] Set strong `PHOENIX_SECRET` (32+ random characters)
- [ ] Change default admin password
- [ ] Configure OAuth2/OIDC for production
- [ ] Enable `PHOENIX_USE_SECURE_COOKIES=true`

### API Keys

- [ ] Create service-specific API keys
- [ ] Store keys in secrets manager
- [ ] Implement key rotation policy
- [ ] Monitor API key usage
- [ ] Revoke unused keys

### Network

- [ ] Use HTTPS for all external traffic
- [ ] Terminate TLS at reverse proxy
- [ ] Restrict PostgreSQL to internal network
- [ ] Limit OTLP port access to known services
- [ ] Configure firewall rules

### Data

- [ ] Enable trace retention policy
- [ ] Encrypt PostgreSQL at rest
- [ ] Implement backup encryption
- [ ] Audit log configuration

### Infrastructure

- [ ] Pin Docker image versions
- [ ] Scan images for vulnerabilities
- [ ] Use non-root container user
- [ ] Enable container security options

## Quick Reference

| Setting | Variable | Production Value |
|---------|----------|------------------|
| Enable auth | PHOENIX_ENABLE_AUTH | true |
| JWT secret | PHOENIX_SECRET | 32+ char random |
| Secure cookies | PHOENIX_USE_SECURE_COOKIES | true |
| Initial admin pass | PHOENIX_DEFAULT_ADMIN_INITIAL_PASSWORD | Strong random |
