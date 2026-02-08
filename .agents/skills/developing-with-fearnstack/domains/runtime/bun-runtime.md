---
title: Bun Runtime
description: Bun runtime features - file I/O, globals, environment, shell, workers
---

# Bun Runtime

Bun is an all-in-one JavaScript/TypeScript runtime that powers Fearnstack. It's 4x faster than Node.js for process startup and includes a package manager, bundler, and test runner.

## Quick Start

```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Run TypeScript directly
bun run index.tsx

# Run package.json scripts
bun run dev

# Execute packages
bunx vite
```

## Global APIs

Bun exposes the `Bun` global with runtime utilities:

```typescript
// Version info
console.log(Bun.version); // "1.x.x"

// Generate UUIDs
const id = Bun.randomUUIDv7();

// Sleep
await Bun.sleep(1000); // 1 second

// Resolve paths
const path = Bun.resolveSync("./module", process.cwd());

// Hash data
const hash = Bun.hash("hello world");

// Password hashing (bcrypt)
const hashed = await Bun.password.hash("password");
const valid = await Bun.password.verify("password", hashed);
```

## File I/O

High-performance file operations:

### Reading Files

```typescript
// Get a file reference (lazy, no I/O yet)
const file = Bun.file("./data.json");

// Check if exists
const exists = await file.exists();

// Get metadata
console.log(file.size); // bytes
console.log(file.type); // MIME type

// Read content
const text = await file.text();
const json = await file.json();
const buffer = await file.arrayBuffer();
const bytes = await file.bytes();

// Stream for large files
const stream = file.stream();
```

### Writing Files

```typescript
// Write string
await Bun.write("./output.txt", "Hello, World!");

// Write JSON
await Bun.write("./data.json", JSON.stringify({ key: "value" }));

// Write binary
await Bun.write("./image.png", imageBuffer);

// Write from Response
const res = await fetch("https://example.com/data.json");
await Bun.write("./downloaded.json", res);

// Write with options
await Bun.write("./output.txt", "content", {
  mode: 0o644, // Unix permissions
});
```

### File Copying

```typescript
// Copy file
await Bun.write("./copy.txt", Bun.file("./original.txt"));
```

## Environment Variables

```typescript
// Access via Bun.env or process.env
const apiKey = Bun.env.API_KEY;
const dbUrl = process.env.DATABASE_URL;

// Set variables
Bun.env.MY_VAR = "value";

// Check environment
if (Bun.env.NODE_ENV === "production") {
  // Production code
}
```

### .env Files

Bun automatically loads `.env` files:

```
# .env
DATABASE_URL=postgres://localhost/mydb
API_KEY=secret123
```

```typescript
// Automatically available
console.log(Bun.env.DATABASE_URL);
```

## Shell Commands

Execute shell commands with the `$` template literal:

```typescript
import { $ } from "bun";

// Simple command
const result = await $`echo "Hello"`;
console.log(result.text()); // "Hello\n"

// With variables (auto-escaped)
const file = "my file.txt";
await $`cat ${file}`;

// Capture output
const { stdout, stderr, exitCode } = await $`ls -la`;

// Quiet mode (no output to console)
await $`npm install`.quiet();

// Pipe commands
await $`cat file.txt`.pipe($`grep pattern`);
```

### Shell Options

```typescript
// Change directory
$.cwd("./project");
await $`npm install`;

// Set environment
$.env({ NODE_ENV: "production" });
await $`npm run build`;

// Throw on non-zero exit
try {
  await $`false`.throws();
} catch (e) {
  console.log("Command failed");
}
```

## Spawn Processes

For more control over child processes:

```typescript
// Spawn a process
const proc = Bun.spawn(["ls", "-la"]);

// Wait for completion
const output = await new Response(proc.stdout).text();
await proc.exited;

console.log("Exit code:", proc.exitCode);
console.log("Output:", output);
```

### With stdin

```typescript
const proc = Bun.spawn(["cat"], {
  stdin: "pipe",
});

proc.stdin.write("Hello from stdin!");
proc.stdin.end();

const output = await new Response(proc.stdout).text();
```

### Long-running Processes

```typescript
const server = Bun.spawn(["node", "server.js"], {
  cwd: "./app",
  env: { PORT: "3000" },
  onExit(proc, exitCode, signal) {
    console.log(`Server exited with ${exitCode}`);
  },
});

// Later, kill the process
server.kill();
```

## Workers

Multi-threaded JavaScript execution:

```typescript
// main.ts
const worker = new Worker("./worker.ts");

worker.postMessage({ type: "compute", data: [1, 2, 3] });

worker.onmessage = (event) => {
  console.log("Result:", event.data);
};

// worker.ts
self.onmessage = (event) => {
  const { type, data } = event.data;

  if (type === "compute") {
    const result = data.reduce((a: number, b: number) => a + b, 0);
    self.postMessage(result);
  }
};
```

### Worker from Inline Code

```typescript
const worker = new Worker(
  new Blob([
    `
    self.onmessage = (e) => {
      self.postMessage(e.data * 2);
    };
  `,
  ]),
  { type: "module" }
);
```

## Binary Data

Handle binary data efficiently:

```typescript
// ArrayBuffer operations
const buffer = new ArrayBuffer(1024);
const view = new Uint8Array(buffer);

// Convert between formats
const text = "Hello";
const encoded = new TextEncoder().encode(text);
const decoded = new TextDecoder().decode(encoded);

// Bun's Buffer (Node.js compatible)
const buf = Buffer.from("Hello");
console.log(buf.toString("base64")); // "SGVsbG8="
```

## HTTP Server

Built-in high-performance HTTP server:

```typescript
const server = Bun.serve({
  port: 3000,

  fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/") {
      return new Response("Hello!");
    }

    if (url.pathname === "/json") {
      return Response.json({ message: "Hello" });
    }

    return new Response("Not Found", { status: 404 });
  },
});

console.log(`Server running at http://localhost:${server.port}`);
```

### With Hono

```typescript
import { Hono } from "hono";

const app = new Hono();
app.get("/", (c) => c.text("Hello!"));

Bun.serve({
  port: 3000,
  fetch: app.fetch,
});
```

## SQLite

Built-in SQLite support:

```typescript
import { Database } from "bun:sqlite";

const db = new Database("mydb.sqlite");

// Create table
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE
  )
`);

// Insert
const insert = db.prepare("INSERT INTO users (name, email) VALUES (?, ?)");
insert.run("Alice", "alice@example.com");

// Query
const query = db.prepare("SELECT * FROM users WHERE name = ?");
const user = query.get("Alice");

// All rows
const users = db.query("SELECT * FROM users").all();
```

## Watch Mode

Auto-reload on file changes:

```bash
# Watch and restart
bun --watch run server.ts

# Hot reload (preserve state)
bun --hot run server.ts
```

## Performance Tips

### Prefer Native APIs

```typescript
// ✅ Good - native Bun
const file = await Bun.file("./data.txt").text();

// ❌ Slower - Node.js compat
import { readFile } from "fs/promises";
const file = await readFile("./data.txt", "utf-8");
```

### Use Streams for Large Files

```typescript
// ✅ Good - streaming
const file = Bun.file("./large.json");
const stream = file.stream();

// ❌ Bad - loads entire file
const data = await Bun.file("./large.json").text();
```

### Password Hashing

```typescript
// Use built-in bcrypt
const hash = await Bun.password.hash("password", {
  algorithm: "bcrypt",
  cost: 10,
});
```

## Node.js Compatibility

Bun implements most Node.js APIs:

```typescript
// These all work
import { readFile } from "fs/promises";
import path from "path";
import { createServer } from "http";

// process globals
console.log(process.env.HOME);
console.log(process.cwd());
```

## Next Steps

- [Bun Bundler](bun-bundler.md) - Building applications
- [Bun Testing](bun-testing.md) - Test framework
- [Bun Package Manager](bun-package-manager.md) - Dependencies
