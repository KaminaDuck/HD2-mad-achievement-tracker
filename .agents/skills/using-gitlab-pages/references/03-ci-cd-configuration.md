# GitLab Pages CI/CD Configuration

> Source: https://docs.gitlab.com/user/project/pages/introduction/

## Availability

- **Tiers**: Free, Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed, GitLab Dedicated

## Requirements

1. A `.gitlab-ci.yml` file in the repository root
2. A job with `pages: true` property
3. GitLab Runner enabled for the project

## Basic Configuration

### Minimal Pages Job

```yaml
deploy-pages:
  stage: deploy
  script:
    - echo "Building site..."
  pages: true  # Publishes default public/ directory
  rules:
    - if: $CI_COMMIT_BRANCH == "main"
```

### Plain HTML Website

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

The `.public` workaround prevents `cp` from copying `public/` into itself.

## Custom Output Directory

### Using pages.publish

> Introduced in GitLab 16.1

```yaml
deploy-pages:
  script:
    - npm run build
  pages:
    publish: dist  # Use 'dist' instead of 'public'
```

The `pages.publish` path is automatically appended to `artifacts:paths`.

### With Variables

> Introduced in GitLab 17.9

```yaml
deploy-pages:
  variables:
    OUTPUT_DIR: "dist"
  script:
    - npm run build
  pages:
    publish: $OUTPUT_DIR
```

## Branch-Specific Deployments

### Deploy from Specific Branch

```yaml
deploy-pages:
  script:
    - jekyll build -d public/
  pages: true
  rules:
    - if: '$CI_COMMIT_REF_NAME == "pages"'
```

### Using Orphan Branch

Create a dedicated `pages` branch:

```shell
git checkout --orphan pages
```

This creates a branch with no commit history, useful for separating Pages content from main codebase.

## Static Site Generator Examples

### Jekyll

```yaml
deploy-pages:
  image: ruby:2.6
  script:
    - gem install jekyll
    - jekyll build -d public/
  pages: true
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
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

### Node.js (Generic)

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

## Serving Compressed Assets

Pre-compress files for faster delivery:

```yaml
deploy-pages:
  script:
    - npm run build
    - find public -type f -regex '.*\.\(htm\|html\|xml\|txt\|text\|js\|css\|svg\)$' -exec gzip -f -k {} \;
    - find public -type f -regex '.*\.\(htm\|html\|xml\|txt\|text\|js\|css\|svg\)$' -exec brotli -f -k {} \;
  pages: true
```

Pages automatically serves `.br` or `.gz` versions when browsers support them.

### Expected Structure

```plaintext
public/
├── index.html
├── index.html.br
├── index.html.gz
├── css/
│   ├── main.css
│   ├── main.css.br
│   └── main.css.gz
└── js/
    ├── main.js
    ├── main.js.br
    └── main.js.gz
```

## Custom Error Pages

Create custom 403 and 404 error pages:

```plaintext
public/
├── 403.html
├── 404.html
└── index.html
```

### 404 Page Resolution

| Site Type | URL Attempt | Pages Tries |
|-----------|-------------|-------------|
| Project (`/project-slug/`) | `/project-slug/missing` | `/project-slug/404.html`, then `/404.html` |
| User/Group (`/`) | `/missing` | `/404.html` |
| Custom domain | `/missing` | `/404.html` only |

## URL Resolution

Pages resolves ambiguous URLs automatically:

| URL Path | HTTP Response |
|----------|---------------|
| `/` | `200 OK`: `public/index.html` |
| `/index.html` | `200 OK`: `public/index.html` |
| `/index` | `200 OK`: `public/index.html` |
| `/data` | `302 Found`: redirecting to `/data/` |
| `/data/` | `200 OK`: `public/data/index.html` |
| `/data.html` | `200 OK`: `public/data.html` |

When both `public/data/index.html` and `public/data.html` exist, the directory's `index.html` takes priority for `/data` and `/data/`.

## Safari Media Playback

For media to play on Safari, enable HTTP Range requests:

```yaml
deploy-pages:
  variables:
    FF_USE_FASTZIP: "true"
    ARTIFACT_COMPRESSION_LEVEL: "fastest"
  script:
    - npm run build
  pages: true
```

## Expiring Deployments

> Introduced in GitLab 17.4

```yaml
deploy-pages:
  script:
    - npm run build
  pages:
    expire_in: 1 week
```

- Expired deployments are stopped by cron job (every 10 minutes)
- Stopped deployments can be recovered via **Deploy > Pages > Include stopped deployments**

## Disabling Pages for a Job Named "pages"

```yaml
pages:
  pages: false  # No deployment triggered
```
