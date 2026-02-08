# Example _redirects File

Place this file in your `public/` directory (or output directory) to configure URL redirects.

## Basic Redirects

```plaintext
# _redirects

# Permanent redirects (301)
/old-page /new-page 301
/blog/old-post /blog/new-post 301

# Temporary redirects (302)
/maintenance /temp-page 302

# Default is 301 if no status specified
/docs /documentation
```

## Single Page Application (SPA)

```plaintext
# _redirects

# Serve index.html for all routes (client-side routing)
/* /index.html 200
```

## With Project Path Prefix

For project pages at `namespace.gitlab.io/project/`:

```plaintext
# _redirects

# Include project path in all rules
/project/old /project/new 301
/project/* /project/index.html 200
```

## Blog URL Restructure

```plaintext
# _redirects

# Redirect old blog structure to new
/blog/:year/:month/:slug /posts/:slug 301

# Redirect category pages
/category/* /tags/:splat 301
```

## Domain Migration

```plaintext
# _redirects

# Redirect old domain to new (domain-level redirects)
http://old-docs.example.com/* https://docs.example.com/:splat 301
http://blog.example.com/* https://example.com/blog/:splat 301
```

## Combined Example

```plaintext
# _redirects

# Renamed pages
/about-us /about 301
/contact-us /contact 301

# Removed sections (redirect to home)
/legacy/* / 301

# API docs moved
/api/v1/* /docs/api/:splat 301

# SPA fallback (must be last)
/* /index.html 200
```

## For Review Apps (Parallel Deployments)

```plaintext
# _redirects

# Primary deployment redirects
/old /new 301

# Parallel deployment redirects (catch prefixed paths)
/*/old /:splat/new 301
```

## Debugging

Visit `https://your-site/_redirects` to see validation status:

```plaintext
5 rules
rule 1: valid
rule 2: valid
rule 3: error: invalid status code
rule 4: valid
rule 5: valid
```
