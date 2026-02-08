---
title: "Bun Bundler"
description: "Fast native JavaScript and TypeScript bundler with plugins, code splitting, and multiple output formats"
type: "api-reference"
tags: ["bun", "bundler", "build", "transpiler", "esm", "cjs", "code-splitting"]
category: "typescript"
subcategory: "bundler"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Bundler Documentation"
    url: "https://bun.sh/docs/bundler"
related:
  - "../README.md"
  - "./html-static.md"
  - "./executables.md"
author: "unknown"
contributors: []
---

# Bun Bundler

Bun's fast native bundler via `bun build` CLI or `Bun.build()` JavaScript API. ([Bun Docs][1])

## At a Glance

- JS API: `await Bun.build({ entrypoints, outdir })`
- CLI: `bun build <entry> --outdir ./out`
- Watch: `--watch` for incremental rebuilds
- Targets: `--target browser|bun|node`
- Formats: `--format esm|cjs|iife`

## Basic Usage

### CLI

```bash
bun build ./index.tsx --outdir ./build
```

### JavaScript API

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./build",
});
```

## Why Bundle?

- **Reducing HTTP requests** - Combine hundreds of files into fewer bundles
- **Code transforms** - TypeScript, JSX, CSS modules to browser-ready code
- **Framework features** - File-system routing, server components, loaders
- **Full-stack apps** - Bundle server and client code together

## Watch Mode

```bash
bun build ./index.tsx --outdir ./out --watch
```

## Content Types

| Extensions | Details |
|------------|---------|
| `.js`, `.jsx`, `.ts`, `.tsx`, `.mts`, `.cts`, `.cjs`, `.mjs` | JavaScript/TypeScript with tree shaking |
| `.json`, `.jsonc` | Inlined as JavaScript objects |
| `.toml`, `.yaml`, `.yml` | Inlined as JavaScript objects |
| `.txt` | Inlined as strings |
| `.html` | Processed with all referenced assets bundled |
| `.css` | Bundled into single CSS file |

### Assets

Unrecognized extensions are copied to `outdir` with content hashes:

```typescript
// Input
import logo from "./logo.svg";
console.log(logo);

// Output
console.log("./logo-abc123.svg");
```

## API Reference

### entrypoints (required)

```typescript
await Bun.build({
  entrypoints: ["./index.ts"],
});
```

### outdir

```typescript
await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./out",
});
```

If omitted, bundled files are returned as `BuildArtifact` objects (Blobs with extra properties).

### target

Execution environment for the bundle:

```typescript
await Bun.build({
  entrypoints: ["./index.ts"],
  outdir: "./out",
  target: "browser", // default
});
```

| Target | Description |
|--------|-------------|
| `browser` | Default. Prioritizes `"browser"` export condition |
| `bun` | For Bun runtime. Adds `// @bun` pragma |
| `node` | For Node.js. Outputs `.mjs`, prioritizes `"node"` exports |

### format

Module format for generated bundles:

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  format: "esm", // default
});
```

| Format | Description |
|--------|-------------|
| `esm` | Default. ES Modules with top-level await, import.meta |
| `cjs` | CommonJS (experimental) |
| `iife` | Immediately Invoked Function Expression (experimental) |

### splitting

Enable code splitting for shared chunks:

```typescript
await Bun.build({
  entrypoints: ["./entry-a.ts", "./entry-b.ts"],
  outdir: "./out",
  splitting: true,
});
```

Shared code is extracted to `chunk-[hash].js` files.

### minify

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  minify: true,
});
```

CLI:

```bash
bun build ./index.tsx --outdir ./out --minify
```

### sourcemap

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  sourcemap: "linked", // or "inline", "external", "none"
});
```

### external

Exclude packages from bundling:

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  external: ["lodash", "react"],
});
```

### env

Inline environment variables:

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  env: "inline", // or "PUBLIC_*" for prefix matching
});
```

### define

Replace identifiers with constant expressions:

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
```

### plugins

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  plugins: [
    {
      name: "my-plugin",
      setup(build) {
        build.onLoad({ filter: /\.txt$/ }, async (args) => {
          const text = await Bun.file(args.path).text();
          return { contents: `export default ${JSON.stringify(text)}` };
        });
      },
    },
  ],
});
```

### jsx

Configure JSX transform:

```typescript
await Bun.build({
  entrypoints: ["./app.tsx"],
  outdir: "./out",
  jsx: {
    factory: "h",
    fragment: "Fragment",
    runtime: "classic", // or "automatic"
  },
});
```

### naming

Custom output file naming:

```typescript
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  naming: {
    entry: "[dir]/[name].[ext]",
    chunk: "[name]-[hash].[ext]",
    asset: "[name]-[hash].[ext]",
  },
});
```

## Outputs

```typescript
const result = await Bun.build({
  entrypoints: ["./index.ts"],
});

for (const output of result.outputs) {
  console.log(output.path);     // Absolute path
  console.log(output.kind);     // "entry-point" | "chunk" | "asset"
  await output.text();          // Read as string
  new Response(output);         // Serve directly
}
```

## CLI Reference

### General

```bash
bun build ./index.ts --outdir ./out
bun build ./index.ts --outfile ./out/bundle.js
bun build ./a.ts ./b.ts --outdir ./out  # Multiple entrypoints
```

### Targets and Formats

```bash
bun build ./index.ts --target browser  # Default
bun build ./index.ts --target bun
bun build ./index.ts --target node
bun build ./index.ts --format esm      # Default
bun build ./index.ts --format cjs
```

### Optimization

```bash
bun build ./index.ts --minify
bun build ./index.ts --sourcemap linked
bun build ./index.ts --splitting
```

### Externals

```bash
bun build ./index.ts --external lodash
bun build ./index.ts --packages external  # Externalize all packages
```

### Environment

```bash
bun build ./index.ts --env inline
bun build ./index.ts --env PUBLIC_*
bun build ./index.ts --define 'VERSION="1.0.0"'
```

---

[1]: https://bun.sh/docs/bundler "Bun Bundler Documentation"
