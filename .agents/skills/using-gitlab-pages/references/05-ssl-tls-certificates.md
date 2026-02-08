# GitLab Pages SSL/TLS Certificates

> Sources:
> - https://docs.gitlab.com/user/project/pages/custom_domains_ssl_tls_certification/ssl_tls_concepts/
> - https://docs.gitlab.com/user/project/pages/custom_domains_ssl_tls_certification/lets_encrypt_integration/

## Availability

- **Tiers**: Free, Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed

## Default HTTPS

All GitLab Pages projects on GitLab.com are automatically available under HTTPS for the default domain (`*.gitlab.io`).

For custom domains, you need to configure SSL/TLS certificates.

## Why HTTPS Matters

HTTPS encrypts the connection between client and server, providing:
- Protection against eavesdropping
- Prevention of content alteration
- User privacy for consumed content
- Protection against site being used to attack others

Organizations like W3C and Mozilla strongly advocate for HTTPS everywhere.

## Certificate Options

### 1. Let's Encrypt (Recommended)

Automatic, free certificates that GitLab obtains and renews for you.

### 2. Manual Certificates

Upload your own PEM certificates from Certificate Authorities or use self-signed certificates (not recommended for public sites).

### 3. Cloudflare Certificates

Free certificates valid up to 15 years. See [Cloudflare setup guide](https://about.gitlab.com/blog/2017/02/07/setting-up-gitlab-pages-with-cloudflare-certificates/).

## Let's Encrypt Integration

### Prerequisites

1. Pages project running on GitLab
2. Custom domain with DNS configured
3. Domain verified in GitLab
4. Site accessible via custom domain
5. Let's Encrypt enabled (default on GitLab.com)

### Enable Let's Encrypt

1. Navigate to **Deploy > Pages**
2. Select **Edit** (pencil) next to domain
3. Turn on **Automatic certificate management using Let's Encrypt**
4. Select **Save changes**

Certificate issuance can take up to an hour. Your existing certificate continues working until replaced.

### Troubleshooting Let's Encrypt

#### "Something went wrong" Error

1. Ensure Pages visibility is set to "Everyone" in **Settings > General > Visibility**
2. Verify only one A or CNAME record exists for domain
3. Remove any AAAA records temporarily
4. If using CAA records, ensure `letsencrypt.org` is included
5. Verify domain ownership is confirmed

#### Certificate Hangs for Over an Hour

1. Remove the domain from GitLab Pages
2. Re-add and re-verify the domain
3. Re-enable Let's Encrypt integration
4. If still failing, check DNS configuration

## Manual Certificate Upload

### Required Components

| Component | Description |
|-----------|-------------|
| PEM Certificate | Certificate from Certificate Authority |
| Intermediate Certificate | Root certificate identifying CA (often combined with PEM) |
| Private Key | Encrypted key validating PEM against domain |

### Add Certificate to New Domain

1. Navigate to **Deploy > Pages**
2. Select **New Domain**
3. Enter domain name
4. Turn **off** Automatic certificate management
5. Paste PEM certificate (include intermediate cert with blank line separator)
6. Paste private key
7. Select **Create New Domain**

### Add Certificate to Existing Domain

1. Navigate to **Deploy > Pages**
2. Select **Edit** next to domain
3. Turn **off** Automatic certificate management
4. Complete certificate fields
5. Select **Save changes**

### Certificate Format

- Use PEM format
- If intermediate certificate is separate, concatenate with blank line:

```
-----BEGIN CERTIFICATE-----
[Your certificate]
-----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----
[Intermediate certificate]
-----END CERTIFICATE-----
```

**Tip**: Use code editors (VS Code, Sublime) to open certificates, not regular text editors.

## Force HTTPS

Automatically redirect HTTP to HTTPS with 301 redirect:

1. Navigate to **Deploy > Pages**
2. Check **Force HTTPS (requires valid certificates)**
3. Select **Save changes**

Works with both default GitLab Pages domain and custom domains with valid certificates.

### Cloudflare Note

If using Cloudflare CDN in front of GitLab Pages, set SSL mode to `full` (not `flexible`).

## Certificate Authorities

### Free Options

| Provider | Features |
|----------|----------|
| [Let's Encrypt](https://letsencrypt.org/) | Free, automated, open source, trusted by browsers |
| [Cloudflare](https://www.cloudflare.com/application-services/products/ssl/) | Free with CDN, certificates valid up to 15 years |

### Self-Signed Certificates

- Not recommended for public websites
- Browsers show security warnings
- Acceptable for internal/testing purposes

## Certificate Renewal

### Let's Encrypt

Automatic renewal managed by GitLab. No action required.

### Manual Certificates

Must be renewed and re-uploaded before expiration:

1. Obtain new certificate from CA
2. Navigate to **Deploy > Pages**
3. Edit domain
4. Update certificate and key fields
5. Save changes
