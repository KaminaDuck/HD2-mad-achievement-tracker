---
title: "Bun Single-File Executables"
description: "Compile TypeScript and JavaScript into standalone binaries with cross-compilation support"
type: "api-reference"
tags: ["bun", "bundler", "compile", "executable", "binary", "cross-compile", "deploy"]
category: "typescript"
subcategory: "bundler"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Executables Documentation"
    url: "https://bun.sh/docs/bundler/executables"
related:
  - "../README.md"
  - "./overview.md"
  - "./html-static.md"
author: "unknown"
contributors: []
---

# Bun Single-File Executables

Bun's bundler can generate standalone binaries from TypeScript or JavaScript files using `--compile`. ([Bun Docs][1])

## Basic Usage

### CLI

```bash
bun build ./cli.ts --compile --outfile mycli
```

### JavaScript API

```typescript
await Bun.build({
  entrypoints: ["./cli.ts"],
  compile: {
    outfile: "./mycli",
  },
});
```

Run the executable:

```bash
./mycli
# Hello world!
```

All imports and packages are bundled, along with the Bun runtime.

## Cross-Compilation

Compile for different platforms using `--target`:

### Linux x64

```bash
bun build --compile --target=bun-linux-x64 ./index.ts --outfile myapp

# For older CPUs (pre-2013)
bun build --compile --target=bun-linux-x64-baseline ./index.ts --outfile myapp
```

### Linux ARM64

```bash
bun build --compile --target=bun-linux-arm64 ./index.ts --outfile myapp
```

### Windows x64

```bash
bun build --compile --target=bun-windows-x64 ./path/to/my/app.ts --outfile myapp
# .exe extension added automatically
```

### macOS ARM64

```bash
bun build --compile --target=bun-darwin-arm64 ./path/to/my/app.ts --outfile myapp
```

### macOS x64

```bash
bun build --compile --target=bun-darwin-x64 ./path/to/my/app.ts --outfile myapp
```

### Supported Targets

| Target | OS | Arch | Modern | Baseline |
|--------|-----|------|--------|----------|
| `bun-linux-x64` | Linux | x64 | ✅ | ✅ |
| `bun-linux-arm64` | Linux | arm64 | ✅ | N/A |
| `bun-windows-x64` | Windows | x64 | ✅ | ✅ |
| `bun-darwin-x64` | macOS | x64 | ✅ | ✅ |
| `bun-darwin-arm64` | macOS | arm64 | ✅ | N/A |
| `bun-linux-x64-musl` | Linux | x64 | ✅ | ✅ |
| `bun-linux-arm64-musl` | Linux | arm64 | ✅ | N/A |

Use `-baseline` for older CPUs without AVX2 instructions.

## Production Deployment

Recommended flags for production:

```bash
bun build --compile --minify --sourcemap ./path/to/my/app.ts --outfile myapp
```

### Bytecode Compilation

For faster startup:

```bash
bun build --compile --minify --sourcemap --bytecode ./path/to/my/app.ts --outfile myapp
```

JavaScript API:

```typescript
await Bun.build({
  entrypoints: ["./path/to/my/app.ts"],
  compile: {
    outfile: "./myapp",
  },
  minify: true,
  sourcemap: "linked",
  bytecode: true,
});
```

Bytecode compilation moves parsing overhead from runtime to build time.

## Build-Time Constants

Inject constants with `--define`:

```bash
bun build --compile --define BUILD_VERSION='"1.2.3"' --define BUILD_TIME='"2024-01-15T10:30:00Z"' src/cli.ts --outfile mycli
```

JavaScript API:

```typescript
await Bun.build({
  entrypoints: ["./src/cli.ts"],
  compile: {
    outfile: "./mycli",
  },
  define: {
    BUILD_VERSION: JSON.stringify("1.2.3"),
    BUILD_TIME: JSON.stringify("2024-01-15T10:30:00Z"),
  },
});
```

## Embedding Runtime Arguments

```bash
bun build --compile --compile-exec-argv="--smol --user-agent=MyBot" ./app.ts --outfile myapp
```

Access via `process.execArgv`:

```typescript
console.log(process.execArgv); // ["--smol", "--user-agent=MyBot"]
```

## Config Loading

By default:
- `tsconfig.json` and `package.json` - **disabled**
- `.env` and `bunfig.toml` - **enabled**

### Enable Config Loading

```bash
bun build --compile --compile-autoload-tsconfig ./app.ts --outfile myapp
bun build --compile --compile-autoload-package-json ./app.ts --outfile myapp
```

### Disable Config Loading

```bash
bun build --compile --no-compile-autoload-dotenv ./app.ts --outfile myapp
bun build --compile --no-compile-autoload-bunfig ./app.ts --outfile myapp
```

## Full-Stack Executables

Bundle server and client code together:

```typescript
// server.ts
import { serve } from "bun";
import index from "./index.html";

const server = serve({
  routes: {
    "/": index,
    "/api/hello": { GET: () => Response.json({ message: "Hello" }) },
  },
});

console.log(`Server running at http://localhost:${server.port}`);
```

Build:

```bash
bun build --compile ./server.ts --outfile myapp
```

The result includes server code, Bun runtime, and all frontend assets.

## Workers

Add worker entrypoints:

```bash
bun build --compile ./index.ts ./my-worker.ts --outfile myapp
```

Reference in code:

```typescript
new Worker("./my-worker.ts");
new Worker(new URL("./my-worker.ts", import.meta.url));
```

## Embedding Files

Use `with { type: "file" }` import attribute:

```typescript
import configPath from "./config.json" with { type: "file" };

const config = await Bun.file(configPath).json();
```

### Embedding Examples

```typescript
// JSON config
import configPath from "./config.json" with { type: "file" };
const config = await Bun.file(configPath).json();

// Templates
import templatePath from "./template.html" with { type: "file" };
const template = await Bun.file(templatePath).text();

// Binary files
import imagePath from "./logo.png" with { type: "file" };
const imageData = await Bun.file(imagePath).arrayBuffer();

// SQLite databases
import dbPath from "./data.db" with { type: "file" };
import { Database } from "bun:sqlite";
const db = new Database(dbPath);
```

### Embedding Directories

```bash
bun build --compile ./index.ts ./assets/* --outfile myapp
```

### Listing Embedded Files

```typescript
import { embeddedFiles } from "bun";

for (const file of embeddedFiles) {
  console.log(file.name, file.size);
}
```

## SQLite

```typescript
import db from "./my.db" with { type: "sqlite" };

console.log(db.query("select * from users LIMIT 1").get());
```

Database resolves relative to process working directory.

## Minification

```bash
bun build --compile --minify ./app.ts --outfile myapp
```

## Windows-Specific Flags

Set Windows executable metadata:

```bash
bun build --compile --windows-icon=./icon.ico ./app.ts --outfile myapp
```

## Code Signing on macOS

The executable can be signed using standard macOS code signing tools.

## Using Plugins

```typescript
await Bun.build({
  entrypoints: ["./app.ts"],
  compile: {
    outfile: "./myapp",
  },
  plugins: [
    {
      name: "my-plugin",
      setup(build) {
        // plugin logic
      },
    },
  ],
});
```

## Act as Bun CLI

Run executable as the `bun` CLI:

```bash
BUN_BE_BUN=1 ./such-bun install
```

With `BUN_BE_BUN=1`, the executable exposes all Bun CLI features.

---

[1]: https://bun.sh/docs/bundler/executables "Bun Executables Documentation"
