---
title: Form Validation Integration
description: Unified validation with TanStack Form, Zod schemas, and Hono backend validation
---

# Form Validation Integration

Validate once, use everywhere. This guide shows how to share Zod schemas between TanStack Form on the frontend and Hono validation on the backend for consistent, type-safe validation.

## Validation Philosophy

```
                     SHARED ZOD SCHEMA
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │  Frontend  │  │   Backend  │  │  Database  │
    │ TanStack   │  │   Hono     │  │   Schema   │
    │   Form     │  │  zValidator│  │  Alignment │
    └────────────┘  └────────────┘  └────────────┘
           │               │               │
           ▼               ▼               ▼
    Real-time UX    Request Guard    Data Integrity
```

**Why validate on both sides?**
- **Frontend**: Immediate feedback, better UX
- **Backend**: Security, can't trust client data

## Defining Shared Schemas

### Schema Organization

```typescript
// src/shared/schemas/user.ts
import { z } from "zod";

// Base user schema with all validations
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters"),
  email: z.string()
    .email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

// For registration - includes password confirmation
export const registerSchema = userSchema
  .omit({ id: true })
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// For login - just email and password
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

// For profile update - no password fields
export const updateProfileSchema = userSchema.pick({
  name: true,
  email: true,
}).partial();

// Export types
export type User = z.infer<typeof userSchema>;
export type RegisterData = z.infer<typeof registerSchema>;
export type LoginData = z.infer<typeof loginSchema>;
export type UpdateProfileData = z.infer<typeof updateProfileSchema>;
```

## TanStack Form Setup

### Basic Form with Zod

```tsx
// src/client/components/RegisterForm.tsx
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { registerSchema, type RegisterData } from "@/shared/schemas/user";
import { client } from "../lib/api";

export function RegisterForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as RegisterData,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await client.api.auth.register.$post({ json: value });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* Fields rendered below */}
    </form>
  );
}
```

### Field Components with Error Display

```tsx
function FormField({ form, name, label, type = "text" }) {
  return (
    <form.Field name={name}>
      {(field) => (
        <div className="form-field">
          <label htmlFor={name}>{label}</label>
          <input
            id={name}
            type={type}
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            onBlur={field.handleBlur}
            className={field.state.meta.errors.length > 0 ? "error" : ""}
          />
          {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
            <div className="error-messages">
              {field.state.meta.errors.map((error, i) => (
                <span key={i} className="error-message">{error}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </form.Field>
  );
}

// Usage in form
<FormField form={form} name="name" label="Full Name" />
<FormField form={form} name="email" label="Email" type="email" />
<FormField form={form} name="password" label="Password" type="password" />
<FormField form={form} name="confirmPassword" label="Confirm Password" type="password" />
```

### Validation Modes

```tsx
const form = useForm({
  defaultValues: { /* ... */ },
  validatorAdapter: zodValidator(),
  validators: {
    // Validate on every keystroke
    onChange: registerSchema,

    // Validate on blur
    onBlur: registerSchema,

    // Validate on submit
    onSubmit: registerSchema,
  },
});
```

## Async Validation

### Email Uniqueness Check

```tsx
<form.Field
  name="email"
  validators={{
    // Sync validation first
    onChange: z.string().email(),

    // Then async validation
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      const res = await client.api.auth["check-email"].$get({
        query: { email: value },
      });
      const { exists } = await res.json();
      return exists ? "This email is already registered" : undefined;
    },
  }}
>
  {(field) => (
    <div>
      <input
        type="email"
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isValidating && <span>Checking...</span>}
      {field.state.meta.errors.map((e) => <span className="error">{e}</span>)}
    </div>
  )}
</form.Field>
```

### Backend Endpoint for Async Validation

```typescript
// src/server/routes/auth.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const auth = new Hono()
  .get(
    "/check-email",
    zValidator("query", z.object({ email: z.string().email() })),
    async (c) => {
      const { email } = c.req.valid("query");
      const exists = await db.users.findUnique({
        where: { email },
        select: { id: true },
      });
      return c.json({ exists: !!exists });
    }
  );
```

## Backend Validation

### Hono zValidator Middleware

```typescript
// src/server/routes/auth.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema, loginSchema } from "@/shared/schemas/user";

const auth = new Hono()
  .post(
    "/register",
    zValidator("json", registerSchema, (result, c) => {
      if (!result.success) {
        return c.json({
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        }, 400);
      }
    }),
    async (c) => {
      const data = c.req.valid("json");

      // Check email uniqueness on backend too
      const existing = await db.users.findUnique({
        where: { email: data.email },
      });
      if (existing) {
        return c.json({
          error: "Validation failed",
          details: { email: ["Email already registered"] },
        }, 400);
      }

      // Create user
      const user = await db.users.create({
        data: {
          id: crypto.randomUUID(),
          name: data.name,
          email: data.email,
          passwordHash: await hashPassword(data.password),
        },
      });

      return c.json({ user: { id: user.id, name: user.name, email: user.email } }, 201);
    }
  )

  .post(
    "/login",
    zValidator("json", loginSchema),
    async (c) => {
      const { email, password } = c.req.valid("json");

      const user = await db.users.findUnique({ where: { email } });
      if (!user || !await verifyPassword(password, user.passwordHash)) {
        return c.json({ error: "Invalid credentials" }, 401);
      }

      const token = await createToken(user);
      return c.json({ token });
    }
  );

export { auth };
```

### Query Parameter Validation

```typescript
.get(
  "/users",
  zValidator(
    "query",
    z.object({
      page: z.coerce.number().min(1).default(1),
      limit: z.coerce.number().min(1).max(100).default(20),
      search: z.string().optional(),
      role: z.enum(["admin", "user", "guest"]).optional(),
    })
  ),
  async (c) => {
    const { page, limit, search, role } = c.req.valid("query");
    // All params are typed and coerced correctly
    const users = await db.users.findMany({
      where: {
        ...(search && { name: { contains: search } }),
        ...(role && { role }),
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    return c.json(users);
  }
)
```

## Unified Error Handling

### Consistent Error Format

```typescript
// src/shared/schemas/api.ts
export const validationErrorSchema = z.object({
  error: z.string(),
  details: z.record(z.array(z.string())).optional(),
});

export type ValidationError = z.infer<typeof validationErrorSchema>;
```

### Frontend Error Display

```tsx
function RegisterForm() {
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  const form = useForm({
    // ...
    onSubmit: async ({ value }) => {
      try {
        const res = await client.api.auth.register.$post({ json: value });
        if (!res.ok) {
          const error = await res.json();
          if (error.details) {
            setServerErrors(error.details);
          }
          throw new Error(error.error);
        }
      } catch (e) {
        // Handle error
      }
    },
  });

  return (
    <form>
      <form.Field name="email">
        {(field) => (
          <div>
            <input /* ... */ />
            {/* Show both client and server errors */}
            {field.state.meta.errors.map((e) => <span className="error">{e}</span>)}
            {serverErrors.email?.map((e) => <span className="error">{e}</span>)}
          </div>
        )}
      </form.Field>
    </form>
  );
}
```

### Form-Level Errors

```tsx
function RegisterForm() {
  const form = useForm({
    // ...
    onSubmit: async ({ value, formApi }) => {
      const res = await client.api.auth.register.$post({ json: value });
      if (!res.ok) {
        const error = await res.json();

        // Map server errors to form fields
        if (error.details) {
          Object.entries(error.details).forEach(([field, errors]) => {
            formApi.setFieldMeta(field as any, (meta) => ({
              ...meta,
              errors: [...meta.errors, ...errors],
            }));
          });
        }

        throw new Error(error.error);
      }
    },
  });

  return (
    <form>
      {/* Form-level error display */}
      {form.state.submissionAttempts > 0 && !form.state.isSubmitting && form.state.errors.length > 0 && (
        <div className="form-errors">
          {form.state.errors.map((e, i) => <p key={i}>{e}</p>)}
        </div>
      )}

      {/* Fields... */}
    </form>
  );
}
```

## Complete Registration Example

### Shared Schema

```typescript
// src/shared/schemas/auth.ts
import { z } from "zod";

export const registerSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name is too long"),
  email: z.string()
    .email("Please enter a valid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[a-z]/, "Must contain lowercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterData = z.infer<typeof registerSchema>;
```

### Backend Route

```typescript
// src/server/routes/auth.ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { registerSchema } from "@/shared/schemas/auth";

const auth = new Hono()
  .post("/register", zValidator("json", registerSchema), async (c) => {
    const data = c.req.valid("json");

    // Business logic validation
    const exists = await db.users.findUnique({ where: { email: data.email } });
    if (exists) {
      return c.json({
        error: "Validation failed",
        details: { email: ["Email already registered"] },
      }, 400);
    }

    const user = await db.users.create({
      data: {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        passwordHash: await hash(data.password),
      },
    });

    return c.json({ id: user.id, name: user.name, email: user.email }, 201);
  });

export { auth };
```

### Frontend Form

```tsx
// src/client/components/RegisterForm.tsx
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { registerSchema, type RegisterData } from "@/shared/schemas/auth";
import { client } from "../lib/api";

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    } as RegisterData,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await client.api.auth.register.$post({ json: value });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Registration failed");
      }
      onSuccess();
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="name">
        {(field) => (
          <div>
            <label>Name</label>
            <input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
              <span className="error">{field.state.meta.errors[0]}</span>
            )}
          </div>
        )}
      </form.Field>

      {/* Similar fields for email, password, confirmPassword */}

      <button type="submit" disabled={!form.state.canSubmit || form.state.isSubmitting}>
        {form.state.isSubmitting ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
```

## Testing Validation

### Unit Testing Schemas

```typescript
import { describe, it, expect } from "bun:test";
import { registerSchema } from "@/shared/schemas/auth";

describe("registerSchema", () => {
  it("validates correct data", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "Password123",
      confirmPassword: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "Password123",
      confirmPassword: "Different123",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      name: "Alice",
      email: "alice@example.com",
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from "bun:test";
import { testClient } from "hono/testing";
import app from "@/server";

describe("POST /api/auth/register", () => {
  const client = testClient(app);

  it("creates user with valid data", async () => {
    const res = await client.api.auth.register.$post({
      json: {
        name: "Test User",
        email: `test${Date.now()}@example.com`,
        password: "Password123",
        confirmPassword: "Password123",
      },
    });
    expect(res.status).toBe(201);
  });

  it("rejects invalid email", async () => {
    const res = await client.api.auth.register.$post({
      json: {
        name: "Test",
        email: "not-an-email",
        password: "Password123",
        confirmPassword: "Password123",
      },
    });
    expect(res.status).toBe(400);
    const error = await res.json();
    expect(error.details?.email).toBeDefined();
  });
});
```

## Related Documentation

- [Zod Integration](../domains/validation/zod-integration.md) - Zod patterns
- [TanStack Form](../domains/frontend/tanstack-form.md) - Form state management
- [Hono Middleware](../domains/backend/hono-middleware.md) - Validation middleware
