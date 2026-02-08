---
title: "Bun Streams"
description: "Working with ReadableStream, WritableStream, and Bun.ArrayBufferSink"
type: "api-reference"
tags: ["bun", "streams", "readablestream", "writablestream", "async-generator", "binary-data"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Streams Documentation"
    url: "https://bun.sh/docs/runtime/streams"
related:
  - "../README.md"
  - "./file-io.md"
  - "./binary-data.md"
author: "unknown"
contributors: []
---

# Bun Streams

Streams are an important abstraction for working with binary data without loading it all into memory at once. They are commonly used for reading and writing files, sending and receiving network requests, and processing large amounts of data. ([Bun Docs][1])

## Web API Streams

Bun implements the Web APIs:
- [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
- [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream)

## Node.js Streams

Bun also implements the `node:stream` module:
- [`Readable`](https://nodejs.org/api/stream.html#stream_readable_streams)
- [`Writable`](https://nodejs.org/api/stream.html#stream_writable_streams)
- [`Duplex`](https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams)

## Basic ReadableStream

Create a simple `ReadableStream`:

```typescript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("hello");
    controller.enqueue("world");
    controller.close();
  },
});
```

Read contents chunk-by-chunk with `for await`:

```typescript
for await (const chunk of stream) {
  console.log(chunk);
}
// hello
// world
```

## Direct ReadableStream

Bun implements an optimized version that avoids unnecessary data copying and queue management. ([Bun Docs][1])

### Traditional vs Direct

**Traditional** (chunks are copied into a queue):

```typescript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("hello");
    controller.enqueue("world");
    controller.close();
  },
});
```

**Direct** (writes directly to stream, no cloning):

```typescript
const stream = new ReadableStream({
  type: "direct",
  pull(controller) {
    controller.write("hello");
    controller.write("world");
  },
});
```

Key differences:
- Use `type: "direct"` in the constructor
- Use `controller.write()` instead of `controller.enqueue()`
- No queueing - consumer receives exactly what is written

## Async Generator Streams

Bun supports async generator functions as a source for `Response` and `Request`:

```typescript
const response = new Response(
  (async function* () {
    yield "hello";
    yield "world";
  })(),
);

await response.text(); // "helloworld"
```

Using `Symbol.asyncIterator`:

```typescript
const response = new Response({
  [Symbol.asyncIterator]: async function* () {
    yield "hello";
    yield "world";
  },
});

await response.text(); // "helloworld"
```

### Access to Controller

`yield` returns the direct ReadableStream controller for granular control:

```typescript
const response = new Response({
  [Symbol.asyncIterator]: async function* () {
    const controller = yield "hello";
    await controller.end();
  },
});

await response.text(); // "hello"
```

## Bun.ArrayBufferSink

Fast incremental writer for constructing an `ArrayBuffer` of unknown size. ([Bun Docs][1])

### Basic Usage

```typescript
const sink = new Bun.ArrayBufferSink();

sink.write("h");
sink.write("e");
sink.write("l");
sink.write("l");
sink.write("o");

sink.end();
// ArrayBuffer(5) [ 104, 101, 108, 108, 111 ]
```

### As Uint8Array

```typescript
const sink = new Bun.ArrayBufferSink();
sink.start({
  asUint8Array: true,
});

sink.write("hello");
sink.end();
// Uint8Array(5) [ 104, 101, 108, 108, 111 ]
```

### Write Types

`.write()` supports:
- Strings
- Typed arrays
- `ArrayBuffer`
- `SharedArrayBuffer`

```typescript
sink.write("h");
sink.write(new Uint8Array([101, 108]));
sink.write(Buffer.from("lo").buffer);

sink.end();
```

### Streaming Mode

For continuous writing with periodic flushing, use `stream: true`:

```typescript
const sink = new Bun.ArrayBufferSink();
sink.start({
  stream: true,
});

sink.write("hel");
sink.flush();
// ArrayBuffer(3) [ 104, 101, 108 ]

sink.write("lo");
sink.flush();
// ArrayBuffer(2) [ 108, 111 ]
```

### High Water Mark

Set internal buffer size:

```typescript
const sink = new Bun.ArrayBufferSink();
sink.start({
  highWaterMark: 1024 * 1024, // 1 MB
});
```

## API Reference

```typescript
class ArrayBufferSink {
  constructor();

  start(options?: {
    asUint8Array?: boolean;
    highWaterMark?: number;
    stream?: boolean;
  }): void;

  write(
    chunk: string | ArrayBufferView | ArrayBuffer | SharedArrayBuffer
  ): number;

  flush(): number | Uint8Array | ArrayBuffer;

  end(): ArrayBuffer | Uint8Array;
}
```

---

[1]: https://bun.sh/docs/runtime/streams "Bun Streams Documentation"
