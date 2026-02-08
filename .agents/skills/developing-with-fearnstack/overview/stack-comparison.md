---
title: Stack Comparison
description: How Fearnstack compares to Next.js, Remix, and T3 Stack
---

# Stack Comparison

Understand how Fearnstack compares to other popular TypeScript stacks to make the right choice for your project.

## Feature Comparison Matrix

| Feature | Fearnstack | Next.js | Remix | T3 Stack |
|---------|------------|---------|-------|----------|
| **Runtime** | Bun | Node.js | Node.js | Node.js |
| **Framework Type** | Library collection | Monolithic | Monolithic | Library collection |
| **Rendering** | CSR (SPA) | SSR/SSG/CSR | SSR/CSR | SSR/SSG/CSR |
| **Routing** | TanStack Router | File-based | File-based | Next.js |
| **Data Fetching** | TanStack Query | Server Components | Loaders | tRPC + Query |
| **Forms** | TanStack Form | React Hook Form | Native | React Hook Form |
| **Validation** | Zod | Zod | Zod | Zod |
| **API Layer** | Hono RPC | API Routes | Actions | tRPC |
| **Type Safety** | End-to-end | Partial | Partial | End-to-end |
| **Bundle Size** | Small (Hono 12kb) | Large | Medium | Medium |
| **Learning Curve** | Moderate | Steep | Moderate | Steep |
| **Deployment** | Any (Bun server) | Vercel-optimized | Any | Vercel-optimized |

## Detailed Comparisons

### Fearnstack vs Next.js

**Next.js Advantages:**

- React Server Components for reduced client bundle
- Built-in image optimization
- Massive ecosystem and community
- Excellent documentation
- Vercel deployment optimizations
- Static site generation for content sites

**Fearnstack Advantages:**

- Faster development server (Bun vs Webpack/Turbopack)
- Simpler mental model (no RSC complexity)
- Lighter runtime (no Node.js)
- Better for client-heavy apps
- More control over data fetching
- Easier to deploy anywhere

**Choose Next.js when:**
- Building content-heavy sites with SEO requirements
- Need React Server Components
- Team already knows Next.js
- Want Vercel's infrastructure benefits

**Choose Fearnstack when:**
- Building dashboards, admin panels, internal tools
- Need maximum client-side interactivity
- Want simpler architecture
- Prefer explicit data fetching over RSC magic

### Fearnstack vs Remix

**Remix Advantages:**

- Progressive enhancement by default
- Excellent form handling with Actions
- Built-in error boundaries
- Nested routing with parallel loading
- Works without JavaScript

**Fearnstack Advantages:**

- TanStack Query's superior caching
- More flexible architecture
- Better real-time/streaming support
- Lighter weight (no opinions on forms, etc.)
- Runs on Bun (faster)

**Choose Remix when:**
- Building forms-heavy applications
- Need progressive enhancement
- Want framework-level conventions

**Choose Fearnstack when:**
- Building real-time applications
- Need fine-grained cache control
- Prefer composing libraries over framework conventions

### Fearnstack vs T3 Stack

T3 Stack is actually the closest comparison - it's also a curated collection of libraries.

**T3 Stack:**
- Next.js + tRPC + Prisma + NextAuth + Tailwind

**Fearnstack:**
- Bun + Hono + TanStack + Zod

**T3 Advantages:**

- More batteries included (auth, ORM)
- Better SSR support via Next.js
- Larger community

**Fearnstack Advantages:**

- Faster runtime (Bun vs Node)
- Lighter weight (no Next.js overhead)
- More flexible (swap any piece)
- TanStack ecosystem (Form, DB, AI, Table)
- Better for client-heavy apps

**Choose T3 when:**
- Need SSR/SSG
- Want included auth solution
- Team knows Next.js

**Choose Fearnstack when:**
- Building SPAs/dashboards
- Need TanStack-specific features (DB, AI)
- Want maximum flexibility

## Performance Comparison

Rough benchmarks (your mileage may vary):

| Metric | Fearnstack | Next.js | Remix |
|--------|------------|---------|-------|
| Dev server start | ~200ms | ~2-5s | ~1-2s |
| Production build | ~1-3s | ~30-60s | ~10-20s |
| Cold start | ~50ms | ~200-500ms | ~100-200ms |
| Bundle size (base) | ~50kb | ~80-100kb | ~60-80kb |

*Note: These are approximate. Actual numbers depend on app complexity.*

## Migration Paths

### From Next.js to Fearnstack

1. **Replace routing** - Next.js file routes → TanStack Router
2. **Replace data fetching** - Server Components → TanStack Query
3. **Replace API routes** - API routes → Hono
4. **Update forms** - React Hook Form → TanStack Form (or keep RHF)
5. **Update build** - Webpack/Turbopack → Vite + Bun

### From Create React App to Fearnstack

This is the easiest migration:

1. **Replace CRA with Vite** - Much faster
2. **Add TanStack Query** - Replace manual fetching
3. **Add Hono backend** - Replace Express/other
4. **Add TanStack Router** - If you need routing

### From Express to Fearnstack

1. **Replace Express with Hono** - Similar API, better types
2. **Add Zod validation** - Replace Joi/Yup
3. **Switch to Bun** - Drop-in replacement for Node

## When Each Stack Shines

### Choose Fearnstack for:

- **Dashboards & Admin Panels** - Heavy client-side interaction
- **Real-time Apps** - Chat, collaboration, live data
- **AI Applications** - LLM integration with streaming
- **Internal Tools** - Fast development, type safety
- **Developer Tools** - CLIs with web interfaces

### Choose Next.js for:

- **Marketing Sites** - SEO, static generation
- **E-commerce** - Server rendering, image optimization
- **Content Sites** - Blogs, documentation
- **Enterprise Apps** - When Vercel is approved vendor

### Choose Remix for:

- **Form-Heavy Apps** - Complex multi-step forms
- **Progressive Enhancement** - Works without JS
- **Traditional Web Apps** - Server-rendered CRUD

### Choose T3 for:

- **Full-Stack Startups** - Need everything included
- **Teams Familiar with Next** - Lower learning curve
- **Need Auth + ORM** - Included in stack

## Compatibility Notes

### Can I use Fearnstack components in Next.js?

Yes! TanStack libraries work in any React app:

```typescript
// In Next.js app
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from '@tanstack/react-form';
```

### Can I use Next.js components in Fearnstack?

Most will work, but:
- Server Components won't work (Fearnstack is client-only)
- next/image needs replacement
- next/link → TanStack Router Link

### Can I gradually migrate?

Yes - Fearnstack is just libraries. Add TanStack Query first, then Router, then Hono for new endpoints.

## Summary

| If you need... | Choose... |
|----------------|-----------|
| SSR/SEO | Next.js or Remix |
| Maximum speed (dev + runtime) | Fearnstack |
| Client-heavy app | Fearnstack |
| Form-heavy app | Remix or Fearnstack |
| Real-time features | Fearnstack |
| AI/LLM integration | Fearnstack |
| Existing Next.js team | Next.js or T3 |
| Maximum flexibility | Fearnstack |
| Everything included | T3 Stack |

## Next Steps

Ready to try Fearnstack?

1. **[Quick Start](quick-start.md)** - Build your first app
2. **[Introduction](introduction.md)** - Understand the philosophy
3. **[Architecture](architecture.md)** - Learn how it fits together
