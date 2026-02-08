---
title: "Zod API Reference"
description: "Complete API reference for all Zod schema types, methods, and validation features"
type: "api-reference"
tags: ["zod", "typescript", "validation", "schema", "api", "reference"]
category: "typescript"
subcategory: "validation"
version: "4.2.1"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod API Reference"
    url: "https://zod.dev/api"
  - name: "Zod Documentation"
    url: "https://zod.dev"
related: ["README.md", "basics.md", "zod-v4-reference.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod API Reference

Complete reference for all Zod schema types and methods. ([Zod API][1])

## Primitives

```typescript
import * as z from "zod";

z.string();
z.number();
z.bigint();
z.boolean();
z.symbol();
z.undefined();
z.null();
```

### Coercion

Convert input data to the appropriate type. ([Zod API][1])

```typescript
z.coerce.string();    // String(input)
z.coerce.number();    // Number(input)
z.coerce.boolean();   // Boolean(input)
z.coerce.bigint();    // BigInt(input)
```

## Literals

```typescript
const tuna = z.literal("tuna");
const twelve = z.literal(12);
const tru = z.literal(true);

// Multiple literal values
const colors = z.literal(["red", "green", "blue"]);
```

## Strings

### Validations

```typescript
z.string().max(5);
z.string().min(5);
z.string().length(5);
z.string().regex(/^[a-z]+$/);
z.string().startsWith("aaa");
z.string().endsWith("zzz");
z.string().includes("---");
z.string().uppercase();
z.string().lowercase();
```

### Transforms

```typescript
z.string().trim();
z.string().toLowerCase();
z.string().toUpperCase();
z.string().normalize();
```

## String Formats

Top-level format validators (v4 change). ([Zod API][1])

```typescript
z.email();
z.uuid();
z.url();
z.httpUrl();       // http or https only
z.hostname();
z.emoji();
z.base64();
z.base64url();
z.hex();
z.jwt();
z.nanoid();
z.cuid();
z.cuid2();
z.ulid();
z.ipv4();
z.ipv6();
z.mac();
z.cidrv4();
z.cidrv6();
z.hash("sha256");  // or "sha1", "sha384", "sha512", "md5"
z.iso.date();
z.iso.time();
z.iso.datetime();
z.iso.duration();
```

### Email Patterns

```typescript
z.email();                              // Default strict regex
z.email({ pattern: z.regexes.email });  // Equivalent
z.email({ pattern: z.regexes.html5Email }); // Browser validation
z.email({ pattern: z.regexes.rfc5322Email }); // RFC 5322
z.email({ pattern: z.regexes.unicodeEmail }); // Unicode support
```

### UUID Versions

```typescript
z.uuid();
z.uuid({ version: "v4" });
z.uuidv4();
z.uuidv6();
z.uuidv7();
z.guid();  // Permissive validation
```

### Custom Formats

```typescript
const coolId = z.stringFormat("cool-id", (val) => {
  return val.length === 100 && val.startsWith("cool-");
});
```

## Template Literals

```typescript
z.templateLiteral(["hello, ", z.string(), "!"]);
// `hello, ${string}!`

z.templateLiteral([z.number(), z.enum(["px", "em", "rem"])]);
// `${number}px` | `${number}em` | `${number}rem`
```

## Numbers

```typescript
z.number();
z.number().gt(5);
z.number().gte(5);      // alias .min(5)
z.number().lt(5);
z.number().lte(5);      // alias .max(5)
z.number().positive();
z.number().nonnegative();
z.number().negative();
z.number().nonpositive();
z.number().multipleOf(5);  // alias .step(5)
```

### Integers

```typescript
z.int();     // Safe integer range
z.int32();   // int32 range
```

## BigInts

```typescript
z.bigint();
z.bigint().gt(5n);
z.bigint().gte(5n);
z.bigint().lt(5n);
z.bigint().lte(5n);
z.bigint().positive();
z.bigint().negative();
z.bigint().multipleOf(5n);
```

## Booleans

```typescript
z.boolean().parse(true);  // => true
z.boolean().parse(false); // => false
```

## Dates

```typescript
z.date();
z.date().min(new Date("1900-01-01"), { error: "Too old!" });
z.date().max(new Date(), { error: "Too young!" });
```

## Enums

```typescript
const FishEnum = z.enum(["Salmon", "Tuna", "Trout"]);
FishEnum.parse("Salmon"); // ✅
FishEnum.parse("Swordfish"); // ❌

// Use `as const` for variables
const fish = ["Salmon", "Tuna", "Trout"] as const;
const FishEnum = z.enum(fish);

// TypeScript enums (replaces z.nativeEnum)
enum Fish { Salmon = 0, Tuna = 1 }
const FishEnum = z.enum(Fish);
```

### Enum Methods

```typescript
FishEnum.enum;  // => { Salmon: "Salmon", Tuna: "Tuna", Trout: "Trout" }
FishEnum.exclude(["Salmon"]);
FishEnum.extract(["Salmon", "Tuna"]);
```

## Stringbool

Parse string booleans to `boolean`. ([Zod API][1])

```typescript
const strbool = z.stringbool();

strbool.parse("true");   // => true
strbool.parse("1");      // => true
strbool.parse("yes");    // => true
strbool.parse("false");  // => false
strbool.parse("0");      // => false
strbool.parse("no");     // => false
```

## Optionals and Nullables

```typescript
z.optional(z.string());      // string | undefined
z.nullable(z.string());      // string | null
z.nullish(z.string());       // string | null | undefined

// Method syntax
z.string().optional();
z.string().nullable();
z.string().nullish();
```

## Objects

```typescript
const Person = z.object({
  name: z.string(),
  age: z.number(),
});

type Person = z.infer<typeof Person>;
// => { name: string; age: number }
```

### Object Variants

```typescript
z.strictObject({ ... });  // Throws on unknown keys
z.looseObject({ ... });   // Passes through unknown keys
```

### Object Methods

```typescript
Person.shape.name;        // Access internal schemas
Person.keyof();           // ZodEnum of keys
Person.extend({ ... });   // Add fields
Person.safeExtend({ ... }); // Type-safe extend
Person.pick({ name: true });
Person.omit({ age: true });
Person.partial();         // All optional
Person.required();        // All required
Person.catchall(z.string()); // Validate unknown keys
```

### Recursive Objects

```typescript
const Category = z.object({
  name: z.string(),
  get subcategories() {
    return z.array(Category);
  }
});
```

## Arrays

```typescript
z.array(z.string());
z.array(z.string()).min(5);
z.array(z.string()).max(5);
z.array(z.string()).length(5);
```

## Tuples

```typescript
z.tuple([z.string(), z.number(), z.boolean()]);
// [string, number, boolean]

// Variadic
z.tuple([z.string()], z.number());
// [string, ...number[]]
```

## Unions

```typescript
z.union([z.string(), z.number()]);
// string | number
```

### Exclusive Unions (XOR)

Exactly one option must match. ([Zod API][1])

```typescript
z.xor([z.string(), z.number()]);
```

### Discriminated Unions

```typescript
z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.string() }),
  z.object({ status: z.literal("failed"), error: z.string() }),
]);
```

## Intersections

```typescript
const Person = z.object({ name: z.string() });
const Employee = z.object({ role: z.string() });

z.intersection(Person, Employee);
// { name: string } & { role: string }
```

## Records

```typescript
z.record(z.string(), z.string());
// Record<string, string>

z.record(z.enum(["id", "name"]), z.string());
// { id: string; name: string }

z.partialRecord(z.enum(["id", "name"]), z.string());
// { id?: string; name?: string }

z.looseRecord(z.string(), z.string());
// Passes through non-matching keys
```

## Maps and Sets

```typescript
z.map(z.string(), z.number());
// Map<string, number>

z.set(z.number());
z.set(z.string()).min(5).max(10).size(5);
```

## Files

```typescript
z.file();
z.file().min(10_000);
z.file().max(1_000_000);
z.file().mime("image/png");
z.file().mime(["image/png", "image/jpeg"]);
```

## Refinements

### `.refine()`

```typescript
z.string().refine((val) => val.length <= 255);

z.string().refine((val) => val.length > 8, {
  error: "Too short!",
  abort: true,  // Stop validation on failure
  path: ["fieldName"],
});
```

### `.superRefine()`

Add multiple issues with specific error codes. ([Zod API][1])

```typescript
z.array(z.string()).superRefine((val, ctx) => {
  if (val.length > 3) {
    ctx.addIssue({
      code: "too_big",
      maximum: 3,
      origin: "array",
      inclusive: true,
      message: "Too many items",
      input: val,
    });
  }
});
```

## Transforms

```typescript
z.transform((val) => String(val));

z.string().transform((val) => val.length);

z.preprocess((val) => {
  if (typeof val === "string") return Number.parseInt(val);
  return val;
}, z.int());
```

## Defaults and Prefaults

```typescript
z.string().default("hello");
z.number().default(Math.random);

// Prefault: parses the default value
z.string().trim().toUpperCase().prefault("  tuna  ");
// => "TUNA"
```

## Catch

```typescript
z.number().catch(42);

z.number().catch((ctx) => {
  ctx.error; // the caught ZodError
  return Math.random();
});
```

## Branded Types

```typescript
const UserId = z.number().brand<"UserId">();
type UserId = z.infer<typeof UserId>;
// number & { __brand: "UserId" }
```

## Readonly

```typescript
z.object({ name: z.string() }).readonly();
// Readonly<{ name: string }>
```

## JSON

```typescript
z.json();  // Any JSON-encodable value
```

## Functions

```typescript
const MyFunction = z.function({
  input: [z.string()],
  output: z.number()
});

const fn = MyFunction.implement((input) => input.trim().length);
```

## Custom

```typescript
const px = z.custom<`${number}px`>((val) => {
  return typeof val === "string" && /^\d+px$/.test(val);
});
```

## References

[1]: https://zod.dev/api "Zod API Reference"
