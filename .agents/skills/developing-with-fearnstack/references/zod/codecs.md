---
title: "Zod Codecs"
description: "Bidirectional transformations with encode and decode"
type: "concept-guide"
tags: ["zod", "typescript", "validation", "codecs", "transformations", "serialization"]
category: "typescript"
subcategory: "validation"
version: "4.2.1"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod Codecs"
    url: "https://zod.dev/codecs"
related: ["README.md", "api-reference.md", "basics.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod Codecs

Introduced in `zod@4.1`, codecs implement bidirectional transformations between two schemas. ([Zod Codecs][1])

## Overview

All Zod schemas support both forward and backward processing:

- **Forward**: `Input` to `Output` via `.parse()` / `.decode()`
- **Backward**: `Output` to `Input` via `.encode()`

```typescript
const schema = z.string();

schema.parse("asdf");   // => "asdf"
schema.decode("asdf");  // => "asdf"
schema.encode("asdf");  // => "asdf"
```

## Defining Codecs

Codecs define bidirectional transformations. ([Zod Codecs][1])

```typescript
const stringToDate = z.codec(
  z.iso.datetime(),  // input schema: ISO date string
  z.date(),          // output schema: Date object
  {
    decode: (isoString) => new Date(isoString), // ISO string → Date
    encode: (date) => date.toISOString(),       // Date → ISO string
  }
);
```

### Using Codecs

```typescript
// Decode: Input → Output
stringToDate.decode("2024-01-15T10:30:00.000Z");
// => Date

// Encode: Output → Input
stringToDate.encode(new Date("2024-01-15T10:30:00.000Z"));
// => "2024-01-15T10:30:00.000Z"
```

## Type-Safe Inputs

Unlike `.parse()` which accepts `unknown`, `.decode()` and `.encode()` have strongly-typed inputs. ([Zod Codecs][1])

```typescript
stringToDate.parse(12345);
// No TypeScript error (fails at runtime)

stringToDate.decode(12345);
// ❌ TypeScript error: 'number' not assignable to 'string'

stringToDate.encode(12345);
// ❌ TypeScript error: 'number' not assignable to 'Date'
```

## Composability

Codecs work anywhere schemas work - objects, arrays, pipes, etc. ([Zod Codecs][1])

```typescript
const payloadSchema = z.object({
  startDate: stringToDate
});

payloadSchema.decode({
  startDate: "2024-01-15T10:30:00.000Z"
}); // => { startDate: Date }
```

## Async and Safe Variants

```typescript
// Async codecs
const asyncCodec = z.codec(z.string(), z.number(), {
  decode: async (str) => Number(str),
  encode: async (num) => num.toString(),
});

// Safe variants
stringToDate.safeDecode("2024-01-15T10:30:00.000Z");
// => { success: true, data: Date } | { success: false, error: ZodError }

stringToDate.safeDecodeAsync("2024-01-15T10:30:00.000Z");
// => Promise<{ success: true, data: Date } | { success: false, error: ZodError }>
```

## How Encoding Works

### Refinements

Refinements execute in both directions. ([Zod Codecs][1])

```typescript
const schema = stringToDate.refine(
  (date) => date.getFullYear() >= 2000,
  "Must be this millennium"
);

schema.encode(new Date("2000-01-01")); // ✅
schema.encode(new Date("1999-01-01")); // ❌ ZodError
```

### Defaults and Prefaults

Defaults only apply in the forward direction. ([Zod Codecs][1])

```typescript
const withDefault = z.string().default("hello");

withDefault.decode(undefined); // => "hello"
withDefault.encode(undefined); // ❌ ZodError
```

### Transforms

Unidirectional transforms throw at runtime during encoding. ([Zod Codecs][1])

```typescript
const schema = z.string().transform(val => val.length);

schema.encode(1234);
// ❌ Error: Encountered unidirectional transform during encode
```

## Useful Codec Implementations

Copy these into your project and customize as needed. ([Zod Codecs][1])

### String to Number

```typescript
const stringToNumber = z.codec(
  z.string().regex(z.regexes.number),
  z.number(),
  {
    decode: (str) => Number.parseFloat(str),
    encode: (num) => num.toString(),
  }
);
```

### String to Integer

```typescript
const stringToInt = z.codec(
  z.string().regex(z.regexes.integer),
  z.int(),
  {
    decode: (str) => Number.parseInt(str, 10),
    encode: (num) => num.toString(),
  }
);
```

### ISO Datetime to Date

```typescript
const isoDatetimeToDate = z.codec(z.iso.datetime(), z.date(), {
  decode: (isoString) => new Date(isoString),
  encode: (date) => date.toISOString(),
});
```

### Epoch Seconds to Date

```typescript
const epochSecondsToDate = z.codec(z.int().min(0), z.date(), {
  decode: (seconds) => new Date(seconds * 1000),
  encode: (date) => Math.floor(date.getTime() / 1000),
});
```

### JSON Codec

```typescript
const jsonCodec = <T extends z.core.$ZodType>(schema: T) =>
  z.codec(z.string(), schema, {
    decode: (jsonString, ctx) => {
      try {
        return JSON.parse(jsonString);
      } catch (err: any) {
        ctx.issues.push({
          code: "invalid_format",
          format: "json",
          input: jsonString,
          message: err.message,
        });
        return z.NEVER;
      }
    },
    encode: (value) => JSON.stringify(value),
  });
```

### Base64 to Bytes

```typescript
const base64ToBytes = z.codec(z.base64(), z.instanceof(Uint8Array), {
  decode: (base64String) => z.util.base64ToUint8Array(base64String),
  encode: (bytes) => z.util.uint8ArrayToBase64(bytes),
});
```

### String to URL

```typescript
const stringToURL = z.codec(z.url(), z.instanceof(URL), {
  decode: (urlString) => new URL(urlString),
  encode: (url) => url.href,
});
```

### URI Component

```typescript
const uriComponent = z.codec(z.string(), z.string(), {
  decode: (encoded) => decodeURIComponent(encoded),
  encode: (decoded) => encodeURIComponent(decoded),
});
```

## Network Boundary Use Case

Codecs are ideal for parsing data at network boundaries. Share a single schema between client and server to convert between JSON and richer JavaScript representations. ([Zod Codecs][1])

```typescript
// Shared schema
const ApiResponse = z.object({
  createdAt: isoDatetimeToDate,
  data: z.object({ ... }),
});

// Server: encode before sending
const response = ApiResponse.encode({ createdAt: new Date(), data: {...} });

// Client: decode after receiving
const parsed = ApiResponse.decode(response);
// parsed.createdAt is a Date object
```

## References

[1]: https://zod.dev/codecs "Zod Codecs"
