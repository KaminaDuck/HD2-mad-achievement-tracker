---
title: "Bun Globals"
description: "Global objects and APIs available in the Bun runtime"
type: "api-reference"
tags: ["bun", "globals", "web-api", "nodejs", "runtime", "compatibility"]
category: "typescript"
subcategory: "runtime"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Globals Documentation"
    url: "https://bun.sh/docs/runtime/globals"
related:
  - "../README.md"
  - "./environment-variables.md"
author: "unknown"
contributors: []
---

# Bun Globals

Bun implements a comprehensive set of global objects from Web APIs, Node.js, and Bun-specific extensions. ([Bun Docs][1])

## Web API Globals

### Abort APIs

| Global | Description |
|--------|-------------|
| [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) | Controller for aborting async operations |
| [`AbortSignal`](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) | Signal for abort communication |

### Binary Data

| Global | Description |
|--------|-------------|
| [`Blob`](https://developer.mozilla.org/en-US/docs/Web/API/Blob) | Binary large object |
| [`ByteLengthQueuingStrategy`](https://developer.mozilla.org/en-US/docs/Web/API/ByteLengthQueuingStrategy) | Stream queuing strategy |
| [`CountQueuingStrategy`](https://developer.mozilla.org/en-US/docs/Web/API/CountQueuingStrategy) | Stream queuing strategy |

### Crypto

| Global | Description |
|--------|-------------|
| [`Crypto`](https://developer.mozilla.org/en-US/docs/Web/API/Crypto) | Cryptography class |
| [`crypto`](https://developer.mozilla.org/en-US/docs/Web/API/crypto) | Global crypto instance |
| [`CryptoKey`](https://developer.mozilla.org/en-US/docs/Web/API/CryptoKey) | Cryptographic key |
| [`SubtleCrypto`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) | Low-level crypto operations |

### Encoding

| Global | Description |
|--------|-------------|
| [`atob()`](https://developer.mozilla.org/en-US/docs/Web/API/atob) | Decode base64 string |
| [`btoa()`](https://developer.mozilla.org/en-US/docs/Web/API/btoa) | Encode to base64 string |
| [`TextDecoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder) | Decode bytes to string |
| [`TextEncoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder) | Encode string to bytes |

### Events

| Global | Description |
|--------|-------------|
| [`Event`](https://developer.mozilla.org/en-US/docs/Web/API/Event) | Base event class |
| [`CustomEvent`](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) | Custom event with data |
| [`EventTarget`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) | Event target interface |
| [`MessageEvent`](https://developer.mozilla.org/en-US/docs/Web/API/MessageEvent) | Message event |
| `ErrorEvent` | Error event |
| `CloseEvent` | Close event |

### Fetch API

| Global | Description |
|--------|-------------|
| [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) | HTTP fetch function |
| [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData) | Form data handling |
| [`Headers`](https://developer.mozilla.org/en-US/docs/Web/API/Headers) | HTTP headers |
| [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request) | HTTP request |
| [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response) | HTTP response |

### Streams

| Global | Description |
|--------|-------------|
| [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream) | Readable stream |
| [`ReadableByteStreamController`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableByteStreamController) | Byte stream controller |
| [`ReadableStreamDefaultController`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultController) | Default stream controller |
| [`ReadableStreamDefaultReader`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStreamDefaultReader) | Stream reader |
| [`WritableStream`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStream) | Writable stream |
| [`WritableStreamDefaultController`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStreamDefaultController) | Writable controller |
| [`WritableStreamDefaultWriter`](https://developer.mozilla.org/en-US/docs/Web/API/WritableStreamDefaultWriter) | Stream writer |
| [`TransformStream`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStream) | Transform stream |
| [`TransformStreamDefaultController`](https://developer.mozilla.org/en-US/docs/Web/API/TransformStreamDefaultController) | Transform controller |

### Timers

| Global | Description |
|--------|-------------|
| [`setTimeout()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout) | Delayed execution |
| [`clearTimeout()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/clearTimeout) | Cancel timeout |
| [`setInterval()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setInterval) | Repeated execution |
| [`clearInterval()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/clearInterval) | Cancel interval |
| [`setImmediate()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/setImmediate) | Immediate execution |
| [`clearImmediate()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/clearImmediate) | Cancel immediate |
| [`queueMicrotask()`](https://developer.mozilla.org/en-US/docs/Web/API/queueMicrotask) | Queue microtask |

### URL

| Global | Description |
|--------|-------------|
| [`URL`](https://developer.mozilla.org/en-US/docs/Web/API/URL) | URL parsing and manipulation |
| [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams) | Query string handling |

### Other Web APIs

| Global | Description |
|--------|-------------|
| [`console`](https://developer.mozilla.org/en-US/docs/Web/API/console) | Console logging |
| [`performance`](https://developer.mozilla.org/en-US/docs/Web/API/performance) | Performance timing |
| [`JSON`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON) | JSON parse/stringify |
| [`WebAssembly`](https://nodejs.org/api/globals.html#webassembly) | WebAssembly support |
| [`DOMException`](https://developer.mozilla.org/en-US/docs/Web/API/DOMException) | DOM exception class |
| [`reportError`](https://developer.mozilla.org/en-US/docs/Web/API/reportError) | Report uncaught error |

### CLI Dialogs

These are intended for command-line tools:

| Global | Description |
|--------|-------------|
| [`alert`](https://developer.mozilla.org/en-US/docs/Web/API/Window/alert) | Display alert message |
| [`confirm`](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm) | Display confirmation dialog |
| [`prompt`](https://developer.mozilla.org/en-US/docs/Web/API/Window/prompt) | Display input prompt |

## Node.js Globals

| Global | Description |
|--------|-------------|
| [`Buffer`](https://nodejs.org/api/buffer.html#class-buffer) | Binary data buffer (subclass of `Uint8Array`) |
| [`__dirname`](https://nodejs.org/api/globals.html#__dirname) | Directory of current module |
| [`__filename`](https://nodejs.org/api/globals.html#__filename) | Filename of current module |
| [`exports`](https://nodejs.org/api/globals.html#exports) | Module exports shortcut |
| [`global`](https://nodejs.org/api/globals.html#global) | Global namespace object |
| [`module`](https://nodejs.org/api/globals.html#module) | Current module reference |
| [`process`](https://nodejs.org/api/process.html) | Process information and control |
| [`require()`](https://nodejs.org/api/globals.html#require) | CommonJS module loader |

## Bun-Specific Globals

| Global | Description |
|--------|-------------|
| `Bun` | Main Bun namespace (APIs subject to change) |
| `BuildMessage` | Build message type |
| `ResolveMessage` | Resolve message type |

## Cross-Platform Globals

| Global | Description |
|--------|-------------|
| [`globalThis`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis) | Global object (aliases to `global`) |

## Cloudflare Globals

| Global | Description |
|--------|-------------|
| [`HTMLRewriter`](https://bun.sh/docs/runtime/html-rewriter) | HTML transformation API |

## Experimental

| Global | Description |
|--------|-------------|
| [`ShadowRealm`](https://github.com/tc39/proposal-shadowrealm) | TC39 Stage 3 proposal |

---

[1]: https://bun.sh/docs/runtime/globals "Bun Globals Documentation"
