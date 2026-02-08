# GitLab Pages Custom Domains

> Source: https://docs.gitlab.com/user/project/pages/custom_domains_ssl_tls_certification/

## Availability

- **Tiers**: Free, Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed

## Prerequisites

Before setting up a custom domain:

1. Administrator has enabled [custom domains](https://docs.gitlab.com/administration/pages/#advanced-configuration)
2. Pages website is running on default domain (`*.gitlab.io`)
3. You own the custom domain (`example.com` or `subdomain.example.com`)
4. Access to domain registrar's DNS control panel

## Setup Process

### Step 1: Add Custom Domain

1. Navigate to **Deploy > Pages**
2. Select **New Domain**
3. Enter domain name
4. Optionally configure SSL certificate
5. Select **Create New Domain**

### Step 2: Get Verification Code

After adding domain, GitLab provides:

- **Name/Host**: `_gitlab-pages-verification-code.example.com`
- **Record Type**: `TXT`
- **Value**: `gitlab-pages-verification-code=<your-code>`

### Step 3: Configure DNS Records

#### For Root Domains (`example.com`)

| From | Record | To |
|------|--------|-----|
| `example.com` | `A` | `35.185.44.232` |
| `example.com` | `AAAA` | `2600:1901:0:7b8a::` |
| `_gitlab-pages-verification-code.example.com` | `TXT` | `gitlab-pages-verification-code=<code>` |

**Important**: Do not use CNAME for root domains—it conflicts with MX records.

#### For Subdomains (`www.example.com`)

| From | Record | To |
|------|--------|-----|
| `subdomain.example.com` | `CNAME` | `namespace.gitlab.io` |
| `_gitlab-pages-verification-code.subdomain.example.com` | `TXT` | `gitlab-pages-verification-code=<code>` |

#### For Both Root and Subdomain

| From | Record | To |
|------|--------|-----|
| `example.com` | `A` | `35.185.44.232` |
| `example.com` | `AAAA` | `2600:1901:0:7b8a::` |
| `_gitlab-pages-verification-code.example.com` | `TXT` | `gitlab-pages-verification-code=<code>` |
| `www.example.com` | `CNAME` | `namespace.gitlab.io` |
| `_gitlab-pages-verification-code.www.example.com` | `TXT` | `gitlab-pages-verification-code=<code>` |

### Step 4: Verify Domain

1. Navigate to **Deploy > Pages**
2. Select **Edit** (pencil icon) next to domain
3. Select **Retry verification**

**Notes**:
- DNS propagation can take up to 24 hours
- Keep verification record in place (domain is periodically re-verified)
- Unverified domains are removed after 7 days on GitLab.com

## GitLab.com IP Addresses

| Type | Address |
|------|---------|
| IPv4 | `35.185.44.232` |
| IPv6 | `2600:1901:0:7b8a::` |

For self-managed instances, contact your system administrator.

## DNS Provider Notes

### Cloudflare

Cloudflare auto-appends domain to Name field. Enter only:
- Root: `_gitlab-pages-verification-code`
- Subdomain: `_gitlab-pages-verification-code.subdomain`

### Redirect www to Root with Cloudflare

1. Add A/AAAA record for `domain.com` → GitLab Pages IP
2. Add TXT record for verification
3. Verify domain in GitLab
4. Add CNAME: `www` → `domain.com`
5. Create Page Rule: `www.domain.com` → `domain.com` (301 redirect)

## Multiple Domain Aliases

You can add multiple domains to the same project:
- Each domain requires separate verification
- All domains point to the same site
- Manage in **Settings > Pages**

## Verify DNS Configuration

Check TXT record:

```shell
dig _gitlab-pages-verification-code.example.com TXT
```

Expected output:

```plaintext
;; ANSWER SECTION:
_gitlab-pages-verification-code.example.com. 300 IN TXT "gitlab-pages-verification-code=<code>"
```

Check A record:

```shell
dig example.com A
```

## Common DNS Record Guidelines

- Do **not** use CNAME for root domain (use A/AAAA instead)
- Do **not** add trailing path to CNAME targets (use `namespace.gitlab.io` not `namespace.gitlab.io/project`)
- Do **not** add trailing dot unless DNS provider requires it
- CNAME should point to `namespace.gitlab.io` (your namespace, not the project path)

## IP Address History

GitLab.com Pages IP addresses have changed:
- Before 2017: Various IPs
- 2017: Changed (see [announcement](https://about.gitlab.com/releases/2017/03/06/we-are-changing-the-ip-of-gitlab-pages-on-gitlab-com/))
- 2018: Changed from `52.167.214.135` to `35.185.44.232`
- 2023: IPv6 support added (`2600:1901:0:7b8a::`)

## Delete Custom Domain

1. Navigate to **Deploy > Pages**
2. Select **Remove domain** (remove icon) next to domain
3. Confirm deletion

After deletion, the domain is no longer verified and cannot be used with Pages.
