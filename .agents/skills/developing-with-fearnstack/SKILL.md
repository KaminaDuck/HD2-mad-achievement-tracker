---
name: developing-with-fearnstack
description: Comprehensive guide for building full-stack TypeScript applications with the Fearnstack - React 19, TanStack (Router, Query, Form, DB, AI), Hono, Bun, and Zod. Covers frontend patterns, backend APIs, runtime configuration, and cross-stack integration. Use when building new apps, learning the stack, or troubleshooting integration issues.
---

# Developing with Fearnstack

Comprehensive skill for building full-stack TypeScript applications with the **Fearnstack** - a curated, type-safe stack optimized for developer experience and performance.

## Quick Navigation

| I need to... | Go to... |
|--------------|----------|
| Get started quickly | [Quick Start](overview/quick-start.md) |
| Understand the architecture | [Architecture](overview/architecture.md) |
| Compare to Next.js/Remix | [Stack Comparison](overview/stack-comparison.md) |
| Set up routing | [TanStack Router](domains/frontend/tanstack-router.md) |
| Fetch and cache data | [TanStack Query](domains/frontend/tanstack-query.md) |
| Build forms | [TanStack Form](domains/frontend/tanstack-form.md) |
| Use client-side DB | [TanStack DB](domains/frontend/tanstack-db.md) |
| Add AI/LLM features | [TanStack AI](domains/frontend/tanstack-ai.md) |
| Create API endpoints | [Hono Fundamentals](domains/backend/hono-fundamentals.md) |
| Use type-safe RPC | [Hono RPC](domains/backend/hono-rpc.md) |
| Validate data | [Zod Fundamentals](domains/validation/zod-fundamentals.md) |
| Connect frontend to backend | [Frontend-Backend Integration](integration/frontend-backend.md) |
| Quick pattern lookup | [Cheat Sheet](reference/cheat-sheet.md) |
| Fix common issues | [Troubleshooting](reference/troubleshooting.md) |

## Skill Structure

```
developing-with-fearnstack/
├── overview/              # Tier 1: Getting started
│   ├── introduction       # What is Fearnstack
│   ├── quick-start        # 5-minute full-stack app
│   ├── architecture       # Full-stack mental model
│   └── stack-comparison   # vs Next.js, Remix, T3
├── domains/               # Tier 2: Deep dives by technology
│   ├── frontend/          # React 19 + TanStack ecosystem
│   │   ├── react-19       # React 19 features + Compiler
│   │   ├── tanstack-router    # Type-safe routing
│   │   ├── tanstack-query     # Data fetching + caching
│   │   ├── tanstack-form      # Form state management
│   │   ├── tanstack-db        # Client-side database
│   │   └── tanstack-ai        # LLM integration
│   ├── backend/           # Hono API framework
│   │   ├── hono-fundamentals  # Core concepts
│   │   ├── hono-rpc           # Type-safe RPC
│   │   ├── hono-middleware    # Middleware patterns
│   │   └── hono-streaming     # SSE + streaming
│   ├── runtime/           # Bun runtime
│   │   ├── bun-runtime        # Runtime features
│   │   ├── bun-bundler        # Bundling
│   │   ├── bun-testing        # Test framework
│   │   └── bun-package-manager    # Workspaces
│   └── validation/        # Zod schemas
│       ├── zod-fundamentals   # Basic validation
│       └── zod-integration    # Cross-stack patterns
├── integration/           # Tier 3: Cross-cutting patterns
│   ├── frontend-backend   # Hono RPC + Query
│   ├── type-safe-apis     # End-to-end types
│   ├── form-validation    # Form + Zod + Hono
│   ├── ai-streaming       # TanStack AI + Hono
│   └── database-sync      # TanStack DB + backend
├── reference/             # Tier 4: Quick lookup
│   ├── cheat-sheet        # Common patterns
│   ├── react-patterns     # Hooks, effects
│   ├── error-handling     # Error patterns
│   └── troubleshooting    # Common issues
├── internals/             # Tier 5: Advanced
│   ├── performance        # Optimization
│   ├── caching-strategies # Query + DB caching
│   ├── testing-strategies # Full-stack testing
│   └── deployment         # Production patterns
└── references/            # Tier 6: Original API docs
    ├── react/             # React 19, Compiler, Effects
    ├── tanstack/          # Router, Query, Form, DB, AI
    ├── hono/              # API, middleware, helpers
    ├── bun/               # Runtime, bundler, test
    └── zod/               # Schema API, error handling
```

## The Fearnstack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Runtime** | Bun | Fast JS runtime, bundler, package manager |
| **Backend** | Hono | Lightweight API framework with RPC |
| **Validation** | Zod | Type-safe schemas (used everywhere) |
| **State** | TanStack Query | Async state, caching, mutations |
| **Routing** | TanStack Router | Type-safe file-based routing |
| **Forms** | TanStack Form | Form state with Zod validation |
| **Client DB** | TanStack DB | Client-side database with sync |
| **AI** | TanStack AI | LLM integration with streaming |
| **UI** | React 19 | UI components with Compiler |

## Key Concepts

### End-to-End Type Safety

The Fearnstack provides complete type inference from database to UI:

```
Zod Schema → Hono Validator → RPC Types → Query Types → Component Props
```

No manual type definitions - types flow automatically through the entire stack.

### Progressive Complexity

Start simple, add features as needed:

1. **Basic**: React + Query + Hono (most apps)
2. **Forms**: Add TanStack Form + Zod validation
3. **Routing**: Add TanStack Router for complex navigation
4. **Real-time**: Add TanStack DB for offline/sync
5. **AI**: Add TanStack AI for LLM features

## Getting Started

**New to Fearnstack?** Start here:

1. [Introduction](overview/introduction.md) - Understand the philosophy
2. [Quick Start](overview/quick-start.md) - Build your first app in 5 minutes
3. [Architecture](overview/architecture.md) - Understand the full-stack flow

**Coming from Next.js/Remix?** Start here:

1. [Stack Comparison](overview/stack-comparison.md) - Understand the differences
2. [TanStack Router](domains/frontend/tanstack-router.md) - Routing patterns
3. [Frontend-Backend Integration](integration/frontend-backend.md) - Data fetching

**Building specific features?** Jump to:

- [AI Chat Interface](integration/ai-streaming.md) - LLM streaming UI
- [Type-Safe APIs](integration/type-safe-apis.md) - End-to-end types
- [Form Validation](integration/form-validation.md) - Forms with backend validation

## Examples

### Basic: Query + Hono RPC

```typescript
// Backend: Hono route
app.get('/api/users', async (c) => {
  const users = await db.select().from(usersTable);
  return c.json(users);
});

// Frontend: TanStack Query
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => client.api.users.$get().then(r => r.json()),
});
```

### Advanced: Type-Safe Form Submission

```typescript
// Shared: Zod schema
const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

// Backend: Validated endpoint
app.post('/api/users', zValidator('json', createUserSchema), async (c) => {
  const data = c.req.valid('json'); // Typed!
  return c.json(await createUser(data));
});

// Frontend: Form with validation
const form = useForm({
  defaultValues: { name: '', email: '' },
  validatorAdapter: zodValidator(),
  validators: { onChange: createUserSchema },
});
```

## Important Warnings

### TanStack DB LocalStorage Hydration

LocalStorageCollections auto-hydrate from localStorage on creation. Don't insert default records during app initialization - it races with hydration and overwrites persisted data.

**Pattern:** Insert default records lazily (on first mutation), not eagerly (on app startup).

## Deep Dive References

For comprehensive API documentation and detailed reference material, see the `references/` directory:

| Technology | Reference Path | Contents |
|------------|----------------|----------|
| **React 19** | [references/react/](references/react/) | React 19 features, Compiler, Effect patterns |
| **TanStack Router** | [references/tanstack/router/](references/tanstack/router/) | Routing concepts, API, guides |
| **TanStack Query** | [references/tanstack/query/](references/tanstack/query/) | Query/mutation API, caching |
| **TanStack Form** | [references/tanstack/form/](references/tanstack/form/) | Form API, validation adapters |
| **TanStack DB** | [references/tanstack/db/](references/tanstack/db/) | Collections, sync, LocalStorage |
| **TanStack AI** | [references/tanstack/ai/](references/tanstack/ai/) | Providers, streaming, adapters |
| **Hono** | [references/hono/](references/hono/) | API, middleware, helpers, guides |
| **Bun** | [references/bun/](references/bun/) | Runtime, bundler, test, package manager |
| **Zod** | [references/zod/](references/zod/) | Schema API, error handling, v4 reference |

### When to Use References

- **Overview/domains/integration** files → Patterns and how-to guidance
- **references/** files → Complete API docs, all options, edge cases

## Related Resources

- [TanStack Official Docs](https://tanstack.com/)
- [Hono Official Docs](https://hono.dev/)
- [Bun Official Docs](https://bun.sh/)
- [Zod Official Docs](https://zod.dev/)
- [React 19 Docs](https://react.dev/)
