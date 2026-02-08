---
title: Type-Safe APIs
description: End-to-end type safety from database to UI with Zod schemas
---

# Type-Safe APIs

Achieve complete type safety across your entire stack by defining schemas once and using them everywhere—from database operations to API validation to frontend forms.

## The Type Safety Vision

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SHARED ZOD SCHEMA                               │
│                                                                      │
│  export const userSchema = z.object({                               │
│    id: z.string().uuid(),                                           │
│    name: z.string().min(2),                                         │
│    email: z.string().email(),                                       │
│  });                                                                 │
│  export type User = z.infer<typeof userSchema>;                     │
└─────────────────────────────────────────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          ▼                         ▼                         ▼
   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐
   │   Backend   │          │  RPC Client │          │   Frontend  │
   │  Validation │          │    Types    │          │    Forms    │
   │             │          │             │          │             │
   │ zValidator  │          │ hc<AppType> │          │ TanStack    │
   │  middleware │          │  inference  │          │ Form + Zod  │
   └─────────────┘          └─────────────┘          └─────────────┘
```

## Shared Schema Pattern

### Directory Structure

```
src/
├── shared/
│   └── schemas/
│       ├── user.ts         # User schemas and types
│       ├── post.ts         # Post schemas and types
│       ├── common.ts       # Shared primitives
│       └── index.ts        # Re-exports
├── server/
│   └── routes/
│       └── users.ts        # Imports from shared/schemas
└── client/
    └── components/
        └── UserForm.tsx    # Imports from shared/schemas
```

### Defining Base Schemas

```typescript
// src/shared/schemas/user.ts
import { z } from "zod";

// Base schema with all fields
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "user", "guest"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// For creating users (no id, timestamps)
export const createUserSchema = userSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// For updating users (all fields optional)
export const updateUserSchema = createUserSchema.partial();

// For API responses (dates as ISO strings)
export const userResponseSchema = userSchema.extend({
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Export inferred TypeScript types
export type User = z.infer<typeof userSchema>;
export type CreateUser = z.infer<typeof createUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UserResponse = z.infer<typeof userResponseSchema>;
```

### Common Schemas

```typescript
// src/shared/schemas/common.ts
import { z } from "zod";

// Reusable primitives
export const idSchema = z.string().uuid();
export const slugSchema = z.string().regex(/^[a-z0-9-]+$/);

// Pagination
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type Pagination = z.infer<typeof paginationSchema>;

// Paginated response wrapper
export const paginatedSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    hasMore: z.boolean(),
  });

// API error response
export const apiErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.record(z.array(z.string())).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;
```

## Backend Type Safety

### Request Validation with zValidator

```typescript
// src/server/routes/users.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createUserSchema,
  updateUserSchema,
  userResponseSchema,
} from "@/shared/schemas/user";
import { idSchema, paginationSchema } from "@/shared/schemas/common";

const users = new Hono()
  // Validate query params
  .get(
    "/",
    zValidator("query", paginationSchema),
    async (c) => {
      const { page, limit } = c.req.valid("query"); // Typed!
      const users = await db.users.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      return c.json({ items: users, page, limit, total: 100, hasMore: true });
    }
  )

  // Validate path params
  .get(
    "/:id",
    zValidator("param", z.object({ id: idSchema })),
    async (c) => {
      const { id } = c.req.valid("param"); // Typed as string (uuid)
      const user = await db.users.findUnique({ where: { id } });
      if (!user) return c.json({ error: "Not found" }, 404);
      return c.json(user);
    }
  )

  // Validate JSON body
  .post(
    "/",
    zValidator("json", createUserSchema),
    async (c) => {
      const data = c.req.valid("json"); // Typed as CreateUser!
      const user = await db.users.create({
        data: {
          id: crypto.randomUUID(),
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return c.json(user, 201);
    }
  )

  // Validate both param and body
  .patch(
    "/:id",
    zValidator("param", z.object({ id: idSchema })),
    zValidator("json", updateUserSchema),
    async (c) => {
      const { id } = c.req.valid("param");
      const data = c.req.valid("json"); // Typed as UpdateUser (partial)
      const user = await db.users.update({
        where: { id },
        data: { ...data, updatedAt: new Date() },
      });
      return c.json(user);
    }
  );

export { users };
```

### Custom Error Responses

```typescript
// Consistent error format across all endpoints
.post(
  "/",
  zValidator("json", createUserSchema, (result, c) => {
    if (!result.success) {
      return c.json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      }, 400);
    }
  }),
  async (c) => {
    // Handler only runs if validation passes
    const data = c.req.valid("json");
    // ...
  }
)
```

## Frontend Type Safety

### Inferred Types from RPC

The Hono RPC client automatically infers types from your backend:

```typescript
// src/client/lib/api.ts
import { hc } from "hono/client";
import type { AppType } from "@/server";

export const client = hc<AppType>("http://localhost:3001");

// Usage - all types are inferred!
const createUser = async () => {
  const res = await client.api.users.$post({
    json: {
      name: "Alice",      // TypeScript knows this is required
      email: "a@b.com",   // TypeScript knows this must be email
      role: "user",       // TypeScript shows only "admin" | "user" | "guest"
    },
  });

  if (res.ok) {
    const user = await res.json();
    // user is typed based on your backend response
    console.log(user.id);  // TypeScript knows this exists
  }
};
```

### Type-Safe Form Handling

```tsx
// src/client/components/CreateUserForm.tsx
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { createUserSchema, type CreateUser } from "@/shared/schemas/user";
import { client } from "../lib/api";

export function CreateUserForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "user" as const,
    } satisfies CreateUser,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: createUserSchema,
    },
    onSubmit: async ({ value }) => {
      // value is typed as CreateUser
      const res = await client.api.users.$post({ json: value });
      if (!res.ok) throw new Error("Failed to create user");
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="name">
        {(field) => (
          <div>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {/* field.state.meta.errors is typed */}
            {field.state.meta.errors.map((e) => <span key={e}>{e}</span>)}
          </div>
        )}
      </form.Field>

      <form.Field name="role">
        {(field) => (
          <select
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value as CreateUser["role"])}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest</option>
          </select>
        )}
      </form.Field>

      <button type="submit" disabled={!form.state.canSubmit}>
        Create
      </button>
    </form>
  );
}
```

### Type-Safe Routing

```typescript
// src/client/routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/users/$userId")({
  // Validate route params
  parseParams: (params) => ({
    userId: z.string().uuid().parse(params.userId),
  }),

  // Type-safe loader
  loader: async ({ params }) => {
    const res = await client.api.users[":id"].$get({
      param: { id: params.userId }, // Typed!
    });
    if (!res.ok) throw new Error("User not found");
    return res.json();
  },

  component: UserDetail,
});

function UserDetail() {
  const user = Route.useLoaderData(); // Typed based on loader return
  return <div>{user.name}</div>;
}
```

## The Complete Type Chain

```
Zod Schema → Hono Validator → RPC Types → Query Types → Component Props
     │              │              │            │             │
     │              │              │            │             │
     ▼              ▼              ▼            ▼             ▼
userSchema    zValidator     hc<AppType>   useQuery      TypeScript
  defines      validates      infers       returns      type-checks
   types       requests       client       typed data     JSX props
```

### Tracing a Type Through the Stack

```typescript
// 1. Define schema
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
});
type User = z.infer<typeof userSchema>;

// 2. Backend validates and responds
const app = new Hono()
  .get("/users/:id", async (c) => {
    const user = await db.users.findUnique(/* ... */);
    return c.json(user); // Response type captured
  });

// 3. Type exported
export type AppType = typeof app;

// 4. Client generated with types
const client = hc<AppType>(url);

// 5. Query uses client
const userQuery = queryOptions({
  queryKey: ["user", id],
  queryFn: async () => {
    const res = await client.api.users[":id"].$get({ param: { id } });
    return res.json(); // Return type inferred from AppType
  },
});

// 6. Component uses query
function UserCard() {
  const { data: user } = useQuery(userQuery);
  // user is typed as User | undefined
  return <div>{user?.name}</div>;
}
```

## Common Pitfalls

### Type Widening Issues

```typescript
// ❌ Problem: Type gets widened to string
const role = "admin";
createUser({ name: "Alice", email: "a@b.com", role }); // Error!

// ✅ Solution: Use const assertion
const role = "admin" as const;
createUser({ name: "Alice", email: "a@b.com", role }); // Works!

// ✅ Or: Define inline
createUser({ name: "Alice", email: "a@b.com", role: "admin" });
```

### Date Serialization

```typescript
// JSON doesn't support Date objects - they become strings

// Backend sends:
return c.json({ createdAt: new Date() });
// Client receives:
// { createdAt: "2024-01-15T10:30:00.000Z" } // string!

// Solution: Transform on the frontend
const userSchema = z.object({
  createdAt: z.string().datetime().transform((s) => new Date(s)),
});

// Or use coercion
const userSchema = z.object({
  createdAt: z.coerce.date(),
});
```

### Enum Handling

```typescript
// ❌ Don't use TypeScript enums with Zod
enum Role { Admin = "admin", User = "user" }
const schema = z.nativeEnum(Role); // Works but less flexible

// ✅ Use Zod enums
const roleSchema = z.enum(["admin", "user", "guest"]);
type Role = z.infer<typeof roleSchema>; // "admin" | "user" | "guest"

// Access enum values
roleSchema.options; // ["admin", "user", "guest"]
roleSchema.enum.admin; // "admin"
```

### Avoiding Type Drift

```typescript
// ❌ Don't duplicate schema definitions
// Backend
const backendUserSchema = z.object({ name: z.string() });
// Frontend - might drift over time!
const frontendUserSchema = z.object({ name: z.string() });

// ✅ Single source of truth
// shared/schemas/user.ts
export const userSchema = z.object({ name: z.string() });

// Backend imports from shared
import { userSchema } from "@/shared/schemas/user";

// Frontend imports from shared
import { userSchema } from "@/shared/schemas/user";
```

## Tooling

### TypeScript Strict Mode

Enable strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

### IDE Integration

Your IDE will:
- Autocomplete RPC method names
- Show parameter types inline
- Error on type mismatches
- Navigate to schema definitions

### Runtime Validation

```typescript
// Parse incoming data with runtime validation
const parseUser = (data: unknown): User => {
  return userSchema.parse(data); // Throws if invalid
};

// Safe parse for error handling
const result = userSchema.safeParse(data);
if (result.success) {
  console.log(result.data); // Typed as User
} else {
  console.error(result.error.issues);
}
```

## Related Documentation

- [Zod Integration](../domains/validation/zod-integration.md) - Zod patterns
- [Hono RPC](../domains/backend/hono-rpc.md) - RPC client details
- [Form Validation](./form-validation.md) - Form + Zod patterns
