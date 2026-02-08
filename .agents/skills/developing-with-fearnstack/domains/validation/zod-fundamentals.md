---
title: Zod Fundamentals
description: Type-safe schema validation with Zod
---

# Zod Fundamentals

Zod is a TypeScript-first schema validation library with static type inference. Define schemas once, get runtime validation and TypeScript types automatically.

## Installation

```bash
bun add zod
```

## Basic Usage

```typescript
import { z } from "zod";

// Define a schema
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().min(0),
});

// Infer TypeScript type
type User = z.infer<typeof userSchema>;
// { name: string; email: string; age: number }

// Parse data (throws on invalid)
const user = userSchema.parse({
  name: "Alice",
  email: "alice@example.com",
  age: 30,
});

// Safe parse (doesn't throw)
const result = userSchema.safeParse(data);
if (result.success) {
  console.log(result.data); // Typed as User
} else {
  console.log(result.error.issues);
}
```

## Primitive Types

```typescript
// Strings
z.string();
z.string().min(1);
z.string().max(100);
z.string().length(5);
z.string().email();
z.string().url();
z.string().uuid();
z.string().regex(/^[a-z]+$/);
z.string().startsWith("prefix");
z.string().endsWith("suffix");
z.string().includes("substring");
z.string().trim();
z.string().toLowerCase();
z.string().toUpperCase();

// Numbers
z.number();
z.number().int();
z.number().positive();
z.number().negative();
z.number().min(0);
z.number().max(100);
z.number().multipleOf(5);
z.number().finite();

// Booleans
z.boolean();

// Dates
z.date();
z.date().min(new Date("2020-01-01"));
z.date().max(new Date());

// Coercion (convert strings to types)
z.coerce.number(); // "123" -> 123
z.coerce.boolean(); // "true" -> true
z.coerce.date(); // "2024-01-01" -> Date
```

## Object Schemas

```typescript
const personSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email().optional(),
});

// Strict (no extra properties)
const strictSchema = z.object({
  name: z.string(),
}).strict();

// Passthrough (keep extra properties)
const passthroughSchema = z.object({
  name: z.string(),
}).passthrough();

// Partial (all optional)
const partialSchema = personSchema.partial();
// { name?: string; age?: number; email?: string }

// Required (all required)
const requiredSchema = personSchema.required();

// Pick specific fields
const pickedSchema = personSchema.pick({ name: true, age: true });

// Omit fields
const omittedSchema = personSchema.omit({ email: true });

// Extend
const extendedSchema = personSchema.extend({
  role: z.enum(["admin", "user"]),
});

// Merge
const mergedSchema = personSchema.merge(
  z.object({ role: z.string() })
);
```

## Array Schemas

```typescript
// Basic array
z.array(z.string());

// With constraints
z.array(z.number()).min(1);
z.array(z.number()).max(10);
z.array(z.number()).length(5);
z.array(z.number()).nonempty();

// Tuples (fixed length, mixed types)
z.tuple([z.string(), z.number()]);
// [string, number]

z.tuple([z.string(), z.number()]).rest(z.boolean());
// [string, number, ...boolean[]]
```

## Union and Literal Types

```typescript
// Union
z.union([z.string(), z.number()]);
// string | number

// Shorthand
z.string().or(z.number());

// Discriminated union (more efficient)
z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({ type: z.literal("image"), url: z.string() }),
]);

// Literals
z.literal("hello"); // "hello"
z.literal(42); // 42
z.literal(true); // true

// Enums
z.enum(["admin", "user", "guest"]);

// Native enums
enum Role {
  Admin = "admin",
  User = "user",
}
z.nativeEnum(Role);
```

## Optional and Nullable

```typescript
// Optional (undefined allowed)
z.string().optional();
// string | undefined

// Nullable (null allowed)
z.string().nullable();
// string | null

// Both
z.string().nullish();
// string | null | undefined

// Default values
z.string().default("default");
z.number().default(() => Math.random());
```

## Transformations

```typescript
// Transform output
const schema = z.string().transform((val) => val.length);
schema.parse("hello"); // 5

// Parse then transform
const dateSchema = z.string().transform((str) => new Date(str));

// Preprocess input
const numberSchema = z.preprocess(
  (val) => (typeof val === "string" ? parseInt(val, 10) : val),
  z.number()
);
numberSchema.parse("42"); // 42

// Pipe transformations
const trimmedEmail = z.string().trim().toLowerCase().email();
```

## Refinements

Custom validation logic:

```typescript
// Simple refinement
const positiveNumber = z.number().refine((n) => n > 0, {
  message: "Must be positive",
});

// With custom path
const passwordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Superrefine for multiple errors
const schema = z.string().superRefine((val, ctx) => {
  if (val.length < 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      minimum: 5,
      type: "string",
      inclusive: true,
      message: "Too short",
    });
  }
  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Must contain uppercase",
    });
  }
});
```

## Error Handling

```typescript
// Access errors
const result = schema.safeParse(data);
if (!result.success) {
  // Zod error object
  console.log(result.error.issues);
  // [{ code: "too_small", message: "...", path: ["name"] }]

  // Formatted errors
  console.log(result.error.format());
  // { name: { _errors: ["..."] } }

  // Flattened errors
  console.log(result.error.flatten());
  // { formErrors: [], fieldErrors: { name: ["..."] } }
}

// Custom error messages
z.string().min(5, { message: "Must be 5+ characters" });
z.string().email({ message: "Invalid email address" });

// Error map (global)
z.setErrorMap((issue, ctx) => {
  if (issue.code === z.ZodIssueCode.too_small) {
    return { message: `Minimum ${issue.minimum} required` };
  }
  return { message: ctx.defaultError };
});
```

## Type Inference

```typescript
// Infer input type
type Input = z.input<typeof schema>;

// Infer output type
type Output = z.output<typeof schema>;

// Shorthand for output
type User = z.infer<typeof userSchema>;

// Function types
const createUser = (data: z.input<typeof userSchema>): z.output<typeof userSchema> => {
  return userSchema.parse(data);
};
```

## Records and Maps

```typescript
// Record (object with string keys)
z.record(z.string(), z.number());
// { [key: string]: number }

// Shorthand
z.record(z.number());
// { [key: string]: number }

// Map
z.map(z.string(), z.number());
// Map<string, number>

// Set
z.set(z.string());
// Set<string>
```

## Recursive Schemas

```typescript
// Self-referencing type
interface Category {
  name: string;
  subcategories: Category[];
}

const categorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    subcategories: z.array(categorySchema),
  })
);

// JSON type
type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

const jsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonSchema),
    z.record(jsonSchema),
  ])
);
```

## Common Patterns

### Form Schemas

```typescript
const signupSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Password must be 8+ characters")
    .regex(/[A-Z]/, "Must contain uppercase")
    .regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});
```

### API Response Schemas

```typescript
const apiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

const usersResponseSchema = apiResponseSchema(z.array(userSchema));
```

### Shared Schemas

```typescript
// shared/schemas/user.ts
export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export const updateUserSchema = createUserSchema.partial();

export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
```

## Next Steps

- [Zod Integration](zod-integration.md) - Cross-stack usage
- [TanStack Form](../frontend/tanstack-form.md) - Form validation
- [Hono Middleware](../backend/hono-middleware.md) - Request validation
