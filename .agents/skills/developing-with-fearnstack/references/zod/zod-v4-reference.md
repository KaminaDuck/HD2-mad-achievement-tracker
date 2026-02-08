---
title: "Zod v4 Library Reference"
description: "TypeScript-first schema validation with static type inference"
type: "tool-reference"
tags: ["typescript", "validation", "schema", "type-safety", "runtime-checking", "zod", "parsing"]
category: "typescript"
subcategory: "validation"
version: "4.2.1"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod v4 Documentation"
    url: "https://zod.dev/v4"
  - name: "Zod Documentation"
    url: "https://zod.dev"
  - name: "Zod GitHub"
    url: "https://github.com/colinhacks/zod"
  - name: "Zod Basics"
    url: "https://zod.dev/basics"
  - name: "Zod API Reference"
    url: "https://zod.dev/api"
  - name: "Zod Error Customization"
    url: "https://zod.dev/error-customization"
  - name: "Zod Metadata"
    url: "https://zod.dev/metadata"
  - name: "Zod JSON Schema"
    url: "https://zod.dev/json-schema"
  - name: "Zod v4 Migration"
    url: "https://zod.dev/v4/changelog"
related: ["README.md", "versions.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod v4 Library Reference

Zod is a TypeScript-first schema validation library that enables runtime type checking with full static type inference. ([Zod Docs][1]) Version 4 represents a major architectural redesign with significant performance improvements and new features after v3's three-year run. ([Zod v4][2])

## Overview

Zod enables developers to define a schema and parse data with it to receive a strongly typed, validated result. ([Zod GitHub][3]) The library has zero external dependencies, a tiny 2kb core bundle (gzipped), and works across Node.js and modern browsers. ([Zod Docs][1])

**Project Statistics:**
- 40.6k GitHub stars
- 488 contributors
- 2.7 million dependents
- 195+ releases (latest: v4.2.1, December 2024)
- MIT License

([Zod GitHub][3])

## Installation

```bash
npm install zod@^4.0.0
```

**Requirements:**
- TypeScript v5.5 or later
- Strict mode enabled in tsconfig.json

([Zod Docs][1])

For the tree-shakable variant, import from `"zod/mini"`. ([Zod v4][2])

## Core Concepts

### Schema Definition

Create schemas using Zod's fluent API. ([Zod Basics][4])

```typescript
import * as z from "zod";

const Player = z.object({
  username: z.string(),
  xp: z.number()
});
```

### Parsing Data

Use `.parse()` to validate input. If valid, Zod returns a strongly-typed deep clone of the input. ([Zod Basics][4])

```typescript
Player.parse({ username: "billie", xp: 100 });
```

For asynchronous operations, use `.parseAsync()` instead. ([Zod Basics][4])

### Error Handling

The `.parse()` method throws `ZodError` on validation failure. To avoid try-catch blocks, use `.safeParse()`, which returns a plain result object containing either the successfully parsed data or a ZodError. ([Zod Basics][4])

```typescript
const result = Player.safeParse({ username: 42, xp: "100" });

if (!result.success) {
  result.error;   // ZodError instance
} else {
  result.data;    // { username: string; xp: number }
}
```

### Type Inference

Extract inferred types using `z.infer<>`: ([Zod Basics][4])

```typescript
type Player = z.infer<typeof Player>;
const player: Player = { username: "billie", xp: 100 };
```

For schemas with transformations, distinguish between input and output types using `z.input<>` and `z.output<>`. ([Zod Basics][4])

## Primitive Types

Zod provides comprehensive schema validation through primitive and complex types. ([Zod API][5])

**Core Primitives:**
- `z.string()`
- `z.number()`
- `z.bigint()`
- `z.boolean()`
- `z.symbol()`
- `z.undefined()`
- `z.null()`

**Type Coercion:**
Use `z.coerce.*` variants to convert input data—for example, `z.coerce.number()` applies `Number()` conversion. ([Zod API][5])

### String Validation

Built-in string methods include length constraints (`min()`, `max()`, `length()`), pattern matching (`regex()`, `startsWith()`, `endsWith()`), and case transformations (`uppercase()`, `lowercase()`, `trim()`). ([Zod API][5])

**Format Validators:**
Email, UUID, URL, IP address, ISO datetime, JWT, and cryptographic hash validators are available. Custom formats are supported via `z.stringFormat()`. ([Zod API][5])

**v4 Change:** Format validators moved to top-level functions. Use `z.email()`, `z.uuid()`, `z.url()` instead of `.email()`, `.uuid()`, `.url()`. ([Zod v4 Migration][9])

```typescript
const emailSchema = z.email();
const urlSchema = z.url();
const uuidSchema = z.uuid();  // RFC 9562/4122 compliant
const guidSchema = z.guid();  // Permissive validation
```

### Numeric Types

- **Numbers:** `z.number()` validates finite values; comparisons use `gt()`, `gte()`, `lt()`, `lte()` ([Zod API][5])
- **Integers:** `z.int()` and `z.int32()` for integer ranges ([Zod API][5])
- **BigInts:** `z.bigint()` with comparable constraint methods ([Zod API][5])

**v4 Changes:** ([Zod v4 Migration][9])
- Infinite values (`POSITIVE_INFINITY`, `NEGATIVE_INFINITY`) are now rejected
- `.safe()` behavior changed to be identical to `.int()`
- `.int()` is stricter and only accepts safe integers

**v4 Feature:** Fixed-width integer and float types with pre-configured constraints: `z.int32()`, `z.float64()`, `z.uint32()`, etc. ([Zod v4][2])

## Complex Structures

### Objects

Define object schemas via `z.object({...})` with optional properties. ([Zod API][5])

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email().optional()
});
```

**Object Variants:**
- `z.strictObject()` - Rejects unknown keys ([Zod API][5])
- `z.looseObject()` - Passes through extra properties ([Zod API][5])

**Object Methods:**
- `.pick()`, `.omit()` - Select/exclude properties
- `.partial()`, `.required()` - Make all properties optional/required
- `.extend()` - Add new properties (replaces deprecated `.merge()`)
- `.passthrough()`, `.strict()` - Control unknown key handling (deprecated, use variants instead)

([Zod API][5], [Zod v4 Migration][9])

**v4 Feature:** Native support for recursive object definitions without type casting: ([Zod v4][2])

```typescript
const Category = z.object({
  name: z.string(),
  get subcategories(){
    return z.array(Category)
  }
});
```

### Arrays and Tuples

**Arrays:** `z.array(schema)` for variable-length collections ([Zod API][5])

```typescript
const StringArray = z.array(z.string());
```

**Tuples:** `z.tuple([...schemas])` for fixed structures with optional variadic arguments ([Zod API][5])

```typescript
const Coordinates = z.tuple([z.number(), z.number()]);
```

**v4 Change:** `.nonempty()` behavior changed to be identical to `.min(1)`, returns `string[]` not `[string, ...string[]]`. ([Zod v4 Migration][9])

### Unions and Enums

**Unions:** `z.union([...options])` checks sequentially ([Zod API][5])

```typescript
const StringOrNumber = z.union([z.string(), z.number()]);
```

**Discriminated Unions:** `z.discriminatedUnion(key, [...])` optimizes validation with a discriminator property ([Zod API][5])

**v4 Enhancement:** Discriminated unions enhanced to support union discriminators, piped schemas, and composition of multiple unions. ([Zod v4][2])

**Enums:**

```typescript
const FruitEnum = z.enum(["apple", "banana", "orange"]);
```

**v4 Change:** `z.nativeEnum()` deprecated. Use overloaded `z.enum()` instead. ([Zod v4 Migration][9])

### Records and Maps

**Records:** `z.record(keySchema, valueSchema)` validates key-value pairs ([Zod API][5])

**v4 Change:** `z.record()` single-argument usage removed. Requires both key and value schemas. Use `z.partialRecord()` for optional keys. ([Zod v4 Migration][9])

**Maps:** `z.map()` for Map instances ([Zod API][5])

## Refinements and Transformations

### Refinements

`.refine(fn)` adds custom validation logic. ([Zod API][5])

```typescript
const PositiveNumber = z.number().refine(n => n > 0, {
  error: "Must be positive"
});
```

**v4 Change:** Refinements now stored within schemas rather than wrapped in `ZodEffects`, allowing method chaining: ([Zod v4][2])

```typescript
z.string()
  .refine(val => val.includes("@"))
  .min(5);
```

`.superRefine(fn, ctx)` enables multiple issues with specific error codes. ([Zod API][5])

**v4 Changes:** ([Zod v4 Migration][9])
- Type predicates in `.refine()` no longer narrow types
- `ctx.path` removed from refinement context
- Function as second argument removed; pass error function as first argument

### Transformations

`.transform(fn)` applies unidirectional data conversion. ([Zod API][5])

```typescript
const StringToNumber = z.string().transform(val => parseInt(val));
```

Pair with `.pipe()` for sequential operations. ([Zod API][5])

**v4 Feature:** New `.overwrite()` method preserves inferred types unlike `.transform()`, enabling type-safe transformations that work with JSON Schema conversion. ([Zod v4][2])

## Default Values

`.default(value)` provides fallback values for undefined inputs. ([Zod API][5])

**v4 Changes:** ([Zod v4 Migration][9])
- `.default()` now short-circuits and returns default matching output type (not input type)
- `.prefault()` added to replicate Zod 3 behavior of parsing default values as input
- Defaults now applied in optional fields even within `.optional()` fields

```typescript
const WithDefault = z.string().default("hello");
const WithPrefault = z.string().prefault("hello");
```

## Advanced Features

### Branded Types

`.brand<T>()` simulates nominal typing for type safety. ([Zod API][5])

```typescript
const UserId = z.number().brand<"UserId">();
type UserId = z.infer<typeof UserId>; // number & { __brand: "UserId" }
```

**v4 Change:** `ZodBranded` class dropped; branding handled via type modification. ([Zod v4 Migration][9])

### Readonly

`.readonly()` freezes output with `Object.freeze()`. ([Zod API][5])

### Codecs

**v4 Feature:** Bidirectional transformations via `z.codec()`: ([Zod API][5])

```typescript
const codec = z.codec(inputSchema, outputSchema, {
  decode: (input) => /* transform to output */,
  encode: (output) => /* transform to input */
});
```

### File Validation

**v4 Feature:** New schema type validates File instances with size and MIME constraints. ([Zod v4][2])

### Template Literals

**v4 Feature:** Support for TypeScript template literal types through `z.templateLiteral()`. ([Zod v4][2])

## Error Handling

### Error Customization

Virtually every Zod API accepts an optional error message through the unified `error` parameter. ([Zod Error Customization][6])

**String errors:**
```typescript
z.string({ error: "Not a string!" });
```

**Function errors (error maps):**
```typescript
z.string({
  error: (iss) => iss.input === undefined
    ? "Field is required."
    : "Invalid input."
});
```

**v4 Changes:** ([Zod v4 Migration][9])
- `message` parameter deprecated; replaced with unified `error` parameter
- `invalid_type_error` and `required_error` removed
- `errorMap` renamed to `error`
- Error maps can now return plain strings or `undefined` to yield control to the next error map

### Error Structure

Error maps receive an issue object with: ([Zod Error Customization][6])
- `code`: the issue code
- `input`: the input data
- `inst`: the schema that originated the issue
- `path`: the error path

**v4 Changes:** ([Zod v4 Migration][9])
- Issue formats streamlined; multiple issue types merged
- Error map precedence changed: schema-level error maps now take precedence over contextual ones passed to `.parse()`
- `.format()` and `.flatten()` deprecated; use `z.treeifyError()` instead
- `.addIssue()` and `.addIssues()` deprecated; directly manipulate `err.issues` array

### Error Precedence

From highest to lowest priority: ([Zod Error Customization][6])
1. Schema-level errors (hard-coded in definitions)
2. Per-parse errors (passed to `.parse()`)
3. Global error maps (via `z.config()`)
4. Locale error maps

### Error Formatting

**v4 Feature:** Official `z.prettifyError()` function converts validation errors to user-friendly formatted strings, replacing the popular third-party `zod-validation-error` package. ([Zod v4][2])

### Internationalization

Zod provides built-in locales for error messages. The regular `zod` library automatically loads the `en` locale. ([Zod Error Customization][6])

**v4 Feature:** New `locales` API for translating error messages. ([Zod v4][2])

```typescript
z.config(z.locales.en());
```

Available locales include: Arabic, French, German, Japanese, Spanish, and 30+ others. ([Zod Error Customization][6])

### Input Reporting

By default, Zod excludes input data from issues to prevent logging sensitive information. Enable it with `reportInput: true` during parsing. ([Zod Error Customization][6])

## Metadata and Registries

**v4 Feature:** Schemas can associate metadata through registries. ([Zod v4][2], [Zod Metadata][7])

### Registries

Create custom registries with specific metadata structure: ([Zod Metadata][7])

```typescript
const myRegistry = z.registry<{ description: string }>();
```

Registry operations include `add()`, `has()`, `get()`, `remove()`, and `clear()`. TypeScript enforces that metadata matches the registry's defined type. ([Zod Metadata][7])

### Global Registry

Zod provides `z.globalRegistry` with predefined metadata fields: ([Zod Metadata][7])
- `id` (string, with uniqueness enforcement)
- `title`
- `description`
- `deprecated` (boolean)
- Custom fields via declaration merging

### `.meta()` Method

The recommended approach to register schemas in the global registry: ([Zod Metadata][7])

```typescript
const emailSchema = z.email().meta({
  id: "email_address",
  title: "Email address"
});
```

Calling `.meta()` without arguments retrieves existing metadata. ([Zod Metadata][7])

### `.describe()` Method

A shorthand for adding just a description field to the global registry. While still supported for backward compatibility, `.meta()` is now preferred. ([Zod Metadata][7])

**Important:** Metadata associates with specific schema instances. Since Zod methods return new instances, calling `.refine()` or other transformations creates unattached schemas. ([Zod Metadata][7])

## JSON Schema Conversion

**v4 Feature:** First-party conversion via `z.toJSONSchema()` transforms schemas to standard JSON Schema format, incorporating registered metadata automatically. ([Zod v4][2], [Zod JSON Schema][8])

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number(),
});

z.toJSONSchema(schema);
// Returns: { type: 'object', properties: {...}, required: [...], additionalProperties: false }
```

### Supported Types

**String Formats:** Email, ISO datetime/date/time, duration, IPv4/IPv6, UUID, and URL schemas map to corresponding JSON Schema `format` values. Base64 uses `contentEncoding`, while other formats use `pattern`. ([Zod JSON Schema][8])

**Numeric Types:** Standard `number` and `integer` types are supported, with specialized float32/float64 and int32 variants. ([Zod JSON Schema][8])

**Objects:** By default, `z.object()` includes `additionalProperties: false` to reflect Zod's property-stripping behavior. ([Zod JSON Schema][8])

### Unrepresentable Types

These cannot convert to JSON Schema: `z.bigint()`, `z.symbol()`, `z.void()`, `z.date()`, `z.map()`, `z.set()`, `z.transform()`, and `z.custom()`. The function throws errors by default but can convert them to `{}` using `unrepresentable: "any"`. ([Zod JSON Schema][8])

### Configuration Options

The function accepts parameters for: ([Zod JSON Schema][8])
- **target:** JSON Schema version (draft-4, draft-7, draft-2020-12, openapi-3.0)
- **cycles:** Handle circular references via `$ref` or throw
- **reused:** Inline duplicate schemas or extract as `$defs`
- **metadata:** Attach titles, descriptions, and custom properties
- **io:** Extract input vs. output types for transformed schemas

## Performance Improvements

Version 4 delivers substantial speed gains across validation operations: ([Zod v4][2])
- String parsing: 14.71x faster than zod3
- Array parsing: 7.43x faster than zod3
- Object parsing: 6.5x faster than zod3

TypeScript compilation also improved dramatically, reducing type instantiations by over 100x for schema composition patterns. ([Zod v4][2])

## Bundle Size

Core bundle sizes saw significant reductions: ([Zod v4][2])
- Regular Zod 4: 5.36kb (2.3x smaller than v3's 12.47kb)
- Zod Mini variant: 1.88kb (6.6x smaller than v3)

## Zod Mini: Tree-Shakable Alternative

**v4 Feature:** The new functional API makes it easier for bundlers to tree-shake the APIs you don't use. ([Zod v4][2])

**Zod Mini uses functions:**
```typescript
import * as z from "zod/mini";

z.optional(z.string())
z.union([z.string(), z.number()])
```

**Regular Zod uses methods:**
```typescript
z.string().optional()
z.string().or(z.number())
```

Parsing methods remain identical across both variants. ([Zod v4][2])

## Ecosystem Foundation

**v4 Feature:** The new `zod/v4/core` sub-package enables library authors to build validation tools on Zod's foundation, supporting a fast validation substrate that can be sprinkled into other libraries. ([Zod v4][2])

## Migration from v3

Version 4 includes breaking changes across error customization, validation behavior, API surface, and internal architecture. Key changes include: ([Zod v4 Migration][9])

- Simplified generics: `ZodType` now only uses `<Output, Input>` (removed `Def` generic)
- Function restructuring: `z.function()` no longer a schema; acts as standalone function factory
- Coercion changes: All `z.coerce` schemas now accept `unknown` input
- Internal refactoring: `._def` moved to `._zod.def`
- `ZodEffects` dropped; `ZodTransform` added

See the full migration guide for comprehensive breaking change documentation. ([Zod v4 Migration][9])

## Best Practices

1. **Use TypeScript strict mode** - Required for proper type inference
2. **Prefer `.safeParse()` over `.parse()`** - Avoid exception handling overhead
3. **Use `.meta()` over `.describe()`** - More flexible metadata attachment
4. **Choose the right variant** - Use Zod Mini for tree-shaking benefits
5. **Leverage branded types** - Add nominal typing for domain primitives
6. **Register metadata globally** - Enable JSON Schema conversion with rich documentation
7. **Use `.extend()` over deprecated `.merge()`** - Better performance and clarity
8. **Avoid infinite values** - No longer supported in v4
9. **Use top-level format validators** - More efficient than method chaining

## Links

**Official Documentation:**
- [Zod Documentation](https://zod.dev)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [Zod API Reference](https://zod.dev/api)
- [Migration Guide](https://zod.dev/v4/changelog)

**Repository:**
- [Zod GitHub](https://github.com/colinhacks/zod)

[1]: https://zod.dev "Zod Documentation"
[2]: https://zod.dev/v4 "Zod v4 Release Notes"
[3]: https://github.com/colinhacks/zod "Zod GitHub Repository"
[4]: https://zod.dev/basics "Zod Basics"
[5]: https://zod.dev/api "Zod API Reference"
[6]: https://zod.dev/error-customization "Zod Error Customization"
[7]: https://zod.dev/metadata "Zod Metadata"
[8]: https://zod.dev/json-schema "Zod JSON Schema"
[9]: https://zod.dev/v4/changelog "Zod v4 Migration Guide"
