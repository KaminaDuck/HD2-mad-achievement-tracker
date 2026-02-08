---
title: React 19 in Fearnstack
description: React 19 features, hooks, and React Compiler integration
---

# React 19 in Fearnstack

React 19 is the foundation of the Fearnstack frontend, providing automatic optimizations via the React Compiler and powerful new hooks for data mutations.

## New Hooks

### useActionState

Replaces `useFormState` for handling async actions with automatic pending state:

```typescript
import { useActionState } from "react";

function UpdateUserForm({ userId }: { userId: string }) {
  const [state, submitAction, isPending] = useActionState(
    async (previousState, formData: FormData) => {
      const name = formData.get("name") as string;
      const error = await updateUser(userId, name);
      if (error) return { error };
      return { success: true };
    },
    { error: null }
  );

  return (
    <form action={submitAction}>
      <input type="text" name="name" required />
      <button type="submit" disabled={isPending}>
        {isPending ? "Saving..." : "Save"}
      </button>
      {state.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

### useOptimistic

Provides immediate UI feedback during async operations:

```typescript
import { useOptimistic } from "react";

function TodoItem({ todo, onToggle }: Props) {
  const [optimisticTodo, setOptimisticTodo] = useOptimistic(todo);

  const handleToggle = async () => {
    setOptimisticTodo({ ...todo, completed: !todo.completed });
    await onToggle(todo.id); // If fails, React reverts automatically
  };

  return (
    <li
      onClick={handleToggle}
      style={{ textDecoration: optimisticTodo.completed ? "line-through" : "none" }}
    >
      {optimisticTodo.title}
    </li>
  );
}
```

### useFormStatus

Access parent form status without prop drilling:

```typescript
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}

// Use in any form - no props needed
function ContactForm() {
  return (
    <form action={submitContact}>
      <input name="email" type="email" />
      <textarea name="message" />
      <SubmitButton />
    </form>
  );
}
```

### use API

Read promises and context conditionally within render:

```typescript
import { use, Suspense } from "react";

function UserProfile({ userPromise }: { userPromise: Promise<User> }) {
  const user = use(userPromise);
  return <div>{user.name}</div>;
}

// Conditional usage (not possible with regular hooks)
function DataDisplay({ shouldLoad, dataPromise }: Props) {
  const data = shouldLoad ? use(dataPromise) : null;
  return <div>{data?.value ?? "No data"}</div>;
}

// Usage with Suspense
function App() {
  return (
    <Suspense fallback={<Loading />}>
      <UserProfile userPromise={fetchUser()} />
    </Suspense>
  );
}
```

**Important:** Don't create promises inside render - pass them from loaders or parent components.

## Form Actions

Forms now accept functions via `action` prop, automatically resetting after success:

```typescript
function CreateTodoForm({ onSuccess }: { onSuccess: () => void }) {
  async function createTodo(formData: FormData) {
    const title = formData.get("title") as string;
    await api.todos.create({ title });
    onSuccess();
  }

  return (
    <form action={createTodo}>
      <input name="title" placeholder="New todo..." required />
      <button type="submit">Add</button>
    </form>
  );
}
```

## React Compiler

The React Compiler automatically handles memoization, eliminating manual `useMemo`, `useCallback`, and `React.memo`.

### Vite/Bun Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
});
```

Install the compiler:

```bash
bun add -D babel-plugin-react-compiler@latest
```

### Verification

Components optimized by the compiler show a **Memo ✨** badge in React DevTools.

### Incremental Adoption

Use directives to control compilation:

```typescript
// Opt specific components into compilation (annotation mode)
function ExpensiveComponent() {
  "use memo";
  // Component is compiled
}

// Opt out problematic components temporarily
function LegacyComponent() {
  "use no memo";
  // Component is not compiled
}
```

## Developer Experience Improvements

### ref as Prop

No more `forwardRef` - refs work as regular props:

```typescript
// React 19
function Input({ ref, ...props }: { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}

// Usage
function Form() {
  const inputRef = useRef<HTMLInputElement>(null);
  return <Input ref={inputRef} placeholder="Enter text" />;
}
```

### Ref Cleanup Functions

Refs can return cleanup functions:

```typescript
function VideoPlayer() {
  return (
    <video
      ref={(element) => {
        if (element) {
          const player = initializePlayer(element);
          return () => player.destroy(); // Cleanup
        }
      }}
    />
  );
}
```

### Simplified Context

Use `<Context>` directly instead of `<Context.Provider>`:

```typescript
const ThemeContext = createContext("light");

// React 19 - simplified
function App() {
  return (
    <ThemeContext value="dark">
      <Main />
    </ThemeContext>
  );
}
```

## Document Metadata

Render metadata tags directly in components - they hoist to `<head>` automatically:

```typescript
function BlogPost({ post }: { post: Post }) {
  return (
    <article>
      <title>{post.title}</title>
      <meta name="description" content={post.excerpt} />
      <meta property="og:title" content={post.title} />

      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </article>
  );
}
```

## Resource Preloading

Optimize initial page loads with preloading APIs:

```typescript
import { preload, preinit, preconnect, prefetchDNS } from "react-dom";

function AppSetup() {
  // Preload critical resources
  preload("/fonts/main.woff2", { as: "font", type: "font/woff2" });

  // Initialize critical scripts
  preinit("/scripts/analytics.js", { as: "script" });

  // Establish early connections to API
  preconnect("http://localhost:3001");

  return <App />;
}
```

## Error Handling

Consolidated error callbacks on root:

```typescript
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root")!, {
  onCaughtError: (error, errorInfo) => {
    // Errors caught by Error Boundaries
    console.error("Caught:", error);
    logToService(error, errorInfo);
  },
  onUncaughtError: (error, errorInfo) => {
    // Errors not caught by Error Boundaries
    console.error("Uncaught:", error);
    logToService(error, errorInfo);
  },
  onRecoverableError: (error, errorInfo) => {
    // Errors React recovered from
    console.warn("Recovered:", error);
  },
});
```

## Integration with Fearnstack

### With TanStack Query

React 19's optimistic updates pair well with Query mutations:

```typescript
function TodoList() {
  const queryClient = useQueryClient();
  const { data: todos } = useQuery({ queryKey: ["todos"], queryFn: fetchTodos });

  const mutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (newTodo) => {
      // React 19 optimistic patterns work here
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData(["todos"]);
      queryClient.setQueryData(["todos"], (old: Todo[]) => [...old, newTodo]);
      return { previous };
    },
  });

  return (
    <form action={(formData) => mutation.mutate({ title: formData.get("title") })}>
      {/* ... */}
    </form>
  );
}
```

### With TanStack Form

Combine Form actions with React 19 patterns:

```typescript
import { useForm } from "@tanstack/react-form";

function UserForm() {
  const form = useForm({
    defaultValues: { name: "", email: "" },
    onSubmit: async ({ value }) => {
      await api.users.create(value);
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
        {(field) => <input {...field.getInputProps()} />}
      </form.Field>
      <SubmitButton /> {/* Uses useFormStatus */}
    </form>
  );
}
```

## Best Practices

1. **Use Actions for mutations** - Leverage automatic pending state management
2. **Combine with useOptimistic** - Provide instant feedback
3. **Let the Compiler optimize** - Remove manual memoization
4. **Use useFormStatus** - Avoid prop drilling for form states
5. **Preload critical resources** - Use `preload()` for fonts and assets

## Next Steps

- [TanStack Query](tanstack-query.md) - Data fetching with React 19
- [TanStack Form](tanstack-form.md) - Form state management
- [Frontend-Backend Integration](../../integration/frontend-backend.md) - Connect to Hono
