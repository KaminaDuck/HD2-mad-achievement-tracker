---
title: "Zod Mini"
description: "Tree-shakable Zod variant with functional API for optimized bundle sizes"
type: "tool-reference"
tags: ["zod", "typescript", "validation", "tree-shaking", "bundle-size", "performance"]
category: "typescript"
subcategory: "validation"
version: "4.2.1"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod Mini"
    url: "https://zod.dev/packages/mini"
related: ["README.md", "zod-v4-reference.md", "basics.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod Mini

Zod Mini is a tree-shakable variant using a functional API for smaller bundle sizes. ([Zod Mini][1])

## Installation

```bash
npm install zod@^4.0.0
```

```typescript
import * as z from "zod/mini";
```

## API Differences

Zod Mini uses functions instead of methods. ([Zod Mini][1])

```typescript
// Regular Zod
const mySchema = z.string().optional().nullable();

// Zod Mini
const mySchema = z.nullable(z.optional(z.string()));
```

### Checks and Refinements

```typescript
// Regular Zod
z.string().min(5).max(10).trim()

// Zod Mini
z.string().check(z.minLength(5), z.maxLength(10), z.trim());
```

## Bundle Size Comparison

| Package | Simple Schema | Object Schema |
|---------|--------------|---------------|
| Zod Mini | `2.12kb` | `4.0kb` |
| Zod | `5.91kb` | `13.1kb` |

([Zod Mini][1])

## When to Use Zod Mini

### Use Regular Zod When

- **DX matters** - Chained methods are more discoverable via autocomplete
- **Backend development** - Bundle size is negligible for servers/Lambda
- **Most applications** - Bundle size on Zod's scale rarely impacts performance

### Use Zod Mini When

- **Strict bundle constraints** - Optimizing for slow mobile networks
- **Rural/developing areas** - Users with sub-1Mbps connections
- **Minimal dependencies** - Every kilobyte counts

([Zod Mini][1])

## ZodMiniType Base Class

All Zod Mini schemas extend `z.ZodMiniType`. ([Zod Mini][1])

### Parsing Methods

```typescript
import * as z from "zod/mini";

const mySchema = z.string();

mySchema.parse('asdf');
await mySchema.parseAsync('asdf');
mySchema.safeParse('asdf');
await mySchema.safeParseAsync('asdf');
```

### The `.check()` Method

```typescript
z.string().check(
  z.minLength(5),
  z.maxLength(10),
  z.refine(val => val.includes("@")),
  z.trim()
);
```

### Available Checks

```typescript
// Numeric
z.lt(value);
z.lte(value);       // alias: z.maximum()
z.gt(value);
z.gte(value);       // alias: z.minimum()
z.positive();
z.negative();
z.nonpositive();
z.nonnegative();
z.multipleOf(value);

// Size
z.maxSize(value);
z.minSize(value);
z.size(value);
z.maxLength(value);
z.minLength(value);
z.length(value);

// String
z.regex(regex);
z.lowercase();
z.uppercase();
z.includes(value);
z.startsWith(value);
z.endsWith(value);

// Other
z.property(key, schema);
z.mime(value);

// Custom
z.refine();
z.check();          // replaces .superRefine()

// Mutations
z.overwrite(value => newValue);
z.normalize();
z.trim();
z.toLowerCase();
z.toUpperCase();

// Metadata
z.meta({ title: "...", description: "..." });
z.describe("...");
```

### Registry Registration

```typescript
const myReg = z.registry<{ title: string }>();

z.string().register(myReg, { title: "My cool string schema" });
```

### Branding

```typescript
const USD = z.string().brand("USD");
```

## No Default Locale

Zod Mini does not auto-load the English locale. All error messages default to "Invalid input". ([Zod Mini][1])

Load a locale manually:

```typescript
import * as z from "zod/mini";

z.config(z.locales.en());
```

See [Internationalization](error-handling.md#internationalization) for available locales.

## Backend Considerations

Lambda cold start times with various bundle sizes. ([Zod Mini][1])

| Bundle Size | Cold Start Time |
|-------------|-----------------|
| `1kb` | `171ms` |
| `17kb` (Zod gzipped) | `~171.6ms` |
| `128kb` | `176ms` |
| `256kb` | `182ms` |
| `512kb` | `279ms` |

The difference between 1kb and Zod's full bundle (~17kb gzipped) is approximately **0.6ms**.

## Migration Example

```typescript
// Before (Regular Zod)
import * as z from "zod";

const UserSchema = z.object({
  email: z.string().email().min(5),
  age: z.number().positive().int(),
}).strict();

// After (Zod Mini)
import * as z from "zod/mini";

const UserSchema = z.strictObject({
  email: z.string().check(z.email(), z.minLength(5)),
  age: z.number().check(z.positive(), z.int()),
});
```

## References

[1]: https://zod.dev/packages/mini "Zod Mini"
