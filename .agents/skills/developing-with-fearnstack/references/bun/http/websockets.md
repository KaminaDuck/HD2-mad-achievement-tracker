---
title: "Bun WebSockets"
description: "Server-side WebSockets with compression, TLS, and Pub/Sub"
type: "api-reference"
tags: ["bun", "websockets", "http", "real-time", "pub-sub", "server"]
category: "typescript"
subcategory: "http"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun WebSockets Documentation"
    url: "https://bun.sh/docs/runtime/http/websockets"
related:
  - "../README.md"
  - "./server.md"
  - "./routing.md"
author: "unknown"
contributors: []
---

# Bun WebSockets

`Bun.serve()` supports server-side WebSockets with on-the-fly compression, TLS support, and a native publish-subscribe API. ([Bun Docs][1])

## Performance

Bun can handle **7x more throughput** than Node.js + `ws`:

| Messages per second | Runtime | Clients |
|--------------------|---------|---------|
| ~700,000 | Bun v0.2.1 | 16 |
| ~100,000 | Node v18.10.0 + ws | 16 |

Built on [uWebSockets](https://github.com/uNetworking/uWebSockets).

## Basic Setup

```typescript
Bun.serve({
  fetch(req, server) {
    // Upgrade the request to WebSocket
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket: {
    message(ws, message) {
      ws.send(message); // echo back
    },
    open(ws) {},
    close(ws, code, message) {},
    drain(ws) {},
  },
});
```

## Sending Messages

```typescript
Bun.serve({
  fetch(req, server) {},
  websocket: {
    message(ws, message) {
      ws.send("Hello world");           // string
      ws.send(response.arrayBuffer());  // ArrayBuffer
      ws.send(new Uint8Array([1, 2, 3])); // TypedArray | DataView
    },
  },
});
```

## Headers

Attach headers to the upgrade response:

```typescript
Bun.serve({
  fetch(req, server) {
    const sessionId = await generateSessionId();
    server.upgrade(req, {
      headers: {
        "Set-Cookie": `SessionId=${sessionId}`,
      },
    });
  },
  websocket: {},
});
```

## Contextual Data

Attach data to WebSocket connections:

```typescript
type WebSocketData = {
  createdAt: number;
  channelId: string;
  authToken: string;
};

Bun.serve({
  fetch(req, server) {
    const cookies = new Bun.CookieMap(req.headers.get("cookie")!);

    server.upgrade(req, {
      data: {
        createdAt: Date.now(),
        channelId: new URL(req.url).searchParams.get("channelId"),
        authToken: cookies.get("X-Token"),
      },
    });
    return undefined;
  },
  websocket: {
    // Type ws.data
    data: {} as WebSocketData,
    async message(ws, message) {
      const user = getUserFromToken(ws.data.authToken);
      await saveMessageToDatabase({
        channel: ws.data.channelId,
        message: String(message),
        userId: user.id,
      });
    },
  },
});
```

## Browser Client

```javascript
const socket = new WebSocket("ws://localhost:3000/chat");

socket.addEventListener("message", event => {
  console.log(event.data);
});
```

## Pub/Sub

Native publish-subscribe API:

```typescript
const server = Bun.serve({
  fetch(req, server) {
    const url = new URL(req.url);
    if (url.pathname === "/chat") {
      const username = getUsernameFromReq(req);
      const success = server.upgrade(req, { data: { username } });
      return success ? undefined : new Response("Upgrade error", { status: 400 });
    }
    return new Response("Hello world");
  },
  websocket: {
    data: {} as { username: string },
    open(ws) {
      const msg = `${ws.data.username} has entered the chat`;
      ws.subscribe("the-group-chat");
      server.publish("the-group-chat", msg);
    },
    message(ws, message) {
      server.publish("the-group-chat", `${ws.data.username}: ${message}`);
      console.log(ws.subscriptions); // ["the-group-chat"]
    },
    close(ws) {
      const msg = `${ws.data.username} has left the chat`;
      ws.unsubscribe("the-group-chat");
      server.publish("the-group-chat", msg);
    },
  },
});
```

### Publishing from Server

```typescript
const server = Bun.serve({ websocket: { ... } });

// External event broadcast
server.publish("the-group-chat", "Hello world");
```

## Compression

Enable per-message deflate compression:

```typescript
Bun.serve({
  websocket: {
    perMessageDeflate: true,
  },
});

// Per-message compression
ws.send("Hello world", true);
```

## Backpressure

`.send()` returns a number indicating the result:

- `-1` — Enqueued but backpressure exists
- `0` — Dropped due to connection issue
- `1+` — Number of bytes sent

## Timeouts and Limits

```typescript
Bun.serve({
  websocket: {
    idleTimeout: 60,        // Seconds (default: 120)
    maxPayloadLength: 1024 * 1024, // Bytes (default: 16 MB)
  },
});
```

## WebSocket Client

Connect to WebSocket servers:

```typescript
const socket = new WebSocket("ws://localhost:3000");

// With subprotocol negotiation
const socket2 = new WebSocket("ws://localhost:3000", ["soap", "wamp"]);

// Bun extension: custom headers (won't work in browsers)
const socket = new WebSocket("ws://localhost:3000", {
  headers: { /* custom headers */ },
});

// Event listeners
socket.addEventListener("message", event => {});
socket.addEventListener("open", event => {});
socket.addEventListener("close", event => {});
socket.addEventListener("error", event => {});
```

## Configuration Options

```typescript
Bun.serve({
  websocket: {
    maxPayloadLength: 16 * 1024 * 1024, // 16 MB default
    idleTimeout: 120,                    // seconds
    backpressureLimit: 1024 * 1024,      // 1 MB
    closeOnBackpressureLimit: false,
    sendPings: true,
    publishToSelf: false,
    perMessageDeflate: true,
  },
});
```

## ServerWebSocket API

```typescript
interface ServerWebSocket {
  readonly data: any;
  readonly readyState: number;
  readonly remoteAddress: string;
  readonly subscriptions: string[];

  send(message: string | ArrayBuffer | Uint8Array, compress?: boolean): number;
  close(code?: number, reason?: string): void;
  subscribe(topic: string): void;
  unsubscribe(topic: string): void;
  publish(topic: string, message: string | ArrayBuffer | Uint8Array): void;
  isSubscribed(topic: string): boolean;
  cork(cb: (ws: ServerWebSocket) => void): void;
}
```

---

[1]: https://bun.sh/docs/runtime/http/websockets "Bun WebSockets Documentation"
