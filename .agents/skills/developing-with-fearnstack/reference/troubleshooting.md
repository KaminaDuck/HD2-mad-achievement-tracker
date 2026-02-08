---
title: Troubleshooting
description: Common issues and solutions for Fearnstack development
---

# Troubleshooting

Common issues and their solutions when developing with Fearnstack.

## TypeScript Issues

### Type Inference Problems

**Issue**: Types not inferring correctly from Hono RPC client.

```typescript
// ❌ Types not working
const res = await client.api.users.$get();
const data = await res.json(); // any
```

**Solution**: Ensure `AppType` is exported and imported correctly.

```typescript
// src/server/index.ts
export type AppType = typeof app; // Must export!

// src/client/lib/api.ts
import type { AppType } from "@/server"; // Use type import
export const client = hc<AppType>(url);
```

### Generic Constraints

**Issue**: TypeScript errors with generic components.

```typescript
// ❌ Error: T could be instantiated with a different subtype
function List<T>({ items }: { items: T[] }) {
  return items.map(item => item.id); // Error: Property 'id' does not exist
}
```

**Solution**: Add constraints.

```typescript
// ✅ Constrain the generic
function List<T extends { id: string }>({ items }: { items: T[] }) {
  return items.map(item => item.id); // Works
}
```

### Module Resolution

**Issue**: `Cannot find module '@/...'`

**Solution**: Configure path aliases in `tsconfig.json`.

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/server": ["./src/server/index.ts"],
      "@/shared/*": ["./src/shared/*"]
    }
  }
}
```

## TanStack Query Issues

### Stale Data

**Issue**: Data not refreshing after mutation.

**Solution**: Invalidate queries after mutation.

```typescript
const mutation = useMutation({
  mutationFn: createUser,
  onSuccess: () => {
    // ✅ Invalidate to refetch
    queryClient.invalidateQueries({ queryKey: ["users"] });
  },
});
```

### Cache Not Updating

**Issue**: UI not reflecting changes after optimistic update.

**Solution**: Ensure cache key matches exactly.

```typescript
// ❌ Keys don't match
queryClient.setQueryData(["user", id], newData);
// But query uses ["users", id]

// ✅ Use exact same key
queryClient.setQueryData(["users", id], newData);
```

### Infinite Refetch Loops

**Issue**: Query keeps refetching endlessly.

**Cause**: `queryFn` creates new objects on each render.

```typescript
// ❌ Object created each render
useQuery({
  queryKey: ["users", { filter }], // filter = { name: "test" }
  queryFn: fetchUsers,
});
```

**Solution**: Stabilize the query key.

```typescript
// ✅ Memoize or use primitive values
const stableFilter = useMemo(() => filter, [filter.name, filter.status]);
useQuery({
  queryKey: ["users", stableFilter],
  queryFn: fetchUsers,
});

// Or use primitives
useQuery({
  queryKey: ["users", filter.name, filter.status],
  queryFn: fetchUsers,
});
```

### Query Not Running

**Issue**: Query function never executes.

**Check these**:

```typescript
useQuery({
  queryKey: ["user", userId],
  queryFn: fetchUser,
  enabled: !!userId, // Is this false?
});

// Check if userId is undefined/null/empty string
console.log("userId:", userId, "enabled:", !!userId);
```

## TanStack Router Issues

### Route Not Matching

**Issue**: Navigation shows blank or wrong route.

**Check file naming**:
```
routes/
├── __root.tsx        # Root layout (double underscore)
├── index.tsx         # / route
├── users.tsx         # /users layout
├── users.index.tsx   # /users (exact)
└── users.$userId.tsx # /users/:userId
```

**Check Link props**:
```tsx
// ❌ Wrong
<Link to="/users/:userId">View</Link>

// ✅ Correct - use params
<Link to="/users/$userId" params={{ userId: "123" }}>View</Link>
```

### Type Errors in Routes

**Issue**: TypeScript errors when accessing params or search.

**Solution**: Use proper route utilities.

```tsx
// ✅ Use Route.useParams() not useParams()
function UserPage() {
  const { userId } = Route.useParams(); // Typed correctly
  const { tab } = Route.useSearch();    // Typed correctly
}
```

### Data Loading Issues

**Issue**: Loader not running or data undefined.

**Check**:
```tsx
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => {
    // params.userId is available here
    const res = await fetchUser(params.userId);
    return res; // Must return something!
  },
});

function Component() {
  const data = Route.useLoaderData(); // Returns loader result
}
```

## TanStack DB Issues

### LocalStorage Hydration Race

**Issue**: Default records inserted at startup overwrite persisted data.

**Cause**: Collection hydrates from LocalStorage asynchronously, but your code inserts defaults synchronously.

```typescript
// ❌ Race condition
const collection = createLocalStorageCollection({ name: "settings", ... });
collection.insert({ id: "default", theme: "light" }); // Overwrites persisted!
```

**Solution**: Insert lazily or check existence.

```typescript
// ✅ Insert only if empty (lazy initialization)
function useSettings() {
  const settings = collection.useQuery({ where: { id: "default" } });

  useEffect(() => {
    // Only insert after hydration, if nothing exists
    if (settings === undefined) return; // Still hydrating
    if (settings.length === 0) {
      collection.insert({ id: "default", theme: "light" });
    }
  }, [settings]);

  return settings?.[0];
}
```

### Collection Sync Issues

**Issue**: Data not syncing with backend.

**Check**: Are you using query-backed collection correctly?

```typescript
const collection = createQueryBackedCollection({
  name: "users",
  useQuery: () => useQuery({
    queryKey: ["users"],
    queryFn: fetchUsers, // Must return array
  }),
  useInsertMutation: () => useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] }); // Refresh!
    },
  }),
});
```

## Hono Issues

### CORS Problems

**Issue**: `Access-Control-Allow-Origin` errors in browser.

**Solution**: Configure CORS middleware.

```typescript
import { cors } from "hono/cors";

app.use("*", cors({
  origin: ["http://localhost:3000", "https://myapp.com"],
  credentials: true,
}));
```

### RPC Type Errors

**Issue**: Client methods don't match server routes.

**Check**:
1. Is `AppType` exported from server?
2. Are route methods chained correctly?

```typescript
// ❌ Breaks type chain
const users = new Hono();
users.get("/", handler1);
users.post("/", handler2);

// ✅ Chain methods for type inference
const users = new Hono()
  .get("/", handler1)
  .post("/", handler2);
```

### Middleware Order

**Issue**: Middleware not running or running in wrong order.

**Solution**: Order matters! Middleware runs in definition order.

```typescript
// ✅ Correct order
app
  .use("*", logger())           // 1. Log all requests
  .use("*", cors())             // 2. Handle CORS
  .use("/api/*", authMiddleware) // 3. Auth for API routes
  .route("/api/users", users);   // 4. Route handlers
```

## Bun Issues

### Package Resolution

**Issue**: `Cannot find package 'xyz'`

**Solutions**:
```bash
# Clear cache and reinstall
rm -rf node_modules bun.lockb
bun install

# Check if package exists
bun pm ls | grep xyz

# Install specific package
bun add xyz
```

### Build Errors

**Issue**: Build fails with syntax errors.

**Check `tsconfig.json`**:
```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx"
  }
}
```

### Native Module Issues

**Issue**: Native modules not working.

**Solution**: Some npm packages use Node.js native modules. Use Bun alternatives:

```typescript
// ❌ Node.js crypto
import crypto from "crypto";

// ✅ Bun native
const hash = Bun.hash("data");
const uuid = crypto.randomUUID(); // This works in Bun
```

## Development Environment

### Hot Reload Not Working

**Issue**: Changes not reflecting in browser.

**Check**:
```bash
# Use --hot flag
bun --hot run dev

# Check if file is being watched
# Some directories may be excluded
```

### Port Conflicts

**Issue**: `Address already in use`

**Solution**:
```bash
# Find process using port
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 bun run dev
```

### Environment Variables

**Issue**: `process.env.X` is undefined.

**Solutions**:
```bash
# Create .env file
echo "API_URL=http://localhost:3001" > .env

# Or set inline
API_URL=http://localhost:3001 bun run dev
```

```typescript
// Bun reads .env automatically, but validate:
const apiUrl = process.env.API_URL;
if (!apiUrl) throw new Error("API_URL required");
```

## Quick Fixes Checklist

| Problem | Quick Fix |
|---------|-----------|
| Types not working | Check `export type AppType` |
| Stale data | Add `queryClient.invalidateQueries()` |
| Route not found | Check file naming convention |
| CORS error | Add `cors()` middleware |
| DB data disappearing | Check for LocalStorage hydration race |
| Query not running | Check `enabled` condition |
| Build fails | Clear `node_modules` and reinstall |
| Hot reload broken | Use `bun --hot` flag |
| Env vars missing | Create `.env` file |

## Related Docs

- [Error Handling](./error-handling.md) - Error patterns
- [TanStack Query](../domains/frontend/tanstack-query.md) - Query patterns
- [TanStack DB](../domains/frontend/tanstack-db.md) - DB patterns
- [Hono Fundamentals](../domains/backend/hono-fundamentals.md) - Backend setup
