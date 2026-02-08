---
title: Zod Integration
description: Using Zod for validation across frontend, backend, and API layers
---

# Zod Integration

Zod schemas provide end-to-end type safety in Fearnstack by sharing validation logic between frontend forms, API validation, and database operations.

## Shared Schema Pattern

The key pattern is defining schemas once and using them everywhere:

```
shared/schemas/
├── user.ts        # User schemas
├── post.ts        # Post schemas
└── common.ts      # Reusable schemas
```

### Defining Shared Schemas

```typescript
// shared/schemas/user.ts
import { z } from "zod";

// Base schema for user data
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user", "guest"]),
  createdAt: z.date(),
});

// For creating users (no id, createdAt)
export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
});

// For updating users (all optional)
export const updateUserSchema = createUserSchema.partial();

// Export types
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
```

## Zod with Hono

### Request Validation Middleware

```typescript
// src/server/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { createUserSchema, updateUserSchema } from "@/shared/schemas/user";

const users = new Hono()
  // Validate JSON body
  .post("/", zValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json"); // Typed as CreateUser!
    const user = await db.users.create(data);
    return c.json(user, 201);
  })

  // Validate path params and body
  .patch(
    "/:id",
    zValidator("param", z.object({ id: z.string().uuid() })),
    zValidator("json", updateUserSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json"); // Typed as UpdateUser
      const user = await db.users.update(id, data);
      return c.json(user);
    }
  )

  // Validate query params
  .get(
    "/",
    zValidator(
      "query",
      z.object({
        page: z.coerce.number().default(1),
        limit: z.coerce.number().default(10),
        role: z.enum(["admin", "user", "guest"]).optional(),
      })
    ),
    async (c) => {
      const { page, limit, role } = c.req.valid("query");
      const users = await db.users.list({ page, limit, role });
      return c.json(users);
    }
  );

export { users };
```

### Custom Error Responses

```typescript
import { zValidator } from "@hono/zod-validator";

const app = new Hono().post(
  "/users",
  zValidator("json", createUserSchema, (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        400
      );
    }
  }),
  async (c) => {
    const data = c.req.valid("json");
    return c.json(await createUser(data));
  }
);
```

## Zod with TanStack Form

### Form Validation

```typescript
// src/client/components/CreateUserForm.tsx
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { createUserSchema } from "@/shared/schemas/user";

function CreateUserForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "user" as const,
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: createUserSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await client.api.users.$post({ json: value });
      if (!res.ok) throw new Error("Failed to create user");
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <span className="error">{field.state.meta.errors.join(", ")}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <div>
            <input
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors.length > 0 && (
              <span className="error">{field.state.meta.errors.join(", ")}</span>
            )}
          </div>
        )}
      </form.Field>

      <form.Field name="role">
        {(field) => (
          <select
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value as "admin" | "user" | "guest")}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest</option>
          </select>
        )}
      </form.Field>

      <button type="submit" disabled={!form.state.canSubmit}>
        Create User
      </button>
    </form>
  );
}
```

### Async Validation

```typescript
<form.Field
  name="email"
  validators={{
    onChange: z.string().email(),
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      // Check if email exists
      const res = await client.api.users.check.$get({
        query: { email: value },
      });
      const { exists } = await res.json();
      return exists ? "Email already registered" : undefined;
    },
  }}
>
  {(field) => (/* ... */)}
</form.Field>
```

## Zod with TanStack Query

### Response Validation

```typescript
// src/client/queries/users.ts
import { queryOptions } from "@tanstack/react-query";
import { userSchema } from "@/shared/schemas/user";
import { z } from "zod";

export const userQueries = {
  all: () =>
    queryOptions({
      queryKey: ["users"],
      queryFn: async () => {
        const res = await client.api.users.$get();
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();

        // Validate response matches expected schema
        return z.array(userSchema).parse(data);
      },
    }),

  byId: (userId: string) =>
    queryOptions({
      queryKey: ["users", userId],
      queryFn: async () => {
        const res = await client.api.users[":id"].$get({
          param: { id: userId },
        });
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();

        return userSchema.parse(data);
      },
    }),
};
```

## Zod with TanStack DB

### Collection Schemas

```typescript
import { createLocalStorageCollection } from "@tanstack/db";
import { userSchema } from "@/shared/schemas/user";

const usersCollection = createLocalStorageCollection({
  name: "users",
  primaryKey: "id",
  schema: userSchema,
});

// Insertions are validated
await usersCollection.insert({
  id: crypto.randomUUID(),
  name: "Alice",
  email: "alice@example.com",
  role: "user",
  createdAt: new Date(),
});
```

## JSON Schema Generation

Convert Zod schemas to JSON Schema for OpenAPI or AI structured outputs:

```typescript
import { z } from "zod";

const userSchema = z.object({
  name: z.string().describe("User's full name"),
  email: z.string().email().describe("User's email address"),
  age: z.number().min(0).describe("User's age in years"),
});

// Generate JSON Schema
const jsonSchema = z.toJSONSchema(userSchema);

console.log(JSON.stringify(jsonSchema, null, 2));
// {
//   "type": "object",
//   "properties": {
//     "name": { "type": "string", "description": "User's full name" },
//     "email": { "type": "string", "format": "email", "description": "..." },
//     "age": { "type": "number", "minimum": 0, "description": "..." }
//   },
//   "required": ["name", "email", "age"]
// }
```

## Common Patterns

### API Response Schema

```typescript
// shared/schemas/api.ts
export const apiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.record(z.string(), z.array(z.string())).optional(),
});

export const paginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    pageSize: z.number(),
    hasMore: z.boolean(),
  });

// Usage
const paginatedUsersSchema = paginatedSchema(userSchema);
type PaginatedUsers = z.infer<typeof paginatedUsersSchema>;
```

### Environment Variables

```typescript
// shared/schemas/env.ts
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]),
  DATABASE_URL: z.string().url(),
  API_KEY: z.string().min(1),
  PORT: z.coerce.number().default(3001),
});

// src/server/index.ts
const env = envSchema.parse(process.env);
```

### Date Handling

```typescript
// Handle date strings from JSON
const eventSchema = z.object({
  name: z.string(),
  date: z.string().datetime().transform((str) => new Date(str)),
  // Or with coercion
  createdAt: z.coerce.date(),
});
```

### ID Schemas

```typescript
// shared/schemas/common.ts
export const idSchema = z.string().uuid();
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

// Parameterized schemas
export const byIdSchema = z.object({ id: idSchema });
export const bySlugSchema = z.object({ slug: slugSchema });

// Usage
app.get("/:id", zValidator("param", byIdSchema), async (c) => {
  const { id } = c.req.valid("param");
  // ...
});
```

## Best Practices

### 1. Define Schemas at the Source

```typescript
// ✅ Good - single source of truth
// shared/schemas/user.ts
export const userSchema = z.object({ /* ... */ });

// Used in: form, API, database
```

### 2. Derive Related Schemas

```typescript
// ✅ Good - derive from base
export const createUserSchema = userSchema.omit({ id: true, createdAt: true });
export const updateUserSchema = createUserSchema.partial();

// ❌ Bad - duplicate definitions
const createUserSchema = z.object({ name: z.string(), email: z.string() });
const updateUserSchema = z.object({ name: z.string().optional(), email: z.string().optional() });
```

### 3. Add Descriptions for API Docs

```typescript
export const userSchema = z.object({
  name: z.string().min(2).describe("User's display name"),
  email: z.string().email().describe("Primary email address"),
});
```

### 4. Use Coercion at Boundaries

```typescript
// Query params come as strings
const querySchema = z.object({
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});
```

## Next Steps

- [TanStack Form](../frontend/tanstack-form.md) - Form state management
- [Hono Middleware](../backend/hono-middleware.md) - Request validation
- [Form Validation](../../integration/form-validation.md) - Complete patterns
