---
title: "Zod JSON Schema Conversion"
description: "Convert Zod schemas to and from JSON Schema format"
type: "api-reference"
tags: ["zod", "typescript", "json-schema", "openapi", "ai", "structured-outputs"]
category: "typescript"
subcategory: "validation"
version: "4.2.1"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod JSON Schema"
    url: "https://zod.dev/json-schema"
related: ["README.md", "metadata.md", "api-reference.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod JSON Schema Conversion

Zod 4 introduces native JSON Schema conversion for OpenAPI definitions and AI structured outputs. ([Zod JSON Schema][1])

## Converting to JSON Schema

### `z.toJSONSchema()`

Convert a Zod schema to JSON Schema format. ([Zod JSON Schema][1])

```typescript
import * as z from "zod";

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

z.toJSONSchema(schema);
// => {
//   type: 'object',
//   properties: { name: { type: 'string' }, age: { type: 'number' } },
//   required: ['name', 'age'],
//   additionalProperties: false,
// }
```

### `z.fromJSONSchema()` (Experimental)

Convert a JSON Schema to a Zod schema. ([Zod JSON Schema][1])

```typescript
const jsonSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    age: { type: "number" },
  },
  required: ["name", "age"],
};

const zodSchema = z.fromJSONSchema(jsonSchema);
```

## Configuration Options

```typescript
z.toJSONSchema(schema, {
  target: "draft-2020-12",     // JSON Schema version
  io: "output",                // Extract input or output type
  unrepresentable: "throw",    // Handle unconvertible types
  cycles: "ref",               // Handle circular references
  reused: "inline",            // Handle reused schemas
  uri: (id) => id,             // Convert IDs to URIs
});
```

### Target Versions

```typescript
z.toJSONSchema(schema, { target: "draft-2020-12" }); // default
z.toJSONSchema(schema, { target: "draft-07" });
z.toJSONSchema(schema, { target: "draft-04" });
z.toJSONSchema(schema, { target: "openapi-3.0" });
```

### Input vs Output Types (`io`)

For schemas with transforms, extract the appropriate type. ([Zod JSON Schema][1])

```typescript
const mySchema = z.string().transform(val => val.length).pipe(z.number());

z.toJSONSchema(mySchema);
// => { type: "number" }

z.toJSONSchema(mySchema, { io: "input" });
// => { type: "string" }
```

### Unrepresentable Types

Some types cannot be converted to JSON Schema. ([Zod JSON Schema][1])

```typescript
// Unrepresentable types (throw by default):
z.bigint();
z.int64();
z.symbol();
z.undefined();
z.void();
z.date();
z.map();
z.set();
z.transform();
z.nan();
z.custom();
```

Handle with `unrepresentable: "any"`:

```typescript
z.toJSONSchema(z.bigint(), { unrepresentable: "any" });
// => {}  (equivalent to unknown)
```

### Cycles and Circular References

Cycles are represented using `$ref` by default. ([Zod JSON Schema][1])

```typescript
const User = z.object({
  name: z.string(),
  get friend() {
    return User;
  },
});

z.toJSONSchema(User);
// => {
//   type: 'object',
//   properties: {
//     name: { type: 'string' },
//     friend: { '$ref': '#' }
//   },
//   ...
// }
```

### Reused Schemas

Control how reused schemas are handled. ([Zod JSON Schema][1])

```typescript
const name = z.string();
const User = z.object({
  firstName: name,
  lastName: name,
});

// Inline (default)
z.toJSONSchema(User);
// => properties: { firstName: { type: 'string' }, lastName: { type: 'string' } }

// Extract as $defs
z.toJSONSchema(User, { reused: "ref" });
// => properties: {
//      firstName: { '$ref': '#/$defs/__schema0' },
//      lastName: { '$ref': '#/$defs/__schema0' }
//    },
//    '$defs': { __schema0: { type: 'string' } }
```

## Metadata Integration

Metadata from `z.globalRegistry` is included in the output. ([Zod JSON Schema][1])

```typescript
const emailSchema = z.string().meta({
  title: "Email address",
  description: "Your email address",
});

z.toJSONSchema(emailSchema);
// => { type: "string", title: "Email address", description: "Your email address" }
```

## Type Conversions

### String Formats

```typescript
z.email();           // => { type: "string", format: "email" }
z.iso.datetime();    // => { type: "string", format: "date-time" }
z.iso.date();        // => { type: "string", format: "date" }
z.uuid();            // => { type: "string", format: "uuid" }
z.url();             // => { type: "string", format: "uri" }
z.ipv4();            // => { type: "string", format: "ipv4" }
z.ipv6();            // => { type: "string", format: "ipv6" }
z.base64();          // => { type: "string", contentEncoding: "base64" }
```

### Numeric Types

```typescript
z.number();          // => { type: "number" }
z.int();             // => { type: "integer" }
z.float32();         // => { type: "number", exclusiveMinimum: ..., exclusiveMaximum: ... }
z.int32();           // => { type: "integer", exclusiveMinimum: ..., exclusiveMaximum: ... }
```

### Object Schemas

```typescript
// z.object() includes additionalProperties: false by default
z.object({ name: z.string() });
// => { ..., additionalProperties: false }

// z.looseObject() never sets additionalProperties: false
// z.strictObject() always sets additionalProperties: false
```

### File Schemas

```typescript
z.file();
// => { type: "string", format: "binary", contentEncoding: "binary" }

z.file().min(1).max(1024 * 1024).mime("image/png");
// => {
//   type: "string",
//   format: "binary",
//   contentEncoding: "binary",
//   contentMediaType: "image/png",
//   minLength: 1,
//   maxLength: 1048576,
// }
```

## Registry-Based Conversion

Convert an entire registry to interlinked JSON Schemas. ([Zod JSON Schema][1])

```typescript
z.globalRegistry.add(User, { id: "User" });
z.globalRegistry.add(Post, { id: "Post" });

z.toJSONSchema(z.globalRegistry);
// => {
//   schemas: {
//     User: { id: 'User', type: 'object', ... },
//     Post: { id: 'Post', type: 'object', ... }
//   }
// }
```

With absolute URIs:

```typescript
z.toJSONSchema(z.globalRegistry, {
  uri: (id) => `https://example.com/${id}.json`
});
```

## Custom Override Logic

```typescript
z.toJSONSchema(z.date(), {
  unrepresentable: "any",
  override: (ctx) => {
    if (ctx.zodSchema._zod.def.type === "date") {
      ctx.jsonSchema.type = "string";
      ctx.jsonSchema.format = "date-time";
    }
  },
});
```

## References

[1]: https://zod.dev/json-schema "Zod JSON Schema"
