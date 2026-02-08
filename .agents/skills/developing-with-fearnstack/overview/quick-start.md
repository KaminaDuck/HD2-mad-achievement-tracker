---
title: Quick Start
description: Get a full-stack Fearnstack app running in 5 minutes
---

# Quick Start

Build a complete full-stack Fearnstack application in 5 minutes. By the end, you'll have a React frontend talking to a Hono backend with type-safe RPC.

## Prerequisites

Before starting, ensure you have:

- [ ] **Bun installed** - `curl -fsSL https://bun.sh/install | bash`
- [ ] **Node.js 18+** (for some tooling compatibility)
- [ ] **A code editor** with TypeScript support (VS Code recommended)

Verify Bun is installed:

```bash
bun --version  # Should show 1.0+
```

## Step 1: Initialize Project

Create a new project with Bun:

```bash
mkdir my-fearnstack-app && cd my-fearnstack-app
bun init -y
```

Install core dependencies:

```bash
bun add hono @hono/zod-validator zod
bun add react react-dom @tanstack/react-query
bun add -d typescript @types/react @types/react-dom vite @vitejs/plugin-react
```

## Step 2: Create the Backend

Create your Hono API server:

```typescript
// src/server/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors());

// Define a schema for todos
const todoSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
});

type Todo = z.infer<typeof todoSchema>;

// In-memory store (replace with real DB later)
const todos: Todo[] = [
  { id: '1', title: 'Learn Fearnstack', completed: false },
  { id: '2', title: 'Build something awesome', completed: false },
];

// GET /api/todos - List all todos
app.get('/api/todos', (c) => {
  return c.json(todos);
});

// POST /api/todos - Create a todo
const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
});

app.post('/api/todos', zValidator('json', createTodoSchema), (c) => {
  const { title } = c.req.valid('json');
  const newTodo: Todo = {
    id: crypto.randomUUID(),
    title,
    completed: false,
  };
  todos.push(newTodo);
  return c.json(newTodo, 201);
});

// PATCH /api/todos/:id - Toggle completion
app.patch('/api/todos/:id', (c) => {
  const id = c.req.param('id');
  const todo = todos.find((t) => t.id === id);
  if (!todo) {
    return c.json({ error: 'Not found' }, 404);
  }
  todo.completed = !todo.completed;
  return c.json(todo);
});

export default app;
export type AppType = typeof app;
```

Create the server entry point:

```typescript
// src/server/serve.ts
import app from './index';

const server = Bun.serve({
  port: 3001,
  fetch: app.fetch,
});

console.log(`Server running at http://localhost:${server.port}`);
```

## Step 3: Create the Frontend

Set up Vite configuration:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
});
```

Create the React app entry:

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Fearnstack Todo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client/main.tsx"></script>
  </body>
</html>
```

```typescript
// src/client/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

## Step 4: Connect Frontend to Backend

Create the main App component with TanStack Query:

```typescript
// src/client/App.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

const API_URL = 'http://localhost:3001';

// Types (shared with backend via Zod inference in real apps)
interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

// API functions
const fetchTodos = async (): Promise<Todo[]> => {
  const res = await fetch(`${API_URL}/api/todos`);
  return res.json();
};

const createTodo = async (title: string): Promise<Todo> => {
  const res = await fetch(`${API_URL}/api/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  return res.json();
};

const toggleTodo = async (id: string): Promise<Todo> => {
  const res = await fetch(`${API_URL}/api/todos/${id}`, {
    method: 'PATCH',
  });
  return res.json();
};

export default function App() {
  const [newTitle, setNewTitle] = useState('');
  const queryClient = useQueryClient();

  // Fetch todos
  const { data: todos, isLoading } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      setNewTitle('');
    },
  });

  // Toggle mutation
  const toggleMutation = useMutation({
    mutationFn: toggleTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      createMutation.mutate(newTitle);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', fontFamily: 'system-ui' }}>
      <h1>Fearnstack Todos</h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          style={{ padding: '0.5rem', width: '70%' }}
        />
        <button type="submit" style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}>
          Add
        </button>
      </form>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos?.map((todo) => (
          <li
            key={todo.id}
            onClick={() => toggleMutation.mutate(todo.id)}
            style={{
              padding: '0.5rem',
              cursor: 'pointer',
              textDecoration: todo.completed ? 'line-through' : 'none',
              opacity: todo.completed ? 0.6 : 1,
            }}
          >
            {todo.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Step 5: Run the Application

Add scripts to package.json:

```json
{
  "scripts": {
    "dev:server": "bun run src/server/serve.ts",
    "dev:client": "bunx vite",
    "dev": "bun run dev:server & bun run dev:client"
  }
}
```

Start both servers:

```bash
# Terminal 1: Start backend
bun run dev:server

# Terminal 2: Start frontend
bun run dev:client
```

Open http://localhost:3000 - you have a working full-stack app!

## What You Built

In 5 minutes, you created:

- **Hono backend** with REST endpoints and Zod validation
- **React frontend** with TanStack Query for data fetching
- **Type-safe API** with automatic cache invalidation
- **Optimistic UX** with loading states

## Next Steps

Now that you have the basics working:

1. **[Architecture](architecture.md)** - Understand the data flow
2. **[Hono RPC](../domains/backend/hono-rpc.md)** - Add end-to-end type safety
3. **[TanStack Form](../domains/frontend/tanstack-form.md)** - Better form handling
4. **[Zod Integration](../domains/validation/zod-integration.md)** - Share schemas

## Common Issues

**CORS errors?** Make sure you have `cors()` middleware in your Hono app.

**Port already in use?** Kill existing processes: `lsof -ti:3000 | xargs kill`

**TypeScript errors?** Ensure you have a `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```
