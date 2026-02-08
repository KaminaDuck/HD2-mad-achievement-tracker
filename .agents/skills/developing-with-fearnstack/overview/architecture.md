---
title: Fearnstack Architecture
description: Understanding the full-stack mental model and data flow
---

# Fearnstack Architecture

Understanding how the Fearnstack pieces fit together will help you build applications more effectively. This guide covers the mental model, data flow patterns, and directory conventions.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    React 19 + Compiler                       ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │  TanStack   │  │  TanStack   │  │    TanStack         │ ││
│  │  │   Router    │  │    Form     │  │      AI             │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  │         │                │                    │             ││
│  │         └────────────────┼────────────────────┘             ││
│  │                          ▼                                   ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │              TanStack Query (Cache)                      │││
│  │  └─────────────────────────────────────────────────────────┘││
│  │                          │                                   ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │              TanStack DB (Client Storage)                │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│                             │                                    │
│                             │ HTTP / WebSocket                   │
└─────────────────────────────┼────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SERVER                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      Hono (API)                              ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ ││
│  │  │ Middleware  │  │   Routes    │  │      RPC            │ ││
│  │  │ (CORS,Auth) │  │  (REST)     │  │   (Type-safe)       │ ││
│  │  └─────────────┘  └─────────────┘  └─────────────────────┘ ││
│  │                          │                                   ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │                 Zod Validation                           │││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│                             │                                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Bun Runtime                               ││
│  │     (Server, Bundler, Package Manager, Test Runner)          ││
│  └─────────────────────────────────────────────────────────────┘│
│                             │                                    │
│                             ▼                                    │
│                      ┌─────────────┐                            │
│                      │  Database   │                            │
│                      └─────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Layer Overview

### Presentation Layer (React 19 + TanStack Router)

The UI layer handles rendering and user interactions:

- **React 19** - Component rendering with automatic optimizations via the Compiler
- **TanStack Router** - Type-safe routing with file-based route definitions
- **Components** - Your UI building blocks

```typescript
// Routes are type-safe
<Link to="/users/$userId" params={{ userId: '123' }}>
  View User
</Link>
```

### State Layer (TanStack Query, Form, DB)

Manages all application state:

| Library | Purpose | When to Use |
|---------|---------|-------------|
| **TanStack Query** | Server state, caching | Data fetching, mutations |
| **TanStack Form** | Form state, validation | Complex forms |
| **TanStack DB** | Client-side persistence | Offline, real-time sync |

```typescript
// Query handles server state
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

// Form handles form state
const form = useForm({ defaultValues: { name: '' } });

// DB handles persistent client state
const todos = useLiveQuery(db.todos.where('completed', '==', false));
```

### API Layer (Hono RPC/REST)

The boundary between frontend and backend:

- **REST endpoints** - Traditional HTTP routes
- **RPC endpoints** - Type-safe procedure calls
- **Middleware** - Cross-cutting concerns (auth, logging, CORS)

```typescript
// Backend: Define routes
const app = new Hono()
  .get('/users', async (c) => c.json(await getUsers()))
  .post('/users', zValidator('json', createUserSchema), async (c) => {
    const data = c.req.valid('json');
    return c.json(await createUser(data));
  });

// Frontend: Type-safe client
const client = hc<typeof app>('http://localhost:3001');
const users = await client.users.$get().then(r => r.json());
```

### Validation Layer (Zod)

Cross-cutting validation used everywhere:

```typescript
// Define once
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// Use in Hono
app.post('/users', zValidator('json', userSchema), handler);

// Use in TanStack Form
const form = useForm({
  validators: { onChange: userSchema },
});

// Use in TanStack Query
const { data } = useQuery({
  queryFn: async () => userSchema.array().parse(await fetchUsers()),
});
```

### Runtime Layer (Bun)

The foundation everything runs on:

- **HTTP Server** - Hosts your Hono API
- **Bundler** - Builds your frontend for production
- **Package Manager** - Installs dependencies
- **Test Runner** - Runs your tests

## Data Flow Patterns

### Request/Response Cycle

Standard data fetching flow:

```
User Action → Component → useQuery → fetch() → Hono → Database
                                        ↓
Component ← useQuery ← Cache ← Response ← Hono ← Database
```

1. User triggers action (button click, page load)
2. Component calls `useQuery` hook
3. Query checks cache, if miss, calls `queryFn`
4. `fetch()` sends request to Hono backend
5. Hono validates request with Zod, processes, returns response
6. Response cached by Query, component re-renders

### Mutation Flow

Writing data with optimistic updates:

```
User Action → useMutation → Optimistic Update → UI Updates
                    ↓
              fetch(POST) → Hono → Database
                    ↓
              Cache Invalidation → Refetch → UI Updates (confirmed)
```

```typescript
const mutation = useMutation({
  mutationFn: createUser,
  onMutate: async (newUser) => {
    // Optimistic update
    queryClient.setQueryData(['users'], (old) => [...old, newUser]);
  },
  onSettled: () => {
    // Refetch to confirm
    queryClient.invalidateQueries({ queryKey: ['users'] });
  },
});
```

### Real-Time Streaming (TanStack AI)

LLM response streaming:

```
User Message → useChat → fetch(POST) → Hono → LLM Provider
                              ↓
Component ← Stream Chunks ← SSE ← Hono ← LLM Provider
```

```typescript
// Frontend
const { messages, sendMessage } = useChat({
  api: '/api/chat',
});

// Backend
app.post('/api/chat', async (c) => {
  return streamSSE(c, async (stream) => {
    for await (const chunk of llmResponse) {
      await stream.write({ data: chunk });
    }
  });
});
```

### Client-Side Sync (TanStack DB)

Offline-first with background sync:

```
User Action → TanStack DB → Local Storage
                    ↓
             Sync Queue → Background Sync → Server
                    ↓
         Conflict Resolution → Update Local → UI Updates
```

## Type Safety Flow

Types flow automatically through the stack:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Zod Schema  │ ──► │ Hono Route   │ ──► │  RPC Types   │
│  (source of  │     │ (validates   │     │  (exported   │
│   truth)     │     │  requests)   │     │   to client) │
└──────────────┘     └──────────────┘     └──────────────┘
                                                 │
                                                 ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Component   │ ◄── │ Query Types  │ ◄── │  hc Client   │
│  Props       │     │  (inferred)  │     │  (type-safe) │
└──────────────┘     └──────────────┘     └──────────────┘
```

No manual type definitions needed - TypeScript infers everything.

## Directory Structure Conventions

Recommended project structure:

```
my-app/
├── src/
│   ├── client/              # Frontend code
│   │   ├── components/      # React components
│   │   ├── routes/          # TanStack Router routes
│   │   ├── hooks/           # Custom hooks
│   │   ├── lib/             # Utilities
│   │   └── main.tsx         # Entry point
│   │
│   ├── server/              # Backend code
│   │   ├── routes/          # Hono route handlers
│   │   ├── middleware/      # Custom middleware
│   │   ├── services/        # Business logic
│   │   ├── db/              # Database access
│   │   └── index.ts         # Hono app export
│   │
│   └── shared/              # Shared between client/server
│       ├── schemas/         # Zod schemas
│       └── types/           # Shared TypeScript types
│
├── public/                  # Static assets
├── tests/                   # Test files
├── index.html               # HTML entry
├── vite.config.ts           # Vite config
├── tsconfig.json            # TypeScript config
└── package.json
```

## Next Steps

Now that you understand the architecture:

1. **[Quick Start](quick-start.md)** - Build your first app
2. **[Frontend-Backend Integration](../integration/frontend-backend.md)** - Deep dive on RPC
3. **[Type-Safe APIs](../integration/type-safe-apis.md)** - End-to-end type patterns
