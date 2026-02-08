---
title: "Zod Error Handling"
description: "Customizing and formatting validation errors in Zod"
type: "concept-guide"
tags: ["zod", "typescript", "validation", "errors", "i18n", "localization"]
category: "typescript"
subcategory: "validation"
version: "4.2.1"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod Error Customization"
    url: "https://zod.dev/error-customization"
  - name: "Zod Error Formatting"
    url: "https://zod.dev/error-formatting"
related: ["README.md", "basics.md", "api-reference.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod Error Handling

Validation errors in Zod are instances of `z.core.$ZodError` containing an `.issues` array with human-readable messages and structured metadata. ([Error Customization][1])

## Error Structure

```typescript
import * as z from "zod";

const result = z.string().safeParse(12);
result.error.issues;
// [
//   {
//     expected: 'string',
//     code: 'invalid_type',
//     path: [],
//     message: 'Invalid input: expected string, received number'
//   }
// ]
```

## Customizing Error Messages

### The `error` Parameter

Virtually every Zod API accepts an optional error message. ([Error Customization][1])

```typescript
z.string("Not a string!");
z.string().min(5, "Too short!");
z.uuid("Bad UUID!");
z.array(z.string(), "Not an array!");
```

Using params object syntax:

```typescript
z.string({ error: "Bad!" });
z.string().min(5, { error: "Too short!" });
```

### Error Maps (Functions)

The `error` parameter accepts a function for dynamic error messages. ([Error Customization][1])

```typescript
z.string({
  error: (iss) => iss.input === undefined
    ? "Field is required."
    : "Invalid input."
});
```

Error map context includes:
- `iss.code` - the issue code
- `iss.input` - the input data
- `iss.inst` - the originating schema/check
- `iss.path` - the error path

Return `undefined` to fall back to default message.

### Per-Parse Customization

Customize errors on a per-parse basis. ([Error Customization][1])

```typescript
schema.parse(12, {
  error: (iss) => "per-parse custom error"
});
```

**Note:** Schema-level errors take precedence over per-parse errors.

### Global Error Customization

Set a global error map via `z.config()`. ([Error Customization][1])

```typescript
z.config({
  customError: (iss) => {
    if (iss.code === "invalid_type") {
      return `Invalid type, expected ${iss.expected}`;
    }
    if (iss.code === "too_small") {
      return `Minimum is ${iss.minimum}`;
    }
  },
});
```

## Error Precedence

From highest to lowest priority. ([Error Customization][1])

1. **Schema-level error** - Hard-coded in schema definition
2. **Per-parse error** - Passed to `.parse()` method
3. **Global error map** - Set via `z.config()`
4. **Locale error map** - Language-specific defaults

## Internationalization

Zod provides built-in locales for error messages. ([Error Customization][1])

```typescript
import * as z from "zod";
import { fr } from "zod/locales";

z.config(fr());
```

### Available Locales

`ar`, `az`, `be`, `bg`, `ca`, `cs`, `da`, `de`, `en`, `eo`, `es`, `fa`, `fi`, `fr`, `frCA`, `he`, `hu`, `id`, `is`, `it`, `ja`, `ka`, `km`, `ko`, `lt`, `mk`, `ms`, `nl`, `no`, `ota`, `ps`, `pl`, `pt`, `ru`, `sl`, `sv`, `ta`, `th`, `tr`, `uk`, `ur`, `vi`, `zhCN`, `zhTW`, `yo`

### Lazy Loading Locales

```typescript
async function loadLocale(locale: string) {
  const { default: localeConfig } = await import(`zod/v4/locales/${locale}.js`);
  z.config(localeConfig());
}

await loadLocale("fr");
```

## Formatting Errors

### `z.treeifyError()`

Convert errors into a nested object structure. ([Error Formatting][2])

```typescript
const tree = z.treeifyError(result.error);

tree.properties?.username?.errors;
// => ["Invalid input: expected string, received number"]

tree.properties?.favoriteNumbers?.items?.[1]?.errors;
// => ["Invalid input: expected number, received string"]
```

### `z.prettifyError()`

Human-readable string representation. ([Error Formatting][2])

```typescript
const pretty = z.prettifyError(result.error);
// ✖ Invalid input: expected string, received number
//   → at username
// ✖ Invalid input: expected number, received string
//   → at favoriteNumbers[1]
```

### `z.flattenError()`

Shallow error object for flat schemas. ([Error Formatting][2])

```typescript
const flattened = z.flattenError(result.error);
// {
//   formErrors: ['Unrecognized key: "extraKey"'],
//   fieldErrors: {
//     username: ['Invalid input: expected string, received number'],
//     favoriteNumbers: ['Invalid input: expected number, received string']
//   }
// }
```

## Include Input in Issues

By default, Zod excludes input data to prevent logging sensitive information. ([Error Customization][1])

```typescript
z.string().parse(12, {
  reportInput: true
});
// ZodError: [{
//   "expected": "string",
//   "code": "invalid_type",
//   "input": 12,  // included
//   "path": [],
//   "message": "Invalid input..."
// }]
```

## References

[1]: https://zod.dev/error-customization "Zod Error Customization"
[2]: https://zod.dev/error-formatting "Zod Error Formatting"
