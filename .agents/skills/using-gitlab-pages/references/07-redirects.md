# GitLab Pages Redirects

> Source: https://docs.gitlab.com/user/project/pages/redirects/

## Availability

- **Tiers**: Free, Premium, Ultimate
- **Offerings**: GitLab.com, GitLab Self-Managed, GitLab Dedicated

## Overview

Configure URL redirects using a `_redirects` file with [Netlify-style syntax](https://docs.netlify.com/routing/redirects/#syntax-for-the-redirects-file).

## Create Redirects

Create a `_redirects` file in the `public/` directory of your Pages site.

### Basic Syntax

```plaintext
/from-path /to-path [status-code]
```

### Rules

- All paths must start with `/`
- Default status code is `301` if not specified
- File size limit: 64 KB (default)
- Maximum rules: 1,000 (default)

## HTTP Status Codes

| Code | Type | Description |
|------|------|-------------|
| `301` | Permanent redirect | Browser caches redirect |
| `302` | Temporary redirect | Browser doesn't cache |
| `200` | Rewrite | Serve content from `to` path, URL unchanged |

## Feature Support

| Feature | Supported | Example |
|---------|-----------|---------|
| Redirects (301, 302) | Yes | `/old /new 302` |
| Rewrites (200) | Yes | `/* / 200` |
| Splats | Yes | `/blog/* /news/:splat` |
| Placeholders | Yes | `/:year/:slug /blog-:year-:slug.html` |
| Domain-level redirects | Yes | `http://old.com/* https://new.com/:splat 301` |
| Rewrites (other than 200) | No | `/en/* /en/404.html 404` |
| Query parameters | No | `/store id=:id /blog/:id 301` |
| Force/shadowing | No | `/app/ /app/index.html 200!` |
| Country/language redirect | No | `/ /anz 302 Country=au,nz` |
| Role-based redirect | No | `/admin/* 200! Role=admin` |

## Basic Redirects

```plaintext
# 301 permanent redirect (default)
/old/page.html /new/page.html

# Explicit 301
/old/file.html /new/file.html 301

# 302 temporary redirect
/old/another.html /new/another.html 302
```

## Rewrites

Serve content from a different path without changing the URL:

```plaintext
/old/file.html /new/file.html 200
```

## Splats (Wildcards)

Match anything with `*`:

```plaintext
# Match anything after /old/
/old/* /new/file.html 200
```

### Splat Placeholders

Inject matched content using `:splat`:

```plaintext
/old/* /new/:splat 200
```

- Request to `/old/file.html` serves `/new/file.html`
- Request to `/old/a/b/c` serves `/new/a/b/c`

### Splat Behavior

- Splats are "greedy" (match as much as possible)
- `/old/*/file` → `/new/:splat/file` redirects `/old/a/b/c/file` to `/new/a/b/c/file`
- Splats match empty strings: `/old/file` → `/new/file`

## Placeholders

Named segments with `:name`:

```plaintext
/news/:year/:month/:date/:slug /blog/:year-:month-:date-:slug 200
```

- Request to `/news/2021/08/12/post` serves `/blog/2021-08-12-post`

### Placeholder vs Splat

- **Placeholders**: Match single path segment (between `/`)
- **Splats**: Match multiple segments, including `/`

Placeholders don't match empty strings:
```plaintext
/old/:path /new/:path  # Does NOT match /old/file
```

## Single Page Application (SPA)

Rewrite all requests to `index.html`:

```plaintext
/* /index.html 200
```

### With Parallel Deployments

Include path prefix:

```plaintext
/project/base/<prefix>/* /project/base/<prefix>/index.html 200
```

## Domain-Level Redirects

> Introduced in GitLab 16.8, generally available in GitLab 17.4

Redirect between domains:

```plaintext
# From full URL
http://blog.example.com/file.html https://www.example.com/blog/file.html 301

# From path to full URL
/file.html https://www.example.com/blog/file.html 301

# With splats
http://blog.example.com/* https://www.example.com/blog/:splat 301
```

Supported status codes: `301`, `302` (not `200`)

## Files Override Redirects

Physical files take priority over redirect rules:

```plaintext
# If hello.html exists, this redirect is IGNORED
/hello.html /world.html 302
```

GitLab does not support Netlify's force option (`!`) to override this behavior.

## Project Path Prefix

For default domain (`namespace.gitlab.io/project`), prefix all rules:

```plaintext
/project-slug/old.html /project-slug/new.html 302
```

For custom domains, no prefix needed:

```plaintext
/old.html /new.html 302
```

## Debug Redirect Rules

Visit `[your-pages-url]/_redirects` to see rule validation:

```plaintext
11 rules
rule 1: valid
rule 2: valid
rule 3: error: splats are not supported
rule 4: valid
rule 5: error: placeholders are not supported
```

## Differences from Netlify

### URLs Must Start with Forward Slash

```plaintext
# Invalid in GitLab (valid in Netlify)
*/path /new/path 200

# Valid in both
/old/path /new/path 200
```

### Placeholder Population

Given `/old /new/:placeholder` and request to `/old`:
- **Netlify**: Redirects to `/new/:placeholder` (literal)
- **GitLab**: Redirects to `/new/` (empty placeholder)
