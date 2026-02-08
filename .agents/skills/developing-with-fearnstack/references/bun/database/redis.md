---
title: "Bun Redis"
description: "Native Redis client with Promise-based API, Pub/Sub, and automatic pipelining"
type: "api-reference"
tags: ["bun", "redis", "database", "cache", "pub-sub", "key-value"]
category: "typescript"
subcategory: "database"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Redis Documentation"
    url: "https://bun.sh/docs/runtime/redis"
related:
  - "../README.md"
  - "./sql.md"
  - "./sqlite.md"
author: "unknown"
contributors: []
---

# Bun Redis

Bun provides native bindings for working with Redis databases with a modern, Promise-based API. Supports Redis server versions 7.2 and up. ([Bun Docs][1])

```typescript
import { redis } from "bun";

await redis.set("greeting", "Hello from Bun!");
const greeting = await redis.get("greeting"); // "Hello from Bun!"

await redis.set("counter", 0);
await redis.incr("counter");

const exists = await redis.exists("greeting");
await redis.del("greeting");
```

## Getting Started

```typescript
import { redis, RedisClient } from "bun";

// Using default client (reads REDIS_URL or VALKEY_URL env var)
await redis.set("hello", "world");
const result = await redis.get("hello");

// Creating a custom client
const client = new RedisClient("redis://username:password@localhost:6379");
await client.set("counter", "0");
await client.incr("counter");
```

### Environment Variables

Checked in order of precedence:
- `REDIS_URL`
- `VALKEY_URL`
- Defaults to `"redis://localhost:6379"`

## Connection Lifecycle

```typescript
const client = new RedisClient();

// First command initiates connection
await client.set("key", "value");

// Connection remains open for subsequent commands
await client.get("key");

// Explicit close when done
client.close();
```

### Manual Connection Control

```typescript
const client = new RedisClient();
await client.connect();
await client.set("key", "value");
client.close();
```

## Basic Operations

### String Operations

```typescript
await redis.set("user:1:name", "Alice");
const name = await redis.get("user:1:name");
const buffer = await redis.getBuffer("user:1:name"); // Uint8Array

await redis.del("user:1:name");
const exists = await redis.exists("user:1:name");

// Expiration
await redis.set("session:123", "active");
await redis.expire("session:123", 3600); // 1 hour
const ttl = await redis.ttl("session:123");
```

### Numeric Operations

```typescript
await redis.set("counter", "0");
await redis.incr("counter");
await redis.decr("counter");
```

### Hash Operations

```typescript
await redis.hmset("user:123", [
  "name", "Alice",
  "email", "alice@example.com",
  "active", "true"
]);

const userFields = await redis.hmget("user:123", ["name", "email"]);
// ["Alice", "alice@example.com"]

const userName = await redis.hget("user:123", "name"); // "Alice"

await redis.hincrby("user:123", "visits", 1);
await redis.hincrbyfloat("user:123", "score", 1.5);
```

### Set Operations

```typescript
await redis.sadd("tags", "javascript");
await redis.srem("tags", "javascript");

const isMember = await redis.sismember("tags", "javascript");
const allTags = await redis.smembers("tags");
const randomTag = await redis.srandmember("tags");
const poppedTag = await redis.spop("tags");
```

## Pub/Sub

### Publishing

```typescript
import { RedisClient } from "bun";

const writer = new RedisClient("redis://localhost:6379");
await writer.connect();
writer.publish("general", "Hello everyone!");
writer.close();
```

### Subscribing

```typescript
import { RedisClient } from "bun";

const listener = new RedisClient("redis://localhost:6379");
await listener.connect();

await listener.subscribe("general", (message, channel) => {
  console.log(`Received: ${message}`);
});
```

### Separate Connection for Commands

Subscription mode takes over the connection. Use `.duplicate()` for commands:

```typescript
const redis = new RedisClient("redis://localhost:6379");
await redis.connect();
const subscriber = await redis.duplicate();

await subscriber.subscribe("foo", () => {});
await redis.set("bar", "baz"); // Still works on original connection
```

### Unsubscribing

```typescript
await client.unsubscribe();              // All channels
await client.unsubscribe(channel);       // Specific channel
await client.unsubscribe(channel, fn);   // Specific listener
```

## Pipelining

Commands are automatically pipelined:

```typescript
const [infoResult, listResult] = await Promise.all([
  redis.get("user:1:name"),
  redis.get("user:2:email")
]);
```

Disable auto-pipelining:

```typescript
const client = new RedisClient("redis://localhost:6379", {
  enableAutoPipelining: false,
});
```

## Raw Commands

Use `send` for commands without convenience methods:

```typescript
const info = await redis.send("INFO", []);

await redis.send("LPUSH", ["mylist", "value1", "value2"]);
const list = await redis.send("LRANGE", ["mylist", "0", "-1"]);
```

## Connection Events

```typescript
client.onconnect = () => {
  console.log("Connected to Redis server");
};

client.onclose = error => {
  console.error("Disconnected:", error);
};
```

## Connection Status

```typescript
console.log(client.connected);       // boolean
console.log(client.bufferedAmount);  // bytes buffered
```

## Connection Options

```typescript
const client = new RedisClient("redis://localhost:6379", {
  connectionTimeout: 5000,    // Default: 10000
  idleTimeout: 30000,         // Default: 0 (no timeout)
  autoReconnect: true,        // Default: true
  maxRetries: 10,             // Default: 10
  enableOfflineQueue: true,   // Default: true
  enableAutoPipelining: true, // Default: true

  // TLS options
  tls: true,
  // Or custom TLS config:
  // tls: {
  //   rejectUnauthorized: true,
  //   ca: "path/to/ca.pem",
  //   cert: "path/to/cert.pem",
  //   key: "path/to/key.pem",
  // }
});
```

## Reconnection Behavior

1. Starts with 50ms delay, doubles each attempt
2. Capped at 2000ms (2 seconds)
3. Attempts up to `maxRetries` times
4. Commands queued if `enableOfflineQueue` is true

## URL Formats

```typescript
// Standard
new RedisClient("redis://localhost:6379");

// With auth
new RedisClient("redis://username:password@localhost:6379");

// With database number
new RedisClient("redis://localhost:6379/0");

// TLS
new RedisClient("rediss://localhost:6379");
new RedisClient("redis+tls://localhost:6379");

// Unix socket
new RedisClient("redis+unix:///path/to/socket");

// TLS over Unix socket
new RedisClient("redis+tls+unix:///path/to/socket");
```

## Error Handling

```typescript
try {
  await redis.get("non-existent-key");
} catch (error) {
  if (error.code === "ERR_REDIS_CONNECTION_CLOSED") {
    console.error("Connection closed");
  } else if (error.code === "ERR_REDIS_AUTHENTICATION_FAILED") {
    console.error("Authentication failed");
  }
}
```

Common error codes:
- `ERR_REDIS_CONNECTION_CLOSED`
- `ERR_REDIS_AUTHENTICATION_FAILED`
- `ERR_REDIS_INVALID_RESPONSE`

## Example Use Cases

### Caching

```typescript
async function getUserWithCache(userId) {
  const cacheKey = `user:${userId}`;

  const cachedUser = await redis.get(cacheKey);
  if (cachedUser) {
    return JSON.parse(cachedUser);
  }

  const user = await database.getUser(userId);
  await redis.set(cacheKey, JSON.stringify(user));
  await redis.expire(cacheKey, 3600);

  return user;
}
```

### Rate Limiting

```typescript
async function rateLimit(ip, limit = 100, windowSecs = 3600) {
  const key = `ratelimit:${ip}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, windowSecs);
  }

  return {
    limited: count > limit,
    remaining: Math.max(0, limit - count),
  };
}
```

### Session Storage

```typescript
async function createSession(userId, data) {
  const sessionId = crypto.randomUUID();
  const key = `session:${sessionId}`;

  await redis.hmset(key, [
    "userId", userId.toString(),
    "created", Date.now().toString(),
    "data", JSON.stringify(data)
  ]);
  await redis.expire(key, 86400); // 24 hours

  return sessionId;
}

async function getSession(sessionId) {
  const key = `session:${sessionId}`;

  const exists = await redis.exists(key);
  if (!exists) return null;

  const [userId, created, data] = await redis.hmget(key, [
    "userId", "created", "data"
  ]);

  return {
    userId: Number(userId),
    created: Number(created),
    data: JSON.parse(data),
  };
}
```

## Type Conversion

- Integer responses → JavaScript numbers
- Bulk strings → JavaScript strings
- Null bulk strings → `null`
- Array responses → JavaScript arrays
- Error responses → JavaScript errors
- Boolean responses (RESP3) → JavaScript booleans
- Map responses (RESP3) → JavaScript objects
- `EXISTS`, `SISMEMBER` → boolean

## Limitations

Current limitations:
- Transactions (MULTI/EXEC) via raw commands only

Unsupported:
- Redis Sentinel
- Redis Cluster

---

[1]: https://bun.sh/docs/runtime/redis "Bun Redis Documentation"
