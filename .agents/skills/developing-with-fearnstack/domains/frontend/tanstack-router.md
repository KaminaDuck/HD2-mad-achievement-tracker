---
title: TanStack Router
description: Type-safe routing with file-based routes and data loading
---

# TanStack Router

TanStack Router provides fully type-safe routing for Fearnstack applications with automatic path completion, type-safe search parameters, and parallel data loading.

## Why TanStack Router?

- **100% Type Safety** - Every navigation, parameter, and search param is fully typed
- **File-Based Routing** - Auto-generated routes from file structure
- **Type-Safe Search Params** - URL state management with JSON support
- **Parallel Data Loading** - Eliminate request waterfalls
- **Built-in Caching** - SWR caching for route loaders
- **~12KB Bundle** - Lightweight with zero dependencies

## Installation

```bash
bun add @tanstack/react-router
bun add -D @tanstack/router-plugin @tanstack/router-devtools
```

## Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    TanStackRouterVite(),
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
});
```

## File-Based Routing

Create routes in `src/routes/`:

```
src/routes/
├── __root.tsx        # Root layout
├── index.tsx         # / route
├── about.tsx         # /about route
├── users/
│   ├── index.tsx     # /users route
│   └── $userId.tsx   # /users/:userId route
└── _layout/
    └── dashboard.tsx # Grouped layout
```

### Root Route

```typescript
// src/routes/__root.tsx
import { createRootRoute, Outlet, Link } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/users">Users</Link>
        <Link to="/about">About</Link>
      </nav>
      <main>
        <Outlet />
      </main>
      <TanStackRouterDevtools />
    </>
  );
}
```

### Index Route

```typescript
// src/routes/index.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <h1>Welcome to Fearnstack</h1>;
}
```

### Dynamic Routes

```typescript
// src/routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => {
    // params.userId is typed!
    const user = await fetchUser(params.userId);
    return { user };
  },
  component: UserPage,
});

function UserPage() {
  const { user } = Route.useLoaderData();
  return <div>{user.name}</div>;
}
```

## Router Setup

```typescript
// src/main.tsx
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen"; // Auto-generated

const router = createRouter({ routeTree });

// Type registration for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
```

## Type-Safe Navigation

Links and navigation are fully typed:

```typescript
import { Link, useNavigate } from "@tanstack/react-router";

function Navigation() {
  const navigate = useNavigate();

  return (
    <>
      {/* Type-safe Link - TypeScript errors if route doesn't exist */}
      <Link to="/users/$userId" params={{ userId: "123" }}>
        View User
      </Link>

      {/* With search params */}
      <Link
        to="/users"
        search={{ page: 1, filter: "active" }}
      >
        Active Users
      </Link>

      {/* Programmatic navigation */}
      <button onClick={() => navigate({ to: "/users/$userId", params: { userId: "456" } })}>
        Go to User
      </button>
    </>
  );
}
```

## Search Parameters

Type-safe JSON search parameters that work like a state manager:

```typescript
// src/routes/users/index.tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const userSearchSchema = z.object({
  page: z.number().default(1),
  filter: z.enum(["all", "active", "inactive"]).default("all"),
  sort: z.enum(["name", "created"]).optional(),
});

export const Route = createFileRoute("/users/")({
  validateSearch: userSearchSchema,
  component: UsersPage,
});

function UsersPage() {
  const { page, filter, sort } = Route.useSearch();
  const navigate = useNavigate();

  return (
    <div>
      <select
        value={filter}
        onChange={(e) =>
          navigate({
            search: (prev) => ({ ...prev, filter: e.target.value }),
          })
        }
      >
        <option value="all">All</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <UserList page={page} filter={filter} sort={sort} />

      <button
        onClick={() =>
          navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }) })
        }
      >
        Next Page
      </button>
    </div>
  );
}
```

## Data Loading

### Route Loaders

Parallel data loading with built-in caching:

```typescript
// src/routes/dashboard.tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  loader: async () => {
    // These run in parallel
    const [stats, recentActivity, notifications] = await Promise.all([
      fetchStats(),
      fetchRecentActivity(),
      fetchNotifications(),
    ]);

    return { stats, recentActivity, notifications };
  },
  component: Dashboard,
});

function Dashboard() {
  const { stats, recentActivity, notifications } = Route.useLoaderData();

  return (
    <div>
      <StatsPanel data={stats} />
      <ActivityFeed items={recentActivity} />
      <NotificationList items={notifications} />
    </div>
  );
}
```

### With TanStack Query

Integrate with Query for advanced caching:

```typescript
// src/routes/users/$userId.tsx
import { createFileRoute } from "@tanstack/react-router";
import { queryOptions } from "@tanstack/react-query";

const userQueryOptions = (userId: string) =>
  queryOptions({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
  });

export const Route = createFileRoute("/users/$userId")({
  loader: ({ context: { queryClient }, params }) => {
    // Prefetch into Query cache
    return queryClient.ensureQueryData(userQueryOptions(params.userId));
  },
  component: UserPage,
});

function UserPage() {
  const { userId } = Route.useParams();
  // Use Query for reactivity and refetching
  const { data: user } = useQuery(userQueryOptions(userId));

  return <div>{user?.name}</div>;
}
```

## Route Context

Pass data through the route tree:

```typescript
// src/routes/__root.tsx
import { createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";

interface RouterContext {
  queryClient: QueryClient;
  auth: { user: User | null };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

// src/main.tsx
const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: { user: null },
  },
});
```

## Route Guards

Protect routes with beforeLoad:

```typescript
// src/routes/_authenticated.tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async ({ context }) => {
    if (!context.auth.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
      });
    }
  },
});

// All routes under _authenticated/ require auth
// src/routes/_authenticated/dashboard.tsx
// src/routes/_authenticated/settings.tsx
```

## Pending States

Show loading UI during navigation:

```typescript
export const Route = createFileRoute("/users/$userId")({
  loader: async ({ params }) => {
    await new Promise((r) => setTimeout(r, 1000)); // Simulate slow load
    return fetchUser(params.userId);
  },
  pendingComponent: () => <div>Loading user...</div>,
  errorComponent: ({ error }) => <div>Error: {error.message}</div>,
  component: UserPage,
});
```

## Layouts

Group routes with shared layouts:

```typescript
// src/routes/_layout.tsx
import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_layout")({
  component: LayoutComponent,
});

function LayoutComponent() {
  return (
    <div className="layout">
      <Sidebar />
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}

// Routes in _layout/ use this layout
// src/routes/_layout/dashboard.tsx
// src/routes/_layout/settings.tsx
```

## DevTools

The router devtools show route tree, current location, and search params:

```typescript
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

function RootComponent() {
  return (
    <>
      <Outlet />
      {process.env.NODE_ENV === "development" && <TanStackRouterDevtools />}
    </>
  );
}
```

## Common Patterns

### Active Link Styling

```typescript
<Link
  to="/users"
  activeProps={{ className: "active" }}
  inactiveProps={{ className: "inactive" }}
>
  Users
</Link>
```

### Scroll Restoration

```typescript
const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 0,
  scrollRestoration: true,
});
```

### Prefetching

```typescript
<Link to="/users/$userId" params={{ userId: "123" }} preload="intent">
  View User (prefetches on hover)
</Link>
```

## Next Steps

- [TanStack Query](tanstack-query.md) - Advanced data fetching
- [Type-Safe APIs](../../integration/type-safe-apis.md) - End-to-end types with Hono
- [Frontend-Backend Integration](../../integration/frontend-backend.md) - Connect to backend
