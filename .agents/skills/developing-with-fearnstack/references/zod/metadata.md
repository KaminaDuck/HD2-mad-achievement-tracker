---
title: "Zod Metadata and Registries"
description: "Attaching and managing metadata on Zod schemas"
type: "concept-guide"
tags: ["zod", "typescript", "validation", "metadata", "registries", "documentation"]
category: "typescript"
subcategory: "validation"
version: "4.2.1"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod Metadata"
    url: "https://zod.dev/metadata"
related: ["README.md", "json-schema.md", "api-reference.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod Metadata and Registries

Associate schemas with metadata for documentation, code generation, AI structured outputs, and form validation. ([Zod Metadata][1])

## Registries

Registries are collections of schemas with strongly-typed metadata. ([Zod Metadata][1])

### Creating a Registry

```typescript
import * as z from "zod";

const myRegistry = z.registry<{ description: string }>();
```

### Registry Operations

```typescript
const mySchema = z.string();

myRegistry.add(mySchema, { description: "A cool schema!" });
myRegistry.has(mySchema);    // => true
myRegistry.get(mySchema);    // => { description: "A cool schema!" }
myRegistry.remove(mySchema);
myRegistry.clear();          // wipe registry
```

TypeScript enforces metadata matches the registry's type:

```typescript
myRegistry.add(mySchema, { description: "A cool schema!" }); // ✅
myRegistry.add(mySchema, { description: 123 }); // ❌ Type error
```

**Special handling for `id`**: Registries throw an Error if multiple schemas are registered with the same `id` value.

### `.register()` Method

Register schemas inline. ([Zod Metadata][1])

```typescript
const mySchema = z.object({
  name: z.string().register(myRegistry, { description: "The user's name" }),
  age: z.number().register(myRegistry, { description: "The user's age" }),
});
```

**Note:** `.register()` returns the original schema, not a new instance.

### Registries Without Metadata

Use as a generic collection:

```typescript
const myRegistry = z.registry();

myRegistry.add(z.string());
myRegistry.add(z.number());
```

## Global Registry

Zod provides `z.globalRegistry` for common metadata fields. ([Zod Metadata][1])

### GlobalMeta Interface

```typescript
interface GlobalMeta {
  id?: string;
  title?: string;
  description?: string;
  deprecated?: boolean;
  [k: string]: unknown;
}
```

### Registering in Global Registry

```typescript
const emailSchema = z.email().register(z.globalRegistry, {
  id: "email_address",
  title: "Email address",
  description: "Your email address",
  examples: ["first.last@example.com"]
});
```

### Extending GlobalMeta

Use declaration merging to add custom fields. Create `zod.d.ts`:

```typescript
declare module "zod" {
  interface GlobalMeta {
    examples?: unknown[];
  }
}

export {}
```

## The `.meta()` Method

Convenience method for `z.globalRegistry`. ([Zod Metadata][1])

```typescript
const emailSchema = z.email().meta({
  id: "email_address",
  title: "Email address",
  description: "Please enter a valid email address",
});
```

### Retrieving Metadata

Call `.meta()` without arguments:

```typescript
emailSchema.meta();
// => { id: "email_address", title: "Email address", ... }
```

### Metadata Instance Binding

Metadata associates with specific schema instances. Transformative methods return new instances:

```typescript
const A = z.string().meta({ description: "A cool string" });
A.meta(); // => { description: "A cool string" }

const B = A.refine(_ => true);
B.meta(); // => undefined (new instance, not registered)
```

## The `.describe()` Method

Shorthand for adding just a `description` field. ([Zod Metadata][1])

```typescript
const emailSchema = z.email().describe("An email address");

// Equivalent to:
emailSchema.meta({ description: "An email address" });
```

**Note:** `.meta()` is now the recommended approach.

## Custom Registry Patterns

### Referencing Inferred Types

Use `z.$output` and `z.$input` symbols. ([Zod Metadata][1])

```typescript
type MyMeta = { examples: z.$output[] };
const myRegistry = z.registry<MyMeta>();

myRegistry.add(z.string(), { examples: ["hello", "world"] });
myRegistry.add(z.number(), { examples: [1, 2, 3] });
```

### Constraining Schema Types

Restrict which schemas can be added:

```typescript
const stringRegistry = z.registry<{ description: string }, z.ZodString>();

stringRegistry.add(z.string(), { description: "A string" }); // ✅
stringRegistry.add(z.number(), { description: "A number" }); // ❌
// 'ZodNumber' is not assignable to parameter of type 'ZodString'
```

## JSON Schema Integration

Metadata is automatically included in JSON Schema conversion:

```typescript
const schema = z.string().meta({
  title: "Username",
  description: "Your unique username"
});

z.toJSONSchema(schema);
// => {
//   type: "string",
//   title: "Username",
//   description: "Your unique username"
// }
```

See [JSON Schema Conversion](json-schema.md) for details.

## Use Cases

1. **API Documentation** - Add descriptions for OpenAPI generation
2. **Form Validation** - Store field labels and error messages
3. **AI Structured Outputs** - Provide context for LLM tools
4. **Code Generation** - Attach metadata for generators
5. **Schema Catalogs** - Build searchable schema registries

## References

[1]: https://zod.dev/metadata "Zod Metadata and Registries"
