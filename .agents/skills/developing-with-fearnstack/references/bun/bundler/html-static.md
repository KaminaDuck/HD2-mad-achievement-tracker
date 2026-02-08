---
title: "Bun HTML & Static Sites"
description: "Build static sites, SPAs, and multi-page apps with zero-config HTML bundling"
type: "api-reference"
tags: ["bun", "bundler", "html", "static-sites", "spa", "mpa", "css", "tailwind"]
category: "typescript"
subcategory: "bundler"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun HTML & Static Sites Documentation"
    url: "https://bun.sh/docs/bundler/html-static"
related:
  - "../README.md"
  - "./overview.md"
  - "./executables.md"
author: "unknown"
contributors: []
---

# Bun HTML & Static Sites

Bun's bundler has first-class support for HTML. Build static sites, landing pages, and web applications with zero configuration. ([Bun Docs][1])

## Basic Usage

```html
<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="./styles.css" />
    <script src="./app.ts" type="module"></script>
  </head>
  <body>
    <img src="./logo.png" />
  </body>
</html>
```

Start dev server:

```bash
bun ./index.html
```

Output:

```
Bun v1.3.3
ready in 6.62ms
→ http://localhost:3000/
Press h + Enter to show shortcuts
```

## Features

- **Automatic Bundling** - Bundles HTML, JavaScript, and CSS
- **TypeScript & JSX** - Out of the box support
- **CSS Bundling** - Bundles `<link>` tags and `@import` statements
- **Asset Management** - Automatic copying & hashing of images
- **ESM & CommonJS** - Both module formats supported
- **Plugins** - TailwindCSS and more

## Single Page Apps (SPA)

Single `.html` file becomes fallback for all routes:

```bash
bun index.html
```

All routes like `/about`, `/users/123` serve the same HTML for client-side routing.

## Multi-Page Apps (MPA)

Multiple HTML entrypoints:

```bash
bun ./index.html ./about.html
```

Output:

```
Routes:
  / ./index.html
  /about ./about.html
```

### Glob Patterns

```bash
bun ./**/*.html
```

### Path Normalization

Base path chosen from longest common prefix:

```bash
bun ./index.html ./about/index.html ./about/foo/index.html
```

```
Routes:
  / ./index.html
  /about ./about/index.html
  /about/foo ./about/foo/index.html
```

## CSS

### CSS Bundler

```css
/* styles.css */
@import "./abc.css";

.container {
  background-color: blue;
}
```

### Local Assets in CSS

```css
body {
  background-image: url("./logo.png");
}
```

Assets are copied and hashed:

```css
body {
  background-image: url("./logo-[ABC123].png");
}
```

### Importing CSS in JavaScript

```typescript
import "./styles.css";
import "./more-styles.css";
```

Generates `./app.css` in the output directory.

## Tailwind CSS

Install plugin:

```bash
bun install --dev bun-plugin-tailwind
```

Configure `bunfig.toml`:

```toml
[serve.static]
plugins = ["bun-plugin-tailwind"]
```

Reference TailwindCSS:

```html
<!-- In HTML -->
<link rel="stylesheet" href="tailwindcss" />
```

```css
/* In CSS */
@import "tailwindcss";
```

```typescript
// In JavaScript
import "tailwindcss";
```

## Environment Variables

### Dev Server

Configure in `bunfig.toml`:

```toml
[serve.static]
env = "PUBLIC_*"  # only inline env vars starting with PUBLIC_
# env = "inline"  # inline all environment variables
# env = "disable" # disable env var replacement (default)
```

### Production Build

```bash
# Inline all
bun build ./index.html --outdir=dist --env=inline

# Only prefix
bun build ./index.html --outdir=dist --env=PUBLIC_*
```

JavaScript API:

```typescript
await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  env: "PUBLIC_*",
});
```

## Console Logs in Terminal

Stream browser console logs to terminal:

```bash
bun ./index.html --console
```

## Keyboard Shortcuts

While server is running:

- `o + Enter` - Open in browser
- `c + Enter` - Clear console
- `q + Enter` (or `Ctrl+C`) - Quit server

## Build for Production

### CLI

```bash
bun build ./index.html --minify --outdir=dist
```

### JavaScript API

```typescript
await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  minify: true,
});
```

### Watch Mode

```bash
bun build --watch
```

## Plugin API

Use `HTMLRewriter` for HTML preprocessing:

```typescript
await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  minify: true,

  plugins: [
    {
      name: "lowercase-html-plugin",
      setup({ onLoad }) {
        const rewriter = new HTMLRewriter().on("*", {
          element(element) {
            element.tagName = element.tagName.toLowerCase();
          },
        });

        onLoad({ filter: /\.html$/ }, async (args) => {
          const html = await Bun.file(args.path).text();
          return {
            contents: rewriter.transform(html),
            loader: "html",
          };
        });
      },
    },
  ],
});
```

## What Gets Processed

- **Scripts** (`<script src>`) - JavaScript/TypeScript/JSX bundled
- **Stylesheets** (`<link rel="stylesheet">`) - CSS parsed & bundled
- **Images** (`<img>`, `<picture>`) - Copied and hashed
- **Media** (`<video>`, `<audio>`, `<source>`) - Copied and hashed
- **Links** (`<link href>`) - Rewritten to new paths with hashes

## Adding a Backend

Use routes option in `Bun.serve`:

```typescript
import index from "./index.html";

Bun.serve({
  routes: {
    "/": index,
    "/api/data": () => Response.json({ hello: "world" }),
  },
});
```

---

[1]: https://bun.sh/docs/bundler/html-static "Bun HTML & Static Sites Documentation"
