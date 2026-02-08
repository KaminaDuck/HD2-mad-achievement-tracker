---
title: "Bun Workers"
description: "Create and communicate with JavaScript instances running on separate threads"
type: "api-reference"
tags: ["bun", "workers", "concurrency", "threads", "postmessage", "web-workers"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Workers Documentation"
    url: "https://bun.sh/docs/runtime/workers"
related:
  - "../README.md"
  - "./spawn.md"
  - "./environment-variables.md"
author: "unknown"
contributors: []
---

# Bun Workers

The `Worker` API lets you start and communicate with a new JavaScript instance running on a separate thread while sharing I/O resources with the main thread. ([Bun Docs][1])

Bun implements a minimal version of the Web Workers API with extensions for server-side use cases. Like the rest of Bun, Workers support CommonJS, ES Modules, TypeScript, JSX, TSX and more out of the box.

**Note**: The Worker API is still experimental (particularly for terminating workers).

## Creating a Worker

`Worker` is a global - use it to create a new worker thread.

### From the Main Thread

```typescript
const worker = new Worker("./worker.ts");

worker.postMessage("hello");
worker.onmessage = event => {
  console.log(event.data);
};
```

### Worker Thread

```typescript
// prevents TS errors
declare var self: Worker;

self.onmessage = (event: MessageEvent) => {
  console.log(event.data);
  postMessage("world");
};
```

The specifier passed to `Worker` is resolved relative to the project root (like typing `bun ./path/to/file.js`).

### Preload Modules

Load modules before the worker starts using the `preload` option:

```typescript
const worker = new Worker("./worker.ts", {
  preload: ["./load-sentry.js"],
});

// Or a single string
const worker2 = new Worker("./worker.ts", {
  preload: "./load-sentry.js",
});
```

### Blob URLs

Create workers from strings or other sources:

```typescript
const blob = new Blob(
  [`self.onmessage = (event: MessageEvent) => postMessage(event.data)`],
  { type: "application/typescript" }
);
const url = URL.createObjectURL(blob);
const worker = new Worker(url);
```

### "open" Event

The `"open"` event fires when a worker is ready to receive messages (Bun-specific):

```typescript
const worker = new Worker(new URL("worker.ts", import.meta.url).href);

worker.addEventListener("open", () => {
  console.log("worker is ready");
});
```

Messages are automatically enqueued until the worker is ready.

## Messages with postMessage

Use `worker.postMessage` and `self.postMessage` to send messages via the HTML Structured Clone Algorithm. ([Bun Docs][1])

### Performance Optimizations

Bun includes optimized fast paths for common data types:

**String fast path** - Bypasses structured clone entirely for pure strings:

```typescript
postMessage("Hello, worker!"); // Optimized
```

**Simple object fast path** - For plain objects with only primitive values:

```typescript
postMessage({
  message: "Hello",
  count: 42,
  enabled: true,
  data: null,
}); // Optimized
```

The simple object fast path activates when the object:
- Is a plain object with no prototype chain modifications
- Contains only enumerable, configurable data properties
- Has no indexed properties or getter/setter methods
- All property values are primitives or strings

**Performance comparison**:

| Scenario | Bun | Node.js v24 |
|----------|-----|-------------|
| 10 props, 11 char strings | 648ns | 1.19µs |
| 10 props, 14 KB strings | 719ns | 2.69µs |
| 10 props, 3 MB strings | 1.26µs | 304µs |

### Receiving Messages

```typescript
// Worker thread
self.addEventListener("message", event => {
  console.log(event.data);
});

// Main thread
worker.addEventListener("message", event => {
  console.log(event.data);
});
```

## Terminating a Worker

A `Worker` terminates automatically when its event loop has no work left.

### Manual Termination

```typescript
const worker = new Worker(new URL("worker.ts", import.meta.url).href);

// ...some time later
worker.terminate();
```

### process.exit()

A worker can terminate itself with `process.exit()` - this does not terminate the main process:

```typescript
// In worker
process.exit(0);
```

### "close" Event

The `"close"` event fires when a worker has been terminated (Bun-specific):

```typescript
worker.addEventListener("close", event => {
  console.log("worker is being closed");
  console.log("exit code:", event.code);
});
```

## Managing Lifetime

By default, an active `Worker` keeps the main process alive.

### worker.unref()

Decouple the worker's lifetime from the main process:

```typescript
const worker = new Worker(new URL("worker.ts", import.meta.url).href);
worker.unref(); // Process can exit even if worker is running
```

### worker.ref()

Re-couple the worker's lifetime (default behavior):

```typescript
worker.ref(); // Process stays alive while worker runs
```

Or set via constructor options:

```typescript
const worker = new Worker(new URL("worker.ts", import.meta.url).href, {
  ref: false,
});
```

## Memory Usage with smol

Reduce memory usage at the cost of performance:

```typescript
const worker = new Worker("./i-am-smol.ts", {
  smol: true,
});
```

This sets `JSC::HeapSize` to `Small` instead of the default `Large`.

## Environment Data

Share data between main thread and workers:

```typescript
import { setEnvironmentData, getEnvironmentData } from "worker_threads";

// In main thread
setEnvironmentData("config", { apiUrl: "https://api.example.com" });

// In worker
const config = getEnvironmentData("config");
console.log(config); // => { apiUrl: "https://api.example.com" }
```

## Worker Events

Listen for worker creation events:

```typescript
process.on("worker", worker => {
  console.log("New worker created:", worker.threadId);
});
```

## Bun.isMainThread

Check if running in the main thread:

```typescript
if (Bun.isMainThread) {
  console.log("I'm the main thread");
} else {
  console.log("I'm in a worker");
}
```

## API Reference

```typescript
interface Worker {
  new(url: string | URL, options?: WorkerOptions): Worker;

  postMessage(message: any, transfer?: Transferable[]): void;
  terminate(): void;
  ref(): void;
  unref(): void;

  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;

  addEventListener(type: "message", listener: (event: MessageEvent) => void): void;
  addEventListener(type: "error", listener: (event: ErrorEvent) => void): void;
  addEventListener(type: "open", listener: () => void): void;  // Bun-specific
  addEventListener(type: "close", listener: (event: CloseEvent) => void): void;  // Bun-specific
}

interface WorkerOptions {
  preload?: string | string[];
  ref?: boolean;
  smol?: boolean;
}

// Bun globals
declare namespace Bun {
  const isMainThread: boolean;
}
```

---

[1]: https://bun.sh/docs/runtime/workers "Bun Workers Documentation"
