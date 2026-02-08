---
title: Bun Bundler
description: Bundling applications, creating executables, and static HTML
---

# Bun Bundler

Bun includes a native bundler for JavaScript and TypeScript applications. It's faster than traditional bundlers and integrates seamlessly with the Bun runtime.

## Basic Usage

```bash
# Bundle an entrypoint
bun build ./src/index.ts --outdir ./dist

# Multiple entrypoints
bun build ./src/index.ts ./src/worker.ts --outdir ./dist

# Watch mode
bun build ./src/index.ts --outdir ./dist --watch
```

## API Usage

```typescript
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
});

if (!result.success) {
  console.error("Build failed:", result.logs);
  process.exit(1);
}

console.log("Built:", result.outputs.map((o) => o.path));
```

## Output Configuration

### Target

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  target: "browser", // "browser" | "bun" | "node"
  outdir: "./dist",
});
```

| Target | Description |
|--------|-------------|
| `browser` | Web browsers (default) |
| `bun` | Bun runtime |
| `node` | Node.js runtime |

### Format

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  format: "esm", // "esm" | "cjs" | "iife"
  outdir: "./dist",
});
```

### Minification

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  minify: true, // Enable all minification

  // Or fine-grained control
  minify: {
    whitespace: true,
    identifiers: true,
    syntax: true,
  },
  outdir: "./dist",
});
```

### Source Maps

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  sourcemap: "external", // "none" | "inline" | "external"
  outdir: "./dist",
});
```

## Code Splitting

Automatic code splitting for shared code:

```typescript
await Bun.build({
  entrypoints: ["./src/app.ts", "./src/admin.ts"],
  splitting: true,
  outdir: "./dist",
});
```

## Tree Shaking

Dead code elimination is enabled by default:

```typescript
// utils.ts
export function used() {
  return "I'm included";
}

export function unused() {
  return "I'm removed";
}

// app.ts
import { used } from "./utils";
console.log(used()); // Only 'used' is bundled
```

## External Dependencies

Exclude packages from bundling:

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  external: ["react", "react-dom", "@tanstack/*"],
  outdir: "./dist",
});
```

## Environment Variables

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
    "process.env.API_URL": JSON.stringify("https://api.example.com"),
  },
  outdir: "./dist",
});
```

In your code:

```typescript
// This becomes a static string at build time
if (process.env.NODE_ENV === "production") {
  // Production code
}
```

## Loaders

Handle different file types:

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  loader: {
    ".svg": "file",      // Copy to outdir, import as path
    ".css": "css",       // CSS modules
    ".json": "json",     // Parse as JSON
    ".txt": "text",      // Import as string
    ".wasm": "file",     // WebAssembly
  },
  outdir: "./dist",
});
```

## Plugins

Extend the bundler with plugins:

```typescript
import type { BunPlugin } from "bun";

const myPlugin: BunPlugin = {
  name: "my-plugin",
  setup(build) {
    // Handle custom file types
    build.onLoad({ filter: /\.mdx$/ }, async (args) => {
      const content = await Bun.file(args.path).text();
      const compiled = await compileMdx(content);

      return {
        contents: compiled,
        loader: "js",
      };
    });
  },
};

await Bun.build({
  entrypoints: ["./src/index.ts"],
  plugins: [myPlugin],
  outdir: "./dist",
});
```

## Static HTML

Build static sites with HTML entry points:

```bash
bun build ./src/index.html --outdir ./dist
```

```html
<!-- src/index.html -->
<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./app.tsx"></script>
  </body>
</html>
```

Bun will:
- Bundle all referenced scripts
- Process CSS
- Copy static assets
- Output optimized HTML

## Single-File Executables

Create standalone executables:

```bash
# Compile to executable
bun build ./src/cli.ts --compile --outfile ./myapp

# Run without Bun installed
./myapp
```

### Cross-Compilation

```bash
# Build for different platforms
bun build --compile --target=bun-linux-x64 ./src/cli.ts
bun build --compile --target=bun-darwin-arm64 ./src/cli.ts
bun build --compile --target=bun-windows-x64 ./src/cli.ts
```

### Embedding Assets

```typescript
// Include files in the executable
const config = await Bun.file(import.meta.dir + "/config.json").text();
```

## React/JSX

JSX works out of the box:

```typescript
await Bun.build({
  entrypoints: ["./src/App.tsx"],
  target: "browser",
  outdir: "./dist",
});
```

Configure JSX in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

## TypeScript

TypeScript is bundled directly without transpilation step:

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts"],
  // TypeScript config from tsconfig.json is used automatically
  outdir: "./dist",
});
```

## CSS Bundling

```typescript
await Bun.build({
  entrypoints: ["./src/index.ts", "./src/styles.css"],
  outdir: "./dist",
});
```

CSS imports in TypeScript:

```typescript
import "./styles.css"; // Bundled
```

## Fearnstack Build Configuration

Typical Fearnstack project build:

```typescript
// build.ts
const result = await Bun.build({
  entrypoints: ["./src/client/main.tsx"],
  outdir: "./dist/client",
  target: "browser",
  splitting: true,
  minify: process.env.NODE_ENV === "production",
  sourcemap: process.env.NODE_ENV === "development" ? "external" : "none",
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    "process.env.API_URL": JSON.stringify(process.env.API_URL),
  },
  external: [],
});

if (!result.success) {
  console.error("Build failed:");
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log("Build complete!");
```

**Note:** For development, Fearnstack typically uses Vite for HMR. Bun bundler is used for production builds or CLI tools.

## Performance Tips

### Use External for Large Dependencies

```typescript
// Don't bundle React into every file
await Bun.build({
  entrypoints: ["./src/index.ts"],
  external: ["react", "react-dom"],
  outdir: "./dist",
});
```

### Enable Splitting

```typescript
// Shared code is extracted automatically
await Bun.build({
  entrypoints: ["./src/app.ts", "./src/admin.ts"],
  splitting: true,
  outdir: "./dist",
});
```

## Comparison with Other Bundlers

| Feature | Bun | esbuild | Vite | Webpack |
|---------|-----|---------|------|---------|
| Speed | Very fast | Very fast | Fast (dev) | Slow |
| Config | Minimal | Minimal | Moderate | Complex |
| HMR | No | No | Yes | Yes |
| Plugins | Yes | Yes | Yes | Yes |
| Code splitting | Yes | Yes | Yes | Yes |
| Single executable | Yes | No | No | No |

**Recommendation:** Use Vite for development (HMR support), Bun for production builds and CLI tools.

## Next Steps

- [Bun Testing](bun-testing.md) - Test framework
- [Bun Runtime](bun-runtime.md) - Runtime features
- [Bun Package Manager](bun-package-manager.md) - Dependencies
