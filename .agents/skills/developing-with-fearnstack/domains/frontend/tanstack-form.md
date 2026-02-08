---
title: TanStack Form
description: Type-safe form state management and validation
---

# TanStack Form

TanStack Form provides headless, performant, and type-safe form state management with first-class Zod integration for Fearnstack applications.

## Why TanStack Form?

- **TypeScript-First** - Full type inference from schemas to components
- **Headless** - Complete control over UI, no style opinions
- **Granular Reactivity** - Only affected fields re-render
- **Zod Integration** - Share validation schemas with Hono backend
- **Zero Dependencies** - Lightweight and fast

## Installation

```bash
bun add @tanstack/react-form @tanstack/zod-form-adapter zod
```

## Basic Usage

```typescript
import { useForm } from "@tanstack/react-form";

function ContactForm() {
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
    onSubmit: async ({ value }) => {
      await submitContact(value);
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
            <label htmlFor={field.name}>Name</label>
            <input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="email">
        {(field) => (
          <div>
            <label htmlFor={field.name}>Email</label>
            <input
              id={field.name}
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      <form.Field name="message">
        {(field) => (
          <div>
            <label htmlFor={field.name}>Message</label>
            <textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
          </div>
        )}
      </form.Field>

      <button type="submit" disabled={form.state.isSubmitting}>
        {form.state.isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
```

## Zod Validation

Share schemas between frontend and backend:

```typescript
// shared/schemas/user.ts
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(18, "Must be at least 18").optional(),
});

export type CreateUser = z.infer<typeof createUserSchema>;
```

```typescript
// Frontend: TanStack Form with Zod
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { createUserSchema } from "@/shared/schemas/user";

function CreateUserForm() {
  const form = useForm({
    defaultValues: { name: "", email: "", age: undefined as number | undefined },
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
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
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

      <button type="submit">Create User</button>
    </form>
  );
}
```

```typescript
// Backend: Hono with same schema
import { zValidator } from "@hono/zod-validator";
import { createUserSchema } from "@/shared/schemas/user";

app.post("/api/users", zValidator("json", createUserSchema), async (c) => {
  const data = c.req.valid("json"); // Same types!
  const user = await createUser(data);
  return c.json(user);
});
```

## Validation Modes

Control when validation runs:

```typescript
const form = useForm({
  defaultValues: { email: "" },
  validatorAdapter: zodValidator(),
  validators: {
    // Validate on every change
    onChange: z.object({ email: z.string().email() }),
    // Or validate on blur
    onBlur: z.object({ email: z.string().email() }),
    // Or validate on submit only
    onSubmit: z.object({ email: z.string().email() }),
  },
});
```

### Field-Level Validation

```typescript
<form.Field
  name="email"
  validators={{
    onChange: ({ value }) =>
      !value.includes("@") ? "Must be a valid email" : undefined,
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      const exists = await checkEmailExists(value);
      return exists ? "Email already registered" : undefined;
    },
  }}
>
  {(field) => (
    <div>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.isValidating && <span>Checking...</span>}
      {field.state.meta.errors.map((err) => (
        <span key={err} className="error">{err}</span>
      ))}
    </div>
  )}
</form.Field>
```

## Array Fields

Handle dynamic lists:

```typescript
function TagsForm() {
  const form = useForm({
    defaultValues: {
      tags: ["react", "typescript"],
    },
    onSubmit: async ({ value }) => console.log(value.tags),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="tags" mode="array">
        {(field) => (
          <div>
            {field.state.value.map((_, index) => (
              <form.Field key={index} name={`tags[${index}]`}>
                {(subField) => (
                  <div>
                    <input
                      value={subField.state.value}
                      onChange={(e) => subField.handleChange(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => field.removeValue(index)}
                    >
                      Remove
                    </button>
                  </div>
                )}
              </form.Field>
            ))}
            <button type="button" onClick={() => field.pushValue("")}>
              Add Tag
            </button>
          </div>
        )}
      </form.Field>
    </form>
  );
}
```

## Nested Objects

Handle complex nested structures:

```typescript
interface FormValues {
  user: {
    profile: {
      firstName: string;
      lastName: string;
    };
    settings: {
      newsletter: boolean;
    };
  };
}

function UserForm() {
  const form = useForm<FormValues>({
    defaultValues: {
      user: {
        profile: { firstName: "", lastName: "" },
        settings: { newsletter: false },
      },
    },
    onSubmit: async ({ value }) => console.log(value),
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="user.profile.firstName">
        {(field) => (
          <input
            placeholder="First Name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Field name="user.profile.lastName">
        {(field) => (
          <input
            placeholder="Last Name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Field name="user.settings.newsletter">
        {(field) => (
          <label>
            <input
              type="checkbox"
              checked={field.state.value}
              onChange={(e) => field.handleChange(e.target.checked)}
            />
            Subscribe to newsletter
          </label>
        )}
      </form.Field>
    </form>
  );
}
```

## Integration with TanStack Query

Combine forms with mutations:

```typescript
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { zodValidator } from "@tanstack/zod-form-adapter";

function CreateTodoForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (data: CreateTodo) => {
      const res = await client.api.todos.$post({ json: data });
      if (!res.ok) throw new Error("Failed to create todo");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
      form.reset();
      onSuccess?.();
    },
  });

  const form = useForm({
    defaultValues: { title: "", priority: "medium" as const },
    validatorAdapter: zodValidator(),
    validators: {
      onSubmit: createTodoSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="title">
        {(field) => (
          <input
            placeholder="What needs to be done?"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>

      <form.Field name="priority">
        {(field) => (
          <select
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value as Priority)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        )}
      </form.Field>

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Creating..." : "Add Todo"}
      </button>

      {mutation.error && (
        <p className="error">{mutation.error.message}</p>
      )}
    </form>
  );
}
```

## Form State

Access form-level state:

```typescript
function FormWithStatus() {
  const form = useForm({
    defaultValues: { name: "" },
    onSubmit: async ({ value }) => {
      await submitForm(value);
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* Fields... */}

      <div className="status">
        {form.state.isSubmitting && <span>Submitting...</span>}
        {form.state.isValidating && <span>Validating...</span>}
        {form.state.isDirty && <span>Unsaved changes</span>}
        {form.state.canSubmit && <span>Ready to submit</span>}
      </div>

      <button type="submit" disabled={!form.state.canSubmit}>
        Submit
      </button>

      <button type="button" onClick={() => form.reset()}>
        Reset
      </button>
    </form>
  );
}
```

## Error Display Pattern

Create reusable error display:

```typescript
function FieldError({ field }: { field: FieldApi<any, any, any, any> }) {
  const errors = field.state.meta.errors;

  if (errors.length === 0) return null;

  return (
    <div className="field-errors">
      {errors.map((error, i) => (
        <span key={i} className="error">
          {error}
        </span>
      ))}
    </div>
  );
}

// Usage
<form.Field name="email">
  {(field) => (
    <div className="field">
      <label>Email</label>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        className={field.state.meta.errors.length > 0 ? "invalid" : ""}
      />
      <FieldError field={field} />
    </div>
  )}
</form.Field>
```

## Common Patterns

### Conditional Fields

```typescript
<form.Field name="hasAddress">
  {(field) => (
    <input
      type="checkbox"
      checked={field.state.value}
      onChange={(e) => field.handleChange(e.target.checked)}
    />
  )}
</form.Field>

<form.Subscribe selector={(state) => state.values.hasAddress}>
  {(hasAddress) =>
    hasAddress && (
      <form.Field name="address">
        {(field) => (
          <input
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
          />
        )}
      </form.Field>
    )
  }
</form.Subscribe>
```

### Transform Values

```typescript
<form.Field
  name="price"
  validators={{
    onChange: ({ value }) => (value < 0 ? "Must be positive" : undefined),
  }}
>
  {(field) => (
    <input
      type="number"
      value={field.state.value}
      onChange={(e) => field.handleChange(parseFloat(e.target.value) || 0)}
    />
  )}
</form.Field>
```

## Next Steps

- [Zod Integration](../validation/zod-integration.md) - Cross-stack validation
- [Form Validation](../../integration/form-validation.md) - Complete form patterns
- [Frontend-Backend Integration](../../integration/frontend-backend.md) - End-to-end flows
