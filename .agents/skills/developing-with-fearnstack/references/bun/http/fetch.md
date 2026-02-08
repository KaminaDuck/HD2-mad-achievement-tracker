---
title: "Bun Fetch"
description: "WHATWG fetch implementation with proxies, TLS, streaming, and protocol extensions"
type: "api-reference"
tags: ["bun", "fetch", "http", "networking", "client", "request", "response"]
category: "typescript"
subcategory: "http"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Fetch Documentation"
    url: "https://bun.sh/docs/runtime/networking/fetch"
related:
  - "../README.md"
  - "./server.md"
  - "./tcp-udp.md"
author: "unknown"
contributors: []
---

# Bun Fetch

Bun implements the WHATWG `fetch` standard with extensions for server-side JavaScript. ([Bun Docs][1])

## Basic Usage

### Sending Requests

```typescript
const response = await fetch("http://example.com");

console.log(response.status); // => 200
const text = await response.text();
```

Using a `Request` object:

```typescript
const request = new Request("http://example.com", {
  method: "POST",
  body: "Hello, world!",
});

const response = await fetch(request);
```

### POST Requests

```typescript
const response = await fetch("http://example.com", {
  method: "POST",
  body: "Hello, world!",
});
```

`body` can be a string, `FormData`, `ArrayBuffer`, `Blob`, and more.

### Custom Headers

```typescript
const response = await fetch("http://example.com", {
  headers: {
    "X-Custom-Header": "value",
  },
});

// Using Headers object
const headers = new Headers();
headers.append("X-Custom-Header", "value");

const response2 = await fetch("http://example.com", { headers });
```

## Proxying Requests

```typescript
const response = await fetch("http://example.com", {
  proxy: "http://proxy.com",
});

// With custom proxy headers
const response2 = await fetch("http://example.com", {
  proxy: {
    url: "http://proxy.com",
    headers: {
      "Proxy-Authorization": "Bearer my-token",
      "X-Custom-Proxy-Header": "value",
    },
  },
});
```

## Response Bodies

Available methods:

- `response.text(): Promise<string>`
- `response.json(): Promise<any>`
- `response.formData(): Promise<FormData>`
- `response.bytes(): Promise<Uint8Array>`
- `response.arrayBuffer(): Promise<ArrayBuffer>`
- `response.blob(): Promise<Blob>`

### Streaming Response Bodies

```typescript
const response = await fetch("http://example.com");

// Async iterator
for await (const chunk of response.body) {
  console.log(chunk);
}

// ReadableStream
const stream = response.body;
const reader = stream.getReader();
const { value, done } = await reader.read();
```

### Streaming Request Bodies

```typescript
const stream = new ReadableStream({
  start(controller) {
    controller.enqueue("Hello");
    controller.enqueue(" ");
    controller.enqueue("World");
    controller.close();
  },
});

const response = await fetch("http://example.com", {
  method: "POST",
  body: stream,
});
```

## Timeout and Cancellation

### Timeout

```typescript
const response = await fetch("http://example.com", {
  signal: AbortSignal.timeout(1000),
});
```

### Cancellation

```typescript
const controller = new AbortController();

const response = await fetch("http://example.com", {
  signal: controller.signal,
});

controller.abort();
```

## Unix Domain Sockets

```typescript
const response = await fetch("https://hostname/a/path", {
  unix: "/var/run/path/to/unix.sock",
  method: "POST",
  body: JSON.stringify({ message: "Hello from Bun!" }),
  headers: {
    "Content-Type": "application/json",
  },
});
```

## TLS Configuration

### Client Certificates

```typescript
await fetch("https://example.com", {
  tls: {
    key: Bun.file("/path/to/key.pem"),
    cert: Bun.file("/path/to/cert.pem"),
    // ca: [Bun.file("/path/to/ca.pem")],
  },
});
```

### Custom TLS Validation

```typescript
await fetch("https://example.com", {
  tls: {
    checkServerIdentity: (hostname, peerCertificate) => {
      // Return an Error if the certificate is invalid
    },
  },
});
```

### Disable TLS Validation

```typescript
await fetch("https://example.com", {
  tls: {
    rejectUnauthorized: false,
  },
});
```

## Protocol Support

### S3 URLs

```typescript
// Using environment variables for credentials
const response = await fetch("s3://my-bucket/path/to/object");

// Explicit credentials
const response2 = await fetch("s3://my-bucket/path/to/object", {
  s3: {
    accessKeyId: "YOUR_ACCESS_KEY",
    secretAccessKey: "YOUR_SECRET_KEY",
    region: "us-east-1",
  },
});
```

### File URLs

```typescript
const response = await fetch("file:///path/to/file.txt");
const text = await response.text();
```

### Data URLs

```typescript
const response = await fetch("data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==");
const text = await response.text(); // "Hello, World!"
```

### Blob URLs

```typescript
const blob = new Blob(["Hello, World!"], { type: "text/plain" });
const url = URL.createObjectURL(blob);
const response = await fetch(url);
```

## Request Options

```typescript
const response = await fetch("http://example.com", {
  // Control automatic response decompression (default: true)
  // Supports gzip, deflate, brotli (br), and zstd
  decompress: true,

  // Disable connection reuse for this request
  keepalive: false,

  // Debug logging level
  verbose: true, // or "curl" for more detailed output
});
```

## Performance

### DNS Prefetching

```typescript
import { dns } from "bun";

dns.prefetch("bun.com");
```

### Preconnect

```typescript
import { fetch } from "bun";

fetch.preconnect("https://bun.com");
```

Preconnect at startup:

```bash
bun --fetch-preconnect https://bun.com ./my-script.ts
```

### Connection Pooling

Bun automatically reuses connections (HTTP keep-alive). Default limit: 256 simultaneous connections.

Override the limit:

```bash
BUN_CONFIG_MAX_HTTP_REQUESTS=512 bun ./my-script.ts
```

### Response Buffering

Use `Bun.write` for efficient file writes:

```typescript
import { write } from "bun";

await write("output.txt", response);
```

## Debugging

```typescript
const response = await fetch("http://example.com", {
  verbose: true,
});
```

Output:

```
[fetch] > HTTP/1.1 GET http://example.com/
[fetch] > Connection: keep-alive
[fetch] > User-Agent: Bun/1.3.3
[fetch] > Accept: */*
[fetch] > Host: example.com
[fetch] > Accept-Encoding: gzip, deflate, br, zstd

[fetch] < 200 OK
[fetch] < Content-Encoding: gzip
[fetch] < Content-Type: text/html; charset=UTF-8
```

## Implementation Details

- Connection pooling enabled by default, disable with `keepalive: false`
- Large file uploads (>32KB) use `sendfile` syscall for HTTP requests
- S3 operations automatically handle signing and authentication
- Automatic Content-Type handling for `Blob` and `FormData`

---

[1]: https://bun.sh/docs/runtime/networking/fetch "Bun Fetch Documentation"
