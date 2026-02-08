---
title: "Bun TCP & UDP"
description: "Low-level TCP and UDP socket APIs for high-performance networking"
type: "api-reference"
tags: ["bun", "tcp", "udp", "sockets", "networking", "low-level"]
category: "typescript"
subcategory: "http"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun TCP Documentation"
    url: "https://bun.sh/docs/runtime/networking/tcp"
  - name: "Bun UDP Documentation"
    url: "https://bun.sh/docs/runtime/networking/udp"
related:
  - "../README.md"
  - "./server.md"
  - "./fetch.md"
author: "unknown"
contributors: []
---

# Bun TCP & UDP

Low-level TCP and UDP socket APIs for implementing performance-sensitive systems like database clients, game servers, or real-time communication. ([TCP Docs][1], [UDP Docs][2])

## TCP Sockets

### Start a Server (`Bun.listen()`)

```typescript
Bun.listen({
  hostname: "localhost",
  port: 8080,
  socket: {
    data(socket, data) {},   // message received from client
    open(socket) {},         // socket opened
    close(socket, error) {}, // socket closed
    drain(socket) {},        // socket ready for more data
    error(socket, error) {}, // error handler
  },
});
```

#### Handler-Based Design

Bun declares handlers once per server instead of assigning callbacks to each socket. This reduces garbage collector pressure and memory usage.

#### Contextual Data

```typescript
type SocketData = { sessionId: string };

Bun.listen<SocketData>({
  hostname: "localhost",
  port: 8080,
  socket: {
    data(socket, data) {
      socket.write(`${socket.data.sessionId}: ack`);
    },
    open(socket) {
      socket.data = { sessionId: "abcd" };
    },
  },
});
```

#### TLS Support

```typescript
Bun.listen({
  hostname: "localhost",
  port: 8080,
  socket: {
    data(socket, data) {},
  },
  tls: {
    // can be string, BunFile, TypedArray, Buffer, or array thereof
    key: Bun.file("./key.pem"),
    cert: Bun.file("./cert.pem"),
  },
});
```

#### Server Control

```typescript
const server = Bun.listen({ /* config */ });

// Stop listening (parameter determines whether active connections are closed)
server.stop(true);

// Let Bun process exit even if server is still listening
server.unref();
```

### Create a Connection (`Bun.connect()`)

```typescript
const socket = await Bun.connect({
  hostname: "localhost",
  port: 8080,

  socket: {
    data(socket, data) {},
    open(socket) {},
    close(socket, error) {},
    drain(socket) {},
    error(socket, error) {},

    // client-specific handlers
    connectError(socket, error) {}, // connection failed
    end(socket) {},                 // connection closed by server
    timeout(socket) {},             // connection timed out
  },
});
```

With TLS:

```typescript
const socket = await Bun.connect({
  // ... config
  tls: true,
});
```

### Hot Reloading

Reload handlers for all active sockets:

```typescript
const server = Bun.listen({ /* config */ });

server.reload({
  socket: {
    data() {
      // new 'data' handler
    },
  },
});
```

### Buffering

TCP sockets do not buffer data. For performance, batch writes:

```typescript
// Slow - multiple system calls
socket.write("h");
socket.write("e");
socket.write("l");
socket.write("l");
socket.write("o");

// Fast - single system call
socket.write("hello");
```

Using `ArrayBufferSink` for buffering:

```typescript
import { ArrayBufferSink } from "bun";

const sink = new ArrayBufferSink();
sink.start({
  stream: true,
  highWaterMark: 1024,
});

sink.write("h");
sink.write("e");
sink.write("l");
sink.write("l");
sink.write("o");

queueMicrotask(() => {
  const data = sink.flush();
  const wrote = socket.write(data);
  if (wrote < data.byteLength) {
    // put it back in the sink if the socket is full
    sink.write(data.subarray(wrote));
  }
});
```

## UDP Sockets

### Bind a Socket (`Bun.udpSocket()`)

```typescript
// Auto-assigned port
const socket = await Bun.udpSocket({});
console.log(socket.port); // assigned by the operating system

// Specific port
const socket2 = await Bun.udpSocket({
  port: 41234,
});
console.log(socket2.port); // 41234
```

### Send a Datagram

```typescript
socket.send("Hello, world!", 41234, "127.0.0.1");
```

Note: The address must be a valid IP address - `send` does not perform DNS resolution.

### Receive Datagrams

```typescript
const server = await Bun.udpSocket({
  socket: {
    data(socket, buf, port, addr) {
      console.log(`message from ${addr}:${port}:`);
      console.log(buf.toString());
    },
  },
});

const client = await Bun.udpSocket({});
client.send("Hello!", server.port, "127.0.0.1");
```

### Connected Sockets

Connect to a specific peer for simplified sending:

```typescript
const server = await Bun.udpSocket({
  socket: {
    data(socket, buf, port, addr) {
      console.log(`message from ${addr}:${port}:`);
      console.log(buf.toString());
    },
  },
});

const client = await Bun.udpSocket({
  connect: {
    port: server.port,
    hostname: "127.0.0.1",
  },
});

// No need to specify destination
client.send("Hello");
```

### Batch Sending with `sendMany()`

#### Unconnected Socket

Each set of three elements describes a packet: data, port, address.

```typescript
const socket = await Bun.udpSocket({});

// sends 'Hello' to 127.0.0.1:41234, and 'foo' to 1.1.1.1:53
socket.sendMany(["Hello", 41234, "127.0.0.1", "foo", 53, "1.1.1.1"]);
```

#### Connected Socket

Each element is data to send to the peer:

```typescript
const socket = await Bun.udpSocket({
  connect: {
    port: 41234,
    hostname: "localhost",
  },
});

socket.sendMany(["foo", "bar", "baz"]);
```

### Backpressure Handling

Detect when packets don't fit in the OS buffer:

- `send` returns `false`
- `sendMany` returns less than the number of packets

Use the `drain` handler:

```typescript
const socket = await Bun.udpSocket({
  socket: {
    drain(socket) {
      // continue sending data
    },
  },
});
```

## Summary

| Feature | TCP | UDP |
|---------|-----|-----|
| Connection-oriented | Yes | No |
| Reliability | Guaranteed delivery | Best effort |
| Order | Ordered | Unordered |
| API | `Bun.listen()`, `Bun.connect()` | `Bun.udpSocket()` |
| Use cases | Database clients, HTTP | Voice chat, gaming |
| TLS support | Yes | No |

---

[1]: https://bun.sh/docs/runtime/networking/tcp "Bun TCP Documentation"
[2]: https://bun.sh/docs/runtime/networking/udp "Bun UDP Documentation"
