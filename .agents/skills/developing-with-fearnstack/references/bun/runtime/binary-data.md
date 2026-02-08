---
title: "Bun Binary Data"
description: "Working with ArrayBuffer, TypedArray, Buffer, Blob, and binary data conversions"
type: "concept-guide"
tags: ["bun", "binary-data", "arraybuffer", "typedarray", "buffer", "blob", "uint8array"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Binary Data Documentation"
    url: "https://bun.sh/docs/runtime/binary-data"
related:
  - "../README.md"
  - "./file-io.md"
  - "./streams.md"
author: "unknown"
contributors: []
---

# Bun Binary Data

This guide covers working with binary data in JavaScript using Bun. ([Bun Docs][1])

## Binary Data Types Overview

| Class | Description |
|-------|-------------|
| `TypedArray` | Family of classes providing Array-like interface for binary data (`Uint8Array`, `Int32Array`, etc.) |
| `Buffer` | Node.js subclass of `Uint8Array` with convenience methods (not available in browsers) |
| `DataView` | Get/set API for writing bytes at specific offsets in an `ArrayBuffer` |
| `Blob` | Readonly blob with MIME type, size, and conversion methods |
| `File` | `Blob` subclass with `name` and `lastModified` |
| `BunFile` | Bun-specific lazily-loaded file on disk via `Bun.file(path)` |

## ArrayBuffer

The fundamental building block - a sequence of bytes in memory:

```typescript
const buf = new ArrayBuffer(8); // 8 bytes
buf.byteLength; // => 8

const slice = buf.slice(0, 4); // new ArrayBuffer
slice.byteLength; // => 4
```

`ArrayBuffer` cannot be read or written directly - you need a "view" (`DataView` or `TypedArray`).

## DataView

Lower-level interface for reading/manipulating `ArrayBuffer` data:

```typescript
const buf = new ArrayBuffer(4);
const dv = new DataView(buf);

dv.setUint8(0, 3);      // write value 3 at byte offset 0
dv.getUint8(0);         // => 3

dv.setUint16(1, 513);   // write 16-bit value (2 bytes)
dv.getUint16(1);        // => 513
```

### DataView Methods

| Getters | Setters |
|---------|---------|
| `getInt8()` / `getUint8()` | `setInt8()` / `setUint8()` |
| `getInt16()` / `getUint16()` | `setInt16()` / `setUint16()` |
| `getInt32()` / `getUint32()` | `setInt32()` / `setUint32()` |
| `getFloat32()` / `getFloat64()` | `setFloat32()` / `setFloat64()` |
| `getBigInt64()` / `getBigUint64()` | `setBigInt64()` / `setBigUint64()` |

## TypedArray

Array-like interface interpreting bytes as numbers of fixed size:

```typescript
const buffer = new ArrayBuffer(3);
const arr = new Uint8Array(buffer);

arr[0] = 0;
arr[1] = 10;
arr[2] = 255;
```

### TypedArray Classes

| Class | Bytes | Range |
|-------|-------|-------|
| `Uint8Array` | 1 | 0 to 255 |
| `Uint16Array` | 2 | 0 to 65535 |
| `Uint32Array` | 4 | 0 to 4294967295 |
| `Int8Array` | 1 | -128 to 127 |
| `Int16Array` | 2 | -32768 to 32767 |
| `Int32Array` | 4 | -2147483648 to 2147483647 |
| `Float32Array` | 4 | ~-3.4e38 to ~3.4e38 |
| `Float64Array` | 8 | ~-1.7e308 to ~1.7e308 |
| `BigInt64Array` | 8 | BigInt values |
| `BigUint64Array` | 8 | BigInt values |
| `Uint8ClampedArray` | 1 | 0 to 255 (auto-clamps) |

### Creating TypedArrays

```typescript
// From ArrayBuffer
const arr1 = new Uint8Array(buf);

// With length
const arr2 = new Uint8Array(5);

// From array of numbers
const arr3 = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]);

// From another TypedArray
const arr4 = new Uint8Array(arr3);

// From ArrayBuffer slice (byteOffset, length)
const arr5 = new Uint32Array(buf, 0, 2);
```

### Array Methods

TypedArrays support most array methods:

```typescript
arr.filter(n => n > 128);
arr.map(n => n * 2);
arr.reduce((acc, n) => acc + n, 0);
arr.forEach(n => console.log(n));
arr.every(n => n < 10);
arr.find(n => n > 5);
arr.includes(5);
arr.indexOf(5);
```

**Note**: `push` and `pop` are not available (would require resizing).

## Uint8Array

The most common typed array - represents a "byte array":

```typescript
// Base64 conversion (Bun-specific)
new Uint8Array([1, 2, 3, 4, 5]).toBase64(); // "AQIDBA=="
Uint8Array.fromBase64("AQIDBA==");

// Hex conversion (Bun-specific)
new Uint8Array([255, 254, 253]).toHex(); // "fffefd"
Uint8Array.fromHex("fffefd");
```

### Text Encoding/Decoding

```typescript
const encoder = new TextEncoder();
const bytes = encoder.encode("hello world");
// => Uint8Array(11) [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]

const decoder = new TextDecoder();
const text = decoder.decode(bytes);
// => "hello world"
```

## Buffer (Node.js API)

Subclass of `Uint8Array` with extensive convenience methods:

```typescript
const buf = Buffer.from("hello world");
// => Buffer(11) [104, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100]

buf.length;        // => 11
buf[0];            // => 104 (ascii for 'h')
buf.writeUInt8(72, 0); // write ascii for 'H'

buf.toString();           // => "Hello world"
buf.toString("base64");   // base64 encoding
buf.toString("hex");      // hex encoding
```

## Blob

Web API for representing files:

```typescript
const blob = new Blob(["<html>Hello</html>"], {
  type: "text/html",
});

blob.type; // => "text/html"
blob.size; // => 19
```

### Blob Parts

```typescript
const blob = new Blob([
  "<html>",
  new Blob(["<body>"]),
  new Uint8Array([104, 101, 108, 108, 111]), // "hello"
  "</body></html>",
]);
```

### Reading Blob Contents

```typescript
await blob.text();        // string
await blob.bytes();       // Uint8Array (copies)
await blob.arrayBuffer(); // ArrayBuffer (copies)
await blob.stream();      // ReadableStream
```

## BunFile

Bun-specific lazily-loaded file:

```typescript
const file = Bun.file("index.txt");
// => BunFile (subclass of Blob)
```

## Streams

Create a readable stream:

```typescript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("hello");
    controller.enqueue("world");
    controller.close();
  },
});

for await (const chunk of stream) {
  console.log(chunk);
}
```

## Conversion Reference

### From ArrayBuffer

```typescript
new Uint8Array(buf);                     // To TypedArray
new DataView(buf);                       // To DataView
Buffer.from(buf);                        // To Buffer
new TextDecoder().decode(buf);           // To string (UTF-8)
Array.from(new Uint8Array(buf));         // To number[]
new Blob([buf], { type: "text/plain" }); // To Blob
```

### From TypedArray

```typescript
arr.buffer;                              // To ArrayBuffer
new DataView(arr.buffer, arr.byteOffset, arr.byteLength); // To DataView
Buffer.from(arr);                        // To Buffer
new TextDecoder().decode(arr);           // To string
Array.from(arr);                         // To number[]
```

### From Buffer

```typescript
buf.buffer;                              // To ArrayBuffer
new Uint8Array(buf);                     // To TypedArray
buf.toString();                          // To string (UTF-8)
buf.toString("base64");                  // To base64 string
buf.toString("hex");                     // To hex string
```

### From Blob

```typescript
await blob.arrayBuffer();                // To ArrayBuffer
await blob.bytes();                      // To Uint8Array
new DataView(await blob.arrayBuffer());  // To DataView
Buffer.from(await blob.arrayBuffer());   // To Buffer
await blob.text();                       // To string
blob.stream();                           // To ReadableStream
```

### From ReadableStream

Bun provides optimized utilities:

```typescript
// Bun functions (faster)
Bun.readableStreamToArrayBuffer(stream);
Bun.readableStreamToBytes(stream);
Bun.readableStreamToText(stream);
Bun.readableStreamToArray(stream);

// Alternative via Response
await new Response(stream).arrayBuffer();
await new Response(stream).bytes();
await new Response(stream).text();
await new Response(stream).blob();
```

### Split ReadableStream

```typescript
const [a, b] = stream.tee();
```

---

[1]: https://bun.sh/docs/runtime/binary-data "Bun Binary Data Documentation"
