---
title: Error Handling
description: Consistent error handling patterns across the Fearnstack
---

# Error Handling

Consistent error handling from backend to frontend ensures good user experience and easier debugging.

## Error Handling Philosophy

1. **Fail fast** - Catch errors early with validation
2. **Fail gracefully** - Show helpful error messages
3. **Fail consistently** - Same error format everywhere
4. **Log appropriately** - Capture context for debugging

## Standard Error Format

Use this format across your entire stack:

```typescript
// src/shared/schemas/api.ts
import { z } from "zod";

export const apiErrorSchema = z.object({
  error: z.string(),                    // Human-readable message
  code: z.string().optional(),          // Machine-readable code
  details: z.record(z.array(z.string())).optional(), // Field-level errors
});

export type ApiError = z.infer<typeof apiErrorSchema>;

// Examples:
// { error: "User not found", code: "NOT_FOUND" }
// { error: "Validation failed", code: "VALIDATION_ERROR", details: { email: ["Invalid email"] } }
```

## Backend Error Handling

### Hono Error Middleware

```typescript
// src/server/middleware/error.ts
import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError } from "zod";

export async function errorHandler(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error("Error:", error);

    // Zod validation errors
    if (error instanceof ZodError) {
      return c.json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: error.flatten().fieldErrors,
      }, 400);
    }

    // HTTP exceptions
    if (error instanceof HTTPException) {
      return c.json({
        error: error.message,
        code: getCodeFromStatus(error.status),
      }, error.status);
    }

    // Unknown errors
    return c.json({
      error: process.env.NODE_ENV === "production"
        ? "Internal server error"
        : (error as Error).message,
      code: "INTERNAL_ERROR",
    }, 500);
  }
}

function getCodeFromStatus(status: number): string {
  const codes: Record<number, string> = {
    400: "BAD_REQUEST",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
    422: "UNPROCESSABLE_ENTITY",
    500: "INTERNAL_ERROR",
  };
  return codes[status] || "ERROR";
}

// Usage
app.use("*", errorHandler);
```

### Zod Validation Errors

```typescript
// Custom error handler for zValidator
import { zValidator } from "@hono/zod-validator";

const validateJson = <T extends z.ZodTypeAny>(schema: T) =>
  zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json({
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      }, 400);
    }
  });

// Usage
app.post("/users", validateJson(createUserSchema), async (c) => {
  const data = c.req.valid("json"); // Only runs if validation passes
});
```

### Business Logic Errors

```typescript
// src/server/lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400,
    public details?: Record<string, string[]>
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, "NOT_FOUND", 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
  }
}

// Usage in routes
app.get("/users/:id", async (c) => {
  const user = await db.users.findUnique({ where: { id } });
  if (!user) throw new NotFoundError("User");
  return c.json(user);
});

app.post("/users", async (c) => {
  const data = c.req.valid("json");
  const existing = await db.users.findUnique({ where: { email: data.email } });
  if (existing) throw new ConflictError("Email already registered");
  // ...
});
```

## Frontend Error Handling

### React Error Boundaries

```tsx
// src/client/components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Usage
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

### TanStack Query Error States

```tsx
// Query-level error handling
function UserProfile({ userId }: { userId: string }) {
  const { data, error, isError, refetch } = useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await client.api.users[":id"].$get({ param: { id: userId } });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to fetch user");
      }
      return res.json();
    },
    retry: 1,
  });

  if (isError) {
    return (
      <div className="error">
        <p>{error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return <div>{data?.name}</div>;
}
```

```tsx
// Global error handler
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes("4")) return false;
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler
        toast.error(error.message);
      },
    },
  },
});
```

### TanStack Form Validation Errors

```tsx
function RegisterForm() {
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: registerSchema,
    },
    onSubmit: async ({ value }) => {
      const res = await client.api.auth.register.$post({ json: value });
      if (!res.ok) {
        const error = await res.json();
        // Map server errors to form fields
        if (error.details) {
          Object.entries(error.details).forEach(([field, errors]) => {
            form.setFieldMeta(field as any, (meta) => ({
              ...meta,
              errors: [...meta.errors, ...(errors as string[])],
            }));
          });
        }
        throw new Error(error.error);
      }
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      <form.Field name="email">
        {(field) => (
          <div>
            <input {...field.getInputProps()} />
            {/* Show both client and server errors */}
            {field.state.meta.errors.map((e, i) => (
              <span key={i} className="error">{e}</span>
            ))}
          </div>
        )}
      </form.Field>
    </form>
  );
}
```

### TanStack Router Error Handling

```tsx
// Route-level error handling
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => {
    const res = await client.api.users[":id"].$get({ param: { id: params.userId } });
    if (!res.ok) {
      if (res.status === 404) throw notFound();
      throw new Error("Failed to load user");
    }
    return res.json();
  },
  errorComponent: ({ error }) => (
    <div className="error-page">
      <h1>Error</h1>
      <p>{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="not-found">
      <h1>User Not Found</h1>
      <Link to="/">Go Home</Link>
    </div>
  ),
});
```

```tsx
// Root error boundary
export const Route = createRootRoute({
  component: Root,
  errorComponent: ({ error }) => (
    <div className="root-error">
      <h1>Application Error</h1>
      <pre>{error.message}</pre>
    </div>
  ),
});
```

## Cross-Stack Error Propagation

### Type-Safe Error Handling

```typescript
// Shared error types
// src/shared/types/errors.ts
export interface ApiError {
  error: string;
  code?: string;
  details?: Record<string, string[]>;
}

// Helper to parse API responses
export async function parseApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error: ApiError = await response.json();
    throw new ApiResponseError(error);
  }
  return response.json();
}

export class ApiResponseError extends Error {
  constructor(public apiError: ApiError) {
    super(apiError.error);
  }

  get code() { return this.apiError.code; }
  get details() { return this.apiError.details; }
  get isNotFound() { return this.code === "NOT_FOUND"; }
  get isValidation() { return this.code === "VALIDATION_ERROR"; }
}
```

### Unified Error Component

```tsx
// src/client/components/ApiError.tsx
import { ApiResponseError } from "@/shared/types/errors";

interface Props {
  error: Error;
  onRetry?: () => void;
}

export function ApiErrorDisplay({ error, onRetry }: Props) {
  if (error instanceof ApiResponseError) {
    return (
      <div className="api-error">
        <h3>{error.message}</h3>

        {error.details && (
          <ul>
            {Object.entries(error.details).map(([field, errors]) => (
              <li key={field}>
                <strong>{field}:</strong> {errors.join(", ")}
              </li>
            ))}
          </ul>
        )}

        {onRetry && error.code !== "VALIDATION_ERROR" && (
          <button onClick={onRetry}>Retry</button>
        )}
      </div>
    );
  }

  return (
    <div className="generic-error">
      <h3>Something went wrong</h3>
      <p>{error.message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  );
}
```

## Logging and Monitoring

### Backend Logging

```typescript
// src/server/middleware/logging.ts
import { Context, Next } from "hono";

export async function requestLogger(c: Context, next: Next) {
  const start = Date.now();

  await next();

  const duration = Date.now() - start;
  const status = c.res.status;

  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    method: c.req.method,
    path: c.req.path,
    status,
    duration,
    ...(status >= 400 && { error: true }),
  }));
}
```

### Error Tracking Integration

```typescript
// src/server/lib/errorTracking.ts
export function captureError(error: Error, context?: Record<string, unknown>) {
  // Integrate with your error tracking service
  console.error("Captured error:", {
    message: error.message,
    stack: error.stack,
    ...context,
  });

  // Example: Sentry.captureException(error, { extra: context });
}

// Use in error middleware
app.use("*", async (c, next) => {
  try {
    await next();
  } catch (error) {
    captureError(error as Error, {
      path: c.req.path,
      method: c.req.method,
    });
    throw error;
  }
});
```

## Summary

| Layer | Error Type | Handling |
|-------|-----------|----------|
| Backend | Validation | zValidator → 400 with details |
| Backend | Not Found | throw NotFoundError → 404 |
| Backend | Business Logic | throw AppError → appropriate status |
| Backend | Unknown | Error middleware → 500 |
| Frontend | Query Error | isError + retry |
| Frontend | Mutation Error | onError callback |
| Frontend | Form Error | Field-level meta.errors |
| Frontend | Route Error | errorComponent |
| Frontend | Render Error | ErrorBoundary |

## Related Docs

- [Hono Middleware](../domains/backend/hono-middleware.md) - Middleware patterns
- [Zod Integration](../domains/validation/zod-integration.md) - Validation errors
- [TanStack Query](../domains/frontend/tanstack-query.md) - Query error states
- [Troubleshooting](./troubleshooting.md) - Common issues
