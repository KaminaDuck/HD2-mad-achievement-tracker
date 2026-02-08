# GitLab Pages Default Domain Names and URLs

> Source: https://docs.gitlab.com/user/project/pages/getting_started_part_one/

## Availability

- **Tiers**: Free, Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed, GitLab Dedicated

## Domain Name Structure

GitLab Pages provides default domain names based on your namespace and project name.

### GitLab.com Domain

- Wildcard domain: `*.gitlab.io`
- Your namespace becomes a subdomain

### Self-Managed Instances

Replace `gitlab.io` with your instance's Pages domain (ask your sysadmin).

## Standard Domain URLs

| Type | Project Path | Website URL |
|------|--------------|-------------|
| User pages | `username/username.gitlab.io` | `https://username.gitlab.io` |
| Group pages | `groupname/groupname.gitlab.io` | `https://groupname.gitlab.io` |
| Project (user) | `username/my-website` | `https://username.gitlab.io/my-website` |
| Project (group) | `groupname/webshop` | `https://groupname.gitlab.io/webshop` |
| Project (subgroup) | `groupname/docs/product-manual` | `https://groupname.gitlab.io/docs/product-manual` |

## Unique Domain URLs

When **Use unique domain** is enabled (default since GitLab 15.11):

| Type | Project Path | Website URL |
|------|--------------|-------------|
| User pages | `username/username.gitlab.io` | `https://username-gitlab-io-abc123.gitlab.io` |
| Group pages | `groupname/groupname.gitlab.io` | `https://groupname-gitlab-io-abc123.gitlab.io` |
| Project (user) | `username/my-website` | `https://my-website-abc123.gitlab.io` |
| Project (group) | `groupname/webshop` | `https://webshop-abc123.gitlab.io` |
| Project (subgroup) | `groupname/docs/product-manual` | `https://product-manual-abc123.gitlab.io` |

The `abc123` is a unique 6-character ID (e.g., `f85695`).

## URL Examples

### Project Website

- **Project**: `john/blog` at `https://gitlab.com/john/blog/`
- **Pages URL**: `https://john.gitlab.io/blog/`

### Group Website

- **Project**: `websites/blog` at `https://gitlab.com/websites/blog/`
- **Pages URL**: `https://websites.gitlab.io/blog/`

### Subgroup Project

- **Project**: `engineering/docs/workflows` at `https://gitlab.com/engineering/docs/workflows/`
- **Pages URL**: `https://engineering.gitlab.io/docs/workflows`

### User/Group Pages (Root)

To publish at the root domain:

- **Project name must match**: `username.gitlab.io` or `groupname.gitlab.io`
- **Result**: Published at `https://username.gitlab.io` (no path)

## Base URL Configuration

### Why Base URL Matters

Static site generators expect sites at domain root (`example.com`), not subdirectories (`example.com/project`). For project pages, configure the base URL.

### Jekyll

In `_config.yml`:

```yaml
# For project pages
baseurl: "/project-name"

# For user/group pages
baseurl: ""
```

### Hugo

In `config.toml`:

```toml
# For project pages
baseURL = "https://namespace.gitlab.io/project-name/"

# For user/group pages
baseURL = "https://namespace.gitlab.io/"
```

### Plain HTML

No base URL configuration needed for plain HTML sites.

### Forked Examples

If you fork a GitLab Pages example project, the base URL is pre-configured for project pages. Change it if converting to user/group pages.

## Subdomains of Subdomains

### HTTPS Limitation

When using the top-level domain (`*.gitlab.io`), HTTPS doesn't work with subdomains of subdomains.

**Example**: If namespace is `foo.bar`, the domain `foo.bar.gitlab.io` will NOT work with HTTPS due to [HTTP Over TLS protocol](https://www.rfc-editor.org/rfc/rfc2818#section-3.1) limitations.

**Workaround**: HTTP works as long as you don't redirect to HTTPS.

## Custom Domains

For custom domain setup, see:
- [Custom domains documentation](https://docs.gitlab.com/user/project/pages/custom_domains_ssl_tls_certification/)
