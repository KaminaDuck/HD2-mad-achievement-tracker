---
title: "Bun File I/O"
description: "High-performance file operations with Bun.file() and Bun.write() APIs"
type: "api-reference"
tags: ["bun", "file-io", "filesystem", "read", "write", "bunfile"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun File I/O Documentation"
    url: "https://bun.sh/docs/runtime/file-io"
related:
  - "../README.md"
  - "./streams.md"
  - "./binary-data.md"
author: "unknown"
contributors: []
---

# Bun File I/O

The `Bun.file` and `Bun.write` APIs are heavily optimized and represent the recommended way to perform file-system tasks using Bun. ([Bun Docs][1])

## Reading Files (`Bun.file()`)

Create a `BunFile` instance representing a lazily-loaded file:

```typescript
const foo = Bun.file("foo.txt"); // relative to cwd
foo.size; // number of bytes
foo.type; // MIME type
```

`BunFile` conforms to the [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) interface with multiple read formats:

```typescript
const foo = Bun.file("foo.txt");

await foo.text();        // contents as string
await foo.json();        // contents as JSON object
await foo.stream();      // contents as ReadableStream
await foo.arrayBuffer(); // contents as ArrayBuffer
await foo.bytes();       // contents as Uint8Array
```

### Alternative Constructors

```typescript
Bun.file(1234);                      // from file descriptor
Bun.file(new URL(import.meta.url));  // from file:// URL
```

### Non-existent Files

A `BunFile` can point to a location where no file exists:

```typescript
const notreal = Bun.file("notreal.txt");
notreal.size;                    // 0
notreal.type;                    // "text/plain;charset=utf-8"
await notreal.exists();          // false
```

### Custom MIME Type

```typescript
const notreal = Bun.file("notreal.json", { type: "application/json" });
notreal.type; // "application/json;charset=utf-8"
```

### Standard I/O as BunFile

```typescript
Bun.stdin;  // readonly
Bun.stdout;
Bun.stderr;
```

## Deleting Files (`file.delete()`)

```typescript
await Bun.file("logs.json").delete();
```

## Writing Files (`Bun.write()`)

`Bun.write()` is a multi-tool for writing payloads of all kinds to disk. ([Bun Docs][1])

### Destination Types

- `string`: Path to file system location
- `URL`: A `file://` descriptor
- `BunFile`: A file reference

### Input Types

- `string`
- `Blob` (including `BunFile`)
- `ArrayBuffer` or `SharedArrayBuffer`
- `TypedArray` (`Uint8Array`, etc.)
- `Response`

### Examples

Write a string:

```typescript
const data = `It was the best of times, it was the worst of times.`;
await Bun.write("output.txt", data);
```

Copy a file:

```typescript
const input = Bun.file("input.txt");
const output = Bun.file("output.txt");
await Bun.write(output, input);
```

Write a byte array:

```typescript
const encoder = new TextEncoder();
const data = encoder.encode("datadatadata");
await Bun.write("output.txt", data);
```

Write to stdout:

```typescript
const input = Bun.file("input.txt");
await Bun.write(Bun.stdout, input);
```

Write HTTP response body:

```typescript
const response = await fetch("https://bun.com");
await Bun.write("index.html", response);
```

### Platform-Optimized System Calls

Bun uses the fastest available system calls per platform:

| Output | Input | System Call | Platform |
|--------|-------|-------------|----------|
| file | file | `copy_file_range` | Linux |
| file | pipe | `sendfile` | Linux |
| pipe | pipe | `splice` | Linux |
| file (new) | file (path) | `clonefile` | macOS |
| file (exists) | file | `fcopyfile` | macOS |
| file | Blob/string | `write` | Both |

## Incremental Writing with `FileSink`

For incremental writes, use `FileSink`:

```typescript
const file = Bun.file("output.txt");
const writer = file.writer();

writer.write("it was the best of times\n");
writer.write("it was the worst of times\n");
```

### Flushing

```typescript
writer.flush(); // write buffer to disk, returns bytes flushed
```

The buffer auto-flushes when the high water mark is reached:

```typescript
const writer = file.writer({ highWaterMark: 1024 * 1024 }); // 1MB
```

### Closing

```typescript
writer.end(); // flush and close
```

### Process Lifecycle

By default, the bun process stays alive until `FileSink` is closed:

```typescript
writer.unref(); // allow process to exit
writer.ref();   // re-ref to keep process alive
```

## Directories

Use `node:fs` for directory operations (Bun's implementation is fast):

### Reading Directories

```typescript
import { readdir } from "node:fs/promises";

const files = await readdir(import.meta.dir);
```

### Reading Recursively

```typescript
const files = await readdir("../", { recursive: true });
```

### Creating Directories

```typescript
import { mkdir } from "node:fs/promises";

await mkdir("path/to/dir", { recursive: true });
```

## Benchmarks

A 3-line `cat` implementation:

```typescript
// bun ./cat.ts ./path-to-file
import { resolve } from "path";

const path = resolve(process.argv.at(-1));
await Bun.write(Bun.stdout, Bun.file(path));
```

This runs **2x faster than GNU `cat`** for large files on Linux. ([Bun Docs][1])

## API Reference

```typescript
interface Bun {
  stdin: BunFile;
  stdout: BunFile;
  stderr: BunFile;

  file(path: string | number | URL, options?: { type?: string }): BunFile;

  write(
    destination: string | number | BunFile | URL,
    input: string | Blob | ArrayBuffer | SharedArrayBuffer | TypedArray | Response,
  ): Promise<number>;
}

interface BunFile {
  readonly size: number;
  readonly type: string;

  text(): Promise<string>;
  stream(): ReadableStream;
  arrayBuffer(): Promise<ArrayBuffer>;
  json(): Promise<any>;
  bytes(): Promise<Uint8Array>;
  writer(params?: { highWaterMark?: number }): FileSink;
  exists(): Promise<boolean>;
  delete(): Promise<void>;
}

interface FileSink {
  write(chunk: string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer): number;
  flush(): number | Promise<number>;
  end(error?: Error): number | Promise<number>;
  start(options?: { highWaterMark?: number }): void;
  ref(): void;
  unref(): void;
}
```

---

[1]: https://bun.sh/docs/runtime/file-io "Bun File I/O Documentation"
