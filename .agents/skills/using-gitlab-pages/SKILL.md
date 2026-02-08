---
name: deploying-with-gitlab-pages
description: Deploys static websites using GitLab Pages with CI/CD pipelines. Use when setting up GitLab Pages, configuring custom domains, SSL certificates, or troubleshooting Pages deployments.
---

# Deploying Static Sites with GitLab Pages

GitLab Pages publishes static websites directly from a repository in GitLab. This skill covers deployment workflows, domain configuration, SSL/TLS setup, and advanced features.

## Overview

GitLab Pages websites:
- Deploy automatically with GitLab CI/CD pipelines
- Support any static site generator (Hugo, Jekyll, Gatsby) or plain HTML/CSS/JS
- Run on GitLab-provided infrastructure at no additional cost
- Connect with custom domains and SSL/TLS certificates
- Control access through built-in authentication
- Available on Free, Premium, and Ultimate tiers

> Source: [GitLab Pages Overview](https://docs.gitlab.com/user/project/pages/)

## Quick Start Workflow

### Step 1: Create a Pages Job

Add a job with `pages: true` to your `.gitlab-ci.yml`:

```yaml
deploy-pages:
  stage: deploy
  script:
    - npm run build
  pages: true  # Publishes the default public/ directory
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### Step 2: Configure Output Directory

By default, Pages publishes from `public/`. To use a different folder:

```yaml
deploy-pages:
  script:
    - npm run build
  pages:
    publish: dist  # Use 'dist' instead of 'public'
```

### Step 3: Access Your Site

Your site is available at:
- **Project pages**: `https://namespace.gitlab.io/project-name`
- **User/Group pages**: `https://namespace.gitlab.io`

With unique domains enabled (default since GitLab 15.11):
- `https://project-name-abc123.gitlab.io`

> Source: [GitLab Pages default domain names](https://docs.gitlab.com/user/project/pages/getting_started_part_one/)

## Domain Configuration

### Default Domain Structure

| Type | URL Pattern |
|------|-------------|
| User pages | `username.gitlab.io` |
| Group pages | `groupname.gitlab.io` |
| Project pages | `namespace.gitlab.io/project` |
| Subgroup project | `namespace.gitlab.io/subgroup/project` |

### Base URL Configuration

For project sites, configure your SSG's base URL:

```yaml
# Jekyll _config.yml
baseurl: "/project-name"

# Hugo config.toml
baseURL = "https://namespace.gitlab.io/project-name/"
```

> Source: [URLs and base URLs](https://docs.gitlab.com/user/project/pages/getting_started_part_one/#urls-and-base-urls)

## CI/CD Configuration Examples

### Plain HTML

```yaml
deploy-pages:
  script:
    - mkdir .public
    - cp -r * .public
    - mv .public public
  pages: true
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### Jekyll

```yaml
deploy-pages:
  image: ruby:3.2
  script:
    - gem install bundler
    - bundle install
    - bundle exec jekyll build -d public
  pages: true
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### Hugo

```yaml
deploy-pages:
  image: registry.gitlab.com/pages/hugo:latest
  script:
    - hugo --destination public
  pages: true
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### Node.js (Vite/React/Vue)

```yaml
deploy-pages:
  image: node:20
  script:
    - npm ci
    - npm run build
  pages:
    publish: dist
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

> Source: [GitLab Pages settings](https://docs.gitlab.com/user/project/pages/introduction/)

## Custom Domains

### DNS Records for Root Domain

For `example.com`:

| Record | Name | Value |
|--------|------|-------|
| A | `example.com` | `35.185.44.232` |
| AAAA | `example.com` | `2600:1901:0:7b8a::` |
| TXT | `_gitlab-pages-verification-code.example.com` | `gitlab-pages-verification-code=<code>` |

### DNS Records for Subdomain

For `www.example.com`:

| Record | Name | Value |
|--------|------|-------|
| CNAME | `www` | `namespace.gitlab.io` |
| TXT | `_gitlab-pages-verification-code.www.example.com` | `gitlab-pages-verification-code=<code>` |

### Setup Steps

1. Navigate to **Deploy > Pages** in your project
2. Select **New Domain**
3. Enter domain name and get verification code
4. Add DNS records at your registrar
5. Return to GitLab and verify domain

> Source: [GitLab Pages custom domains](https://docs.gitlab.com/user/project/pages/custom_domains_ssl_tls_certification/)

## SSL/TLS Certificates

### Automatic Let's Encrypt (Recommended)

1. Add and verify your custom domain
2. Edit the domain in **Deploy > Pages**
3. Enable **Automatic certificate management using Let's Encrypt**
4. Save changes

Certificate issuance can take up to an hour. GitLab automatically renews certificates.

### Force HTTPS

1. Go to **Deploy > Pages**
2. Check **Force HTTPS (requires valid certificates)**
3. Save changes

> Source: [Let's Encrypt integration](https://docs.gitlab.com/user/project/pages/custom_domains_ssl_tls_certification/lets_encrypt_integration/)

## Access Control

Control who can view your Pages site:

| Project Visibility | Options |
|-------------------|---------|
| Private | Only project members, Everyone |
| Internal | Only project members, Everyone with access, Everyone |
| Public | Only project members, Everyone with access |

To configure:
1. Go to **Settings > General > Visibility**
2. Toggle **Pages** access control
3. Select visibility level
4. Save changes

> Source: [GitLab Pages access control](https://docs.gitlab.com/user/project/pages/pages_access_control/)

## URL Redirects

Create a `_redirects` file in your `public/` directory:

```plaintext
# 301 permanent redirect
/old-page.html /new-page.html 301

# 302 temporary redirect
/temp.html /current.html 302

# Splat (wildcard) redirect
/blog/* /news/:splat 301

# SPA rewrite
/* /index.html 200
```

### Supported Features

| Feature | Supported | Example |
|---------|-----------|---------|
| Redirects (301, 302) | Yes | `/old /new 301` |
| Rewrites (200) | Yes | `/* /index.html 200` |
| Splats | Yes | `/old/* /new/:splat` |
| Placeholders | Yes | `/:year/:slug /blog-:year-:slug.html` |
| Domain redirects | Yes | `http://old.com/* https://new.com/:splat 301` |

> Source: [GitLab Pages redirects](https://docs.gitlab.com/user/project/pages/redirects/)

## Parallel Deployments (Premium/Ultimate)

Deploy multiple versions simultaneously for review apps:

```yaml
deploy-pages-preview:
  script:
    - npm run build
  pages:
    path_prefix: "mr-$CI_MERGE_REQUEST_IID"
    expire_in: 1 week
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
```

Access at: `https://project-abc123.gitlab.io/mr-42/`

Features:
- Auto-cleanup when MR is merged/closed
- 24-hour default expiration
- Environment integration supported

> Source: [GitLab Pages parallel deployments](https://docs.gitlab.com/user/project/pages/parallel_deployments/)

## Compressed Assets

Serve pre-compressed files for faster loading:

```yaml
deploy-pages:
  script:
    - npm run build
    - find public -type f -regex '.*\.\(htm\|html\|js\|css\|svg\)$' -exec gzip -f -k {} \;
    - find public -type f -regex '.*\.\(htm\|html\|js\|css\|svg\)$' -exec brotli -f -k {} \;
  pages: true
```

Pages automatically serves `.br` or `.gz` versions when browsers support them.

> Source: [Serving compressed assets](https://docs.gitlab.com/user/project/pages/introduction/#serving-compressed-assets)

## Troubleshooting

### 404 Error on Site

1. Verify `public/index.html` exists in job artifacts
2. Check artifact contents in CI/CD job
3. Ensure `pages: true` is set in your job
4. For access-controlled sites, verify user has project access

### Custom Domain Not Working

1. Verify DNS records with `dig`:
   ```shell
   dig _gitlab-pages-verification-code.example.com TXT
   dig example.com A
   ```
2. Wait for DNS propagation (up to 24 hours)
3. Retry verification in GitLab

### Let's Encrypt Certificate Failing

1. Ensure site visibility is set to "Everyone"
2. Verify only one A/CNAME record exists for domain
3. Remove any AAAA records temporarily
4. Check CAA records include `letsencrypt.org`

### Media Not Playing on Safari

Add these variables for HTTP Range request support:

```yaml
deploy-pages:
  variables:
    FF_USE_FASTZIP: "true"
    ARTIFACT_COMPRESSION_LEVEL: "fastest"
  script:
    - npm run build
  pages: true
```

> Source: [GitLab Pages troubleshooting](https://docs.gitlab.com/user/project/pages/introduction/#troubleshooting)

## Examples

Ready-to-use `.gitlab-ci.yml` configurations in `./examples/`:

| Example | Use Case |
|---------|----------|
| `01-plain-html.yml` | Static HTML/CSS/JS files |
| `02-mkdocs.yml` | MkDocs documentation site |
| `03-hugo.yml` | Hugo static site/blog |
| `04-vite-spa.yml` | Vite SPA (React/Vue/Svelte) |
| `05-review-apps.yml` | Parallel deployments for MR previews |
| `06-jekyll.yml` | Jekyll blog/documentation |
| `07-redirects-file.md` | Example `_redirects` configurations |
| `08-custom-domain.yml` | Custom domain with SSL setup |

## Reference Documentation

Detailed documentation in `./references/`:

| Reference | Topic |
|-----------|-------|
| `00-sitemap.md` | Complete documentation sitemap |
| `01-overview.md` | GitLab Pages overview |
| `02-domains-and-urls.md` | Default domain names and URLs |
| `03-ci-cd-configuration.md` | CI/CD configuration details |
| `04-custom-domains.md` | Custom domain setup |
| `05-ssl-tls-certificates.md` | SSL/TLS configuration |
| `06-access-control.md` | Access control settings |
| `07-redirects.md` | URL redirects |
| `08-parallel-deployments.md` | Parallel deployments |
| `09-framework-configs.md` | Framework-specific configurations |
