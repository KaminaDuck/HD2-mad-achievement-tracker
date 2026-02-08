---
title: Introduction to Fearnstack
description: What is Fearnstack and when to use it
---

# Introduction to Fearnstack

The **Fearnstack** is a curated, opinionated TypeScript full-stack framework designed for maximum type safety, developer experience, and performance.

## What is Fearnstack?

Fearnstack is not a single framework - it's a carefully selected combination of best-in-class TypeScript libraries that work seamlessly together:

| Layer | Technology | Role |
|-------|------------|------|
| **Runtime** | Bun | JavaScript runtime, bundler, package manager |
| **Backend** | Hono | Lightweight, fast API framework |
| **Validation** | Zod | Type-safe schema validation |
| **Data Fetching** | TanStack Query | Async state management, caching |
| **Routing** | TanStack Router | Type-safe file-based routing |
| **Forms** | TanStack Form | Form state with validation |
| **Client DB** | TanStack DB | Client-side database with sync |
| **AI** | TanStack AI | LLM integration with streaming |
| **UI** | React 19 | Component library with Compiler |

## The Fearnstack Philosophy

### 1. Type Safety Everywhere

Types flow from your database schema through your API to your UI components - automatically. Define a Zod schema once, and TypeScript infers types throughout your entire application.

```typescript
// Define once
const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

// Types flow automatically
type User = z.infer<typeof userSchema>; // Inferred!
```

### 2. Developer Experience First

- **Fast feedback loops** - Bun's speed means instant starts and hot reload
- **Minimal boilerplate** - TanStack libraries handle the complexity
- **Great tooling** - First-class TypeScript support everywhere

### 3. Performance by Default

- **Bun runtime** - 3-4x faster than Node.js for many operations
- **React 19 Compiler** - Automatic memoization, no manual optimization
- **TanStack Query** - Smart caching reduces unnecessary requests

### 4. Progressive Complexity

Start simple and add features as you need them:

1. **Basic**: React + Query + Hono (80% of apps)
2. **Forms**: Add TanStack Form for complex forms
3. **Routing**: Add TanStack Router for multi-page apps
4. **Real-time**: Add TanStack DB for offline/sync
5. **AI**: Add TanStack AI for LLM features

## Stack Components

### Frontend: React 19 + TanStack

- **React 19** with the new Compiler for automatic optimizations
- **TanStack Router** for type-safe, file-based routing
- **TanStack Query** for data fetching with automatic caching
- **TanStack Form** for complex form state management
- **TanStack DB** for client-side persistence and sync
- **TanStack AI** for LLM chat interfaces and streaming

### Backend: Hono

- Lightweight (12kb), fast API framework
- Runs on Bun, Deno, Cloudflare Workers, and more
- Built-in RPC for end-to-end type safety
- Middleware ecosystem for auth, CORS, validation

### Runtime: Bun

- All-in-one JavaScript runtime
- Built-in bundler (replaces Webpack/Vite for production)
- Built-in package manager (faster than npm/yarn/pnpm)
- Built-in test runner (Jest-compatible API)
- Native TypeScript support (no transpilation needed)

### Validation: Zod

- TypeScript-first schema validation
- Works on both frontend and backend
- Automatic type inference
- Composable and extensible

## When to Use Fearnstack

**Choose Fearnstack when you need:**

- Maximum type safety across the stack
- Fast development with great DX
- Client-heavy applications (SPAs, dashboards)
- Real-time features (chat, collaboration)
- AI/LLM integration
- Lightweight runtime (edge deployment)

**Example use cases:**

- Internal tools and admin dashboards
- AI-powered applications
- Real-time collaboration apps
- Data-heavy business applications
- Developer tools and CLIs

## When NOT to Use Fearnstack

**Consider alternatives when you need:**

- **Heavy SSR/SEO** → Use Next.js or Remix
- **Static site generation** → Use Astro or Next.js
- **Existing Next.js codebase** → Stay with Next.js
- **React Server Components** → Use Next.js (Fearnstack is client-focused)
- **PHP/Ruby team** → Stick with familiar backend

## Prerequisites

Before diving in, you should be comfortable with:

- **TypeScript basics** - Types, interfaces, generics
- **React fundamentals** - Components, hooks, state
- **Async JavaScript** - Promises, async/await
- **HTTP basics** - REST concepts, status codes

Don't worry if you're not an expert - the [Quick Start](quick-start.md) walks through everything step by step.

## Next Steps

1. **[Quick Start](quick-start.md)** - Build your first Fearnstack app in 5 minutes
2. **[Architecture](architecture.md)** - Understand how the pieces fit together
3. **[Stack Comparison](stack-comparison.md)** - See how it compares to Next.js, Remix, etc.
