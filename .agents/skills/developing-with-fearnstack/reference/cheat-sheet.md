---
title: Fearnstack Cheat Sheet
description: Quick reference for common patterns across the stack
---

# Fearnstack Cheat Sheet

Quick lookup for common patterns. For detailed explanations, see the linked domain docs.

## Quick Setup

```bash
# New project
bunx create-hono@latest my-app
cd my-app && bun install

# Add TanStack
bun add @tanstack/react-query @tanstack/react-router @tanstack/react-form @tanstack/db

# Dev
bun run dev

# Build
bun build ./src/index.ts --outdir ./dist
```

## React 19 Hooks

```tsx
// Server Actions
const [state, action, isPending] = useActionState(serverAction, initialState);

// Optimistic updates
const [optimistic, addOptimistic] = useOptimistic(items, (state, newItem) => [...state, newItem]);

// Form status (inside form)
const { pending, data } = useFormStatus();

// Async data
const data = use(promise); // Suspends until resolved

// Unique IDs
const id = useId(); // "r:1" - SSR safe
```

## TanStack Query

```tsx
// Query
const { data, isLoading, error } = useQuery({
  queryKey: ["users"],
  queryFn: () => fetch("/api/users").then(r => r.json()),
});

// Query options factory
const userQueries = {
  all: () => queryOptions({
    queryKey: ["users"],
    queryFn: fetchUsers,
  }),
  byId: (id: string) => queryOptions({
    queryKey: ["users", id],
    queryFn: () => fetchUser(id),
    enabled: !!id,
  }),
};

// Mutation
const mutation = useMutation({
  mutationFn: (data) => client.api.users.$post({ json: data }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
});

// Prefetch
await queryClient.prefetchQuery(userQueries.byId(id));

// Invalidate
queryClient.invalidateQueries({ queryKey: ["users"] });
```

## TanStack Form

```tsx
const form = useForm({
  defaultValues: { name: "", email: "" },
  validatorAdapter: zodValidator(),
  validators: { onChange: schema },
  onSubmit: async ({ value }) => { /* submit */ },
});

// Field
<form.Field name="name">
  {(field) => (
    <>
      <input
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors[0]}
    </>
  )}
</form.Field>

// Submit
<button disabled={!form.state.canSubmit}>
  {form.state.isSubmitting ? "..." : "Submit"}
</button>
```

## TanStack Router

```tsx
// Route definition (file: routes/users.$userId.tsx)
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => fetchUser(params.userId),
  component: UserPage,
});

// Use loader data
const user = Route.useLoaderData();

// Navigate
const navigate = useNavigate();
navigate({ to: "/users/$userId", params: { userId: "123" } });

// Link
<Link to="/users/$userId" params={{ userId: "123" }}>View</Link>

// Search params
export const Route = createFileRoute("/search")({
  validateSearch: z.object({ q: z.string().default("") }),
});
const { q } = Route.useSearch();
```

## TanStack DB

```tsx
// Create collection
const todos = createLocalStorageCollection({
  name: "todos",
  primaryKey: "id",
  schema: todoSchema,
});

// CRUD
todos.insert({ id: crypto.randomUUID(), text: "Task" });
todos.update("id-123", { text: "Updated" });
todos.delete("id-123");

// Query
const items = todos.useQuery({ where: { completed: false } });
```

> **Warning**: Don't insert defaults at app startup - it races with LocalStorage hydration.

## Hono

```tsx
// Basic app
const app = new Hono()
  .use("*", cors())
  .get("/users", async (c) => {
    const users = await db.users.findMany();
    return c.json(users);
  })
  .post("/users", zValidator("json", createUserSchema), async (c) => {
    const data = c.req.valid("json");
    const user = await db.users.create({ data });
    return c.json(user, 201);
  });

export type AppType = typeof app;

// RPC client
import { hc } from "hono/client";
const client = hc<AppType>("http://localhost:3001");
const res = await client.api.users.$get();
```

## Hono Middleware

```tsx
// CORS
app.use("*", cors({ origin: "http://localhost:3000" }));

// JWT
app.use("/api/*", jwt({ secret: process.env.JWT_SECRET }));

// Zod validation
app.post("/", zValidator("json", schema), handler);
app.get("/", zValidator("query", querySchema), handler);
app.get("/:id", zValidator("param", paramSchema), handler);
```

## Hono Streaming

```tsx
// SSE
import { streamSSE } from "hono/streaming";

app.get("/stream", (c) =>
  streamSSE(c, async (stream) => {
    await stream.writeSSE({ data: JSON.stringify({ msg: "hello" }) });
  })
);

// Text streaming
import { streamText } from "hono/streaming";

app.get("/stream", (c) =>
  streamText(c, async (stream) => {
    await stream.write("Hello ");
    await stream.write("World");
  })
);
```

## Zod

```tsx
// Schema
const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["admin", "user"]),
});

// Derive types
type User = z.infer<typeof userSchema>;

// Derive schemas
const createSchema = userSchema.omit({ id: true });
const updateSchema = createSchema.partial();

// Parse
const user = userSchema.parse(data);       // throws
const result = userSchema.safeParse(data); // { success, data?, error? }

// Coercion (for query params)
z.coerce.number()  // "123" → 123
z.coerce.boolean() // "true" → true
z.coerce.date()    // "2024-01-01" → Date
```

## Bun

```bash
# Run
bun run script.ts
bun --hot script.ts  # hot reload

# Test
bun test
bun test --watch
bun test --coverage

# Package
bun add package
bun add -d devpackage
bun remove package

# Build
bun build ./src/index.ts --outdir ./dist
bun build --compile ./src/cli.ts --outfile myapp
```

```tsx
// File I/O
const content = await Bun.file("path").text();
await Bun.write("path", content);

// Hashing
const hash = Bun.hash("data");
const password = await Bun.password.hash("secret");

// Shell
const { stdout } = await $`ls -la`;
```

## Common Patterns

### Full Query + Mutation

```tsx
function UserList() {
  const { data: users } = useQuery(userQueries.all());
  const create = useMutation({
    mutationFn: (d) => client.api.users.$post({ json: d }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  return (
    <>
      <button onClick={() => create.mutate({ name: "New" })}>Add</button>
      {users?.map(u => <div key={u.id}>{u.name}</div>)}
    </>
  );
}
```

### Form with API Submit

```tsx
function CreateForm() {
  const form = useForm({
    defaultValues: { name: "", email: "" },
    validatorAdapter: zodValidator(),
    validators: { onChange: createUserSchema },
    onSubmit: async ({ value }) => {
      await client.api.users.$post({ json: value });
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }}>
      {/* fields */}
    </form>
  );
}
```

### Typed Route with Loader

```tsx
// routes/users.$userId.tsx
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => {
    const res = await client.api.users[":id"].$get({ param: { id: params.userId } });
    if (!res.ok) throw new Error("Not found");
    return res.json();
  },
  component: () => {
    const user = Route.useLoaderData();
    return <div>{user.name}</div>;
  },
});
```

## Related Docs

- [React 19](../domains/frontend/react-19.md)
- [TanStack Query](../domains/frontend/tanstack-query.md)
- [TanStack Router](../domains/frontend/tanstack-router.md)
- [TanStack Form](../domains/frontend/tanstack-form.md)
- [TanStack DB](../domains/frontend/tanstack-db.md)
- [Hono Fundamentals](../domains/backend/hono-fundamentals.md)
- [Zod Fundamentals](../domains/validation/zod-fundamentals.md)
- [Bun Runtime](../domains/runtime/bun-runtime.md)
