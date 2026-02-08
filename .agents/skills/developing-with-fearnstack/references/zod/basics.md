---
title: "Zod Basic Usage"
description: "Basic usage guide covering schema definition, parsing, error handling, and type inference"
type: "concept-guide"
tags: ["zod", "typescript", "validation", "schema", "parsing", "type-inference"]
category: "typescript"
subcategory: "validation"
version: "4.2.1"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod Basics"
    url: "https://zod.dev/basics"
  - name: "Zod Documentation"
    url: "https://zod.dev"
related: ["README.md", "api-reference.md", "error-handling.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod Basic Usage

This guide covers the fundamentals of creating schemas, parsing data, and using inferred types with Zod. ([Zod Basics][1])

## Defining a Schema

Before validating data, define a schema representing the expected structure. ([Zod Basics][1])

```typescript
import * as z from "zod";

const Player = z.object({
  username: z.string(),
  xp: z.number()
});
```

## Parsing Data

Use `.parse()` to validate input. If valid, Zod returns a strongly-typed deep clone of the input. ([Zod Basics][1])

```typescript
Player.parse({ username: "billie", xp: 100 });
// => returns { username: "billie", xp: 100 }
```

For asynchronous operations (async refinements or transforms), use `.parseAsync()`:

```typescript
await Player.parseAsync({ username: "billie", xp: 100 });
```

## Handling Errors

When validation fails, `.parse()` throws a `ZodError` with granular information about validation issues. ([Zod Basics][1])

```typescript
try {
  Player.parse({ username: 42, xp: "100" });
} catch (error) {
  if (error instanceof z.ZodError) {
    error.issues;
    /* [
      {
        expected: 'string',
        code: 'invalid_type',
        path: ['username'],
        message: 'Invalid input: expected string'
      },
      {
        expected: 'number',
        code: 'invalid_type',
        path: ['xp'],
        message: 'Invalid input: expected number'
      }
    ] */
  }
}
```

### Safe Parsing

To avoid try-catch blocks, use `.safeParse()` which returns a discriminated union result object. ([Zod Basics][1])

```typescript
const result = Player.safeParse({ username: 42, xp: "100" });

if (!result.success) {
  result.error;   // ZodError instance
} else {
  result.data;    // { username: string; xp: number }
}
```

For async schemas, use `.safeParseAsync()`:

```typescript
await schema.safeParseAsync("hello");
```

## Inferring Types

Zod infers static TypeScript types from schema definitions. Extract types using `z.infer<>`. ([Zod Basics][1])

```typescript
const Player = z.object({
  username: z.string(),
  xp: z.number()
});

// Extract the inferred type
type Player = z.infer<typeof Player>;

// Use it in your code
const player: Player = { username: "billie", xp: 100 };
```

### Input vs Output Types

When input and output types diverge (e.g., with transforms), extract them independently. ([Zod Basics][1])

```typescript
const mySchema = z.string().transform((val) => val.length);

type MySchemaIn = z.input<typeof mySchema>;
// => string

type MySchemaOut = z.output<typeof mySchema>; // equivalent to z.infer<typeof mySchema>
// => number
```

## Best Practices

1. **Use `.safeParse()` over `.parse()`** - Avoids exception handling overhead
2. **Define schemas at module level** - Reuse schemas across your application
3. **Extract types with `z.infer<>`** - Maintain single source of truth for types
4. **Use `z.input<>` and `z.output<>`** - Distinguish types when using transforms

## Next Steps

- [Zod v4 Reference](zod-v4-reference.md) - Complete API reference for Zod v4
- [Zod Documentation](https://zod.dev) - Official documentation

## References

[1]: https://zod.dev/basics "Zod Basic Usage"
