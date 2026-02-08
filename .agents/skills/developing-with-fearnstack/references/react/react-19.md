---
title: "React 19 Framework Guide"
description: "React 19 features, new hooks, Actions, Server Components, and migration guide"
type: "framework-guide"
tags: ["react", "frontend", "hooks", "server-components", "actions", "typescript", "javascript", "web"]
category: "frontend"
subcategory: "react"
version: "19.0"
last_updated: "2025-11-01"
status: "stable"
sources:
  - name: "React v19 Release Blog"
    url: "https://react.dev/blog/2024/12/05/react-19"
  - name: "React 19 What's New"
    url: "https://react.dev/blog/2024/12/05/react-19#whats-new-in-react-19"
  - name: "React Hooks Reference"
    url: "https://react.dev/reference/react/hooks"
related: []
author: "unknown"
contributors: []
---

# React 19 Framework Guide

React 19 is a stable release that became available on December 5, 2024, introducing Actions, new hooks, Server Components, improved error handling, and significant developer experience improvements. ([React v19 Release Blog][1])

## Release Overview

React 19 builds on features initially shared in the React 19 RC announcement from April 2024. ([React v19 Release Blog][1]) This release focuses on simplifying data mutations, improving form handling, enhancing server-side rendering capabilities, and providing better developer tooling.

## Actions

Actions are a major new feature that simplify handling data mutations by automatically managing pending states, errors, optimistic updates, and form resets. ([React 19 What's New][2])

### Key Benefits

- **Automatic state management**: Rather than managing pending states manually with `useState`, functions can now use async transitions to automatically manage submission states. ([React 19 What's New][2])
- **Error handling**: Errors are automatically tracked and made available
- **Optimistic updates**: Immediate UI feedback during async operations
- **Form integration**: Native support for passing functions to form `action` and `formAction` props ([React 19 What's New][2])

### Form Actions

Forms now accept functions via `action` and `formAction` props, automatically resetting after successful submission. ([React 19 What's New][2])

```jsx
function UpdateNameForm() {
  async function submitAction(formData) {
    const name = formData.get("name");
    await updateName(name);
  }

  return (
    <form action={submitAction}>
      <input type="text" name="name" />
      <button type="submit">Update</button>
    </form>
  );
}
```

## New Hooks

### useActionState

`useActionState` replaces the deprecated `useFormState` and simplifies action handling by wrapping async functions and returning pending state alongside results. ([React 19 What's New][2])

```jsx
import { useActionState } from "react";

function UpdateName() {
  const [state, submitAction, isPending] = useActionState(
    async (previousState, formData) => {
      const name = formData.get("name");
      const error = await updateName(name);
      if (error) {
        return { error };
      }
      return { success: true };
    },
    { error: null }
  );

  return (
    <form action={submitAction}>
      <input type="text" name="name" />
      <button type="submit" disabled={isPending}>
        Update
      </button>
      {state.error && <p>{state.error}</p>}
    </form>
  );
}
```

### useOptimistic

`useOptimistic` enables immediate UI feedback during async operations. The hook immediately renders the optimistic state while the async request is in progress. ([React 19 What's New][2]) React automatically reverts to the original state if the operation fails. ([React v19 Release Blog][1])

```jsx
import { useOptimistic } from "react";

function ChangeName({ currentName, onUpdateName }) {
  const [optimisticName, setOptimisticName] = useOptimistic(currentName);

  const submitAction = async (formData) => {
    const newName = formData.get("name");
    setOptimisticName(newName);
    const updatedName = await onUpdateName(newName);
    // If failed, React reverts to currentName automatically
  };

  return (
    <form action={submitAction}>
      <p>Your name: {optimisticName}</p>
      <input type="text" name="name" />
      <button type="submit">Change Name</button>
    </form>
  );
}
```

### useFormStatus

`useFormStatus` allows design system components to access parent form status without prop drilling. ([React 19 What's New][2]) This hook functions similarly to context providers, enabling components to read the status of their containing form. ([React v19 Release Blog][1])

```jsx
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit"}
    </button>
  );
}

function Form() {
  async function submitForm(formData) {
    await saveData(formData);
  }

  return (
    <form action={submitForm}>
      <input name="field" />
      <SubmitButton />
    </form>
  );
}
```

### use API

The `use` API allows reading promises and context within render conditionally—a capability previously impossible with hooks due to early returns. ([React 19 What's New][2]) Unlike traditional hooks, `use()` supports conditional calling. ([React v19 Release Blog][1])

```jsx
import { use } from "react";

function UserProfile({ userPromise }) {
  const user = use(userPromise);

  return <div>{user.name}</div>;
}

// Conditional usage
function ConditionalData({ shouldFetch, dataPromise }) {
  let data = null;

  if (shouldFetch) {
    data = use(dataPromise);
  }

  return <div>{data ? data.value : "No data"}</div>;
}
```

**Important**: The `use` API cannot handle promises created within render itself. ([React v19 Release Blog][1])

## Document Metadata Management

React 19 natively supports rendering metadata tags (`<title>`, `<meta>`, `<link>`) within components; they automatically hoist to the document head. ([React 19 What's New][2]) This eliminates manual insertion or library dependencies for basic metadata needs. ([React 19 What's New][2])

```jsx
function BlogPost({ post }) {
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

## Asset and Resource Management

### Stylesheet Support

Components can declare stylesheets with `precedence` levels, ensuring proper load ordering and preventing style-dependent content from rendering prematurely. ([React 19 What's New][2])

```jsx
function ComponentWithStyles() {
  return (
    <>
      <link
        rel="stylesheet"
        href="/styles/component.css"
        precedence="high"
      />
      <div className="styled-component">Content</div>
    </>
  );
}
```

### Async Script Support

Scripts can be rendered anywhere in the tree with automatic deduplication. ([React 19 What's New][2])

```jsx
function Analytics() {
  return (
    <script
      async
      src="https://analytics.example.com/script.js"
    />
  );
}
```

### Resource Preloading APIs

React 19 introduces functions like `preload()`, `preinit()`, `preconnect()`, and `prefetchDNS()` to optimize initial and subsequent page loads. ([React 19 What's New][2])

```jsx
import { preload, preinit, preconnect, prefetchDNS } from "react-dom";

function AppSetup() {
  // Preload critical resources
  preload("/fonts/main.woff2", { as: "font", type: "font/woff2" });

  // Initialize critical scripts
  preinit("/scripts/analytics.js", { as: "script" });

  // Establish early connections
  preconnect("https://api.example.com");

  // DNS prefetch for third-party domains
  prefetchDNS("https://cdn.example.com");

  return <App />;
}
```

## Developer Experience Improvements

### ref as Prop

Function components now accept refs directly, deprecating the need for `forwardRef`. ([React 19 What's New][2])

```jsx
// React 19 - refs as props
function Input({ ref, ...props }) {
  return <input ref={ref} {...props} />;
}

// Usage
function Form() {
  const inputRef = useRef(null);

  return <Input ref={inputRef} />;
}
```

### Ref Cleanup Functions

Refs can return cleanup functions for teardown logic. ([React 19 What's New][2])

```jsx
function VideoPlayer() {
  return (
    <video
      ref={(element) => {
        if (element) {
          // Setup
          const player = initializePlayer(element);

          // Cleanup function
          return () => {
            player.destroy();
          };
        }
      }}
    />
  );
}
```

### Context Simplification

`<Context>` can render directly instead of `<Context.Provider>`. ([React 19 What's New][2])

```jsx
import { createContext } from "react";

const ThemeContext = createContext("light");

// React 19 - simplified
function App() {
  return (
    <ThemeContext value="dark">
      <Main />
    </ThemeContext>
  );
}

// Previously required
function AppOld() {
  return (
    <ThemeContext.Provider value="dark">
      <Main />
    </ThemeContext.Provider>
  );
}
```

### Improved Hydration Error Messages

Single, detailed error messages replace multiple cryptic warnings with helpful diffs. ([React 19 What's New][2])

React 19 provides significantly improved error messages with diffs showing mismatches between server and client HTML. ([React v19 Release Blog][1])

## Server-Side Features

### React Server Components

Server Components enable pre-rendering before bundling, supporting build-time or per-request execution. ([React v19 Release Blog][1]) These components allow rendering ahead of bundling in separate environments. ([React v19 Release Blog][1])

```jsx
// app/page.jsx - Server Component
async function UserPage({ userId }) {
  // This runs on the server
  const user = await fetchUser(userId);

  return (
    <div>
      <h1>{user.name}</h1>
      <ClientComponent data={user} />
    </div>
  );
}
```

### Server Actions

Server Actions allow client components to call server-side async functions using the `"use server"` directive. ([React 19 What's New][2])

```jsx
// actions.js
"use server";

export async function updateUser(userId, formData) {
  const name = formData.get("name");
  await db.users.update(userId, { name });
  revalidatePath(`/users/${userId}`);
}

// ClientComponent.jsx
"use client";

import { updateUser } from "./actions";

function UserForm({ userId }) {
  return (
    <form action={updateUser.bind(null, userId)}>
      <input name="name" />
      <button type="submit">Update</button>
    </form>
  );
}
```

## React DOM Static APIs

Two new APIs for static site generation: ([React v19 Release Blog][1])

- **`prerender()`** - Waits for all data before returning static HTML
- **`prerenderToNodeStream()`** - Stream-compatible version

These improve upon `renderToString` for SSG scenarios. ([React v19 Release Blog][1])

```jsx
import { prerender } from "react-dom/static";

async function generateStaticPage() {
  const { prelude } = await prerender(<App />);
  return prelude;
}
```

## Error Handling

Consolidated error reporting with new root options for granular error management: ([React 19 What's New][2])

- **`onCaughtError`** - Errors caught by Error Boundaries
- **`onUncaughtError`** - Errors not caught by Error Boundaries
- **`onRecoverableError`** - Errors React recovers from automatically

```jsx
import { createRoot } from "react-dom/client";

const root = createRoot(document.getElementById("root"), {
  onCaughtError: (error, errorInfo) => {
    console.error("Caught error:", error, errorInfo);
    logToErrorService(error, errorInfo);
  },
  onUncaughtError: (error, errorInfo) => {
    console.error("Uncaught error:", error, errorInfo);
    logToErrorService(error, errorInfo);
  },
  onRecoverableError: (error, errorInfo) => {
    console.warn("Recoverable error:", error, errorInfo);
  },
});

root.render(<App />);
```

## Web Components Support

Full Web Components support with proper property/attribute handling across SSR and client-side rendering. ([React 19 What's New][2]) React 19 passes all Custom Elements Everywhere tests. ([React v19 Release Blog][1])

```jsx
function CustomElementWrapper() {
  return (
    <my-custom-element
      stringProp="value"
      booleanProp={true}
      objectProp={{ key: "value" }}
    />
  );
}
```

## Deprecations and Migration

### Deprecated Features

- **`forwardRef`** will be deprecated in favor of ref as a prop ([React v19 Release Blog][1])
- **`<Context.Provider>`** will be deprecated in favor of `<Context>` ([React v19 Release Blog][1])
- **Calling refs with `null`** during unmounting will be deprecated ([React v19 Release Blog][1])

### Migration Support

The React team provides codemods to assist with automatic updates to leverage new patterns. ([React v19 Release Blog][1])

### Breaking Changes

While React 19 maintains backward compatibility for most features, developers should:

1. Review usage of deprecated APIs
2. Update TypeScript types if using custom ref forwarding
3. Test hydration behavior with improved error messages
4. Validate form submissions using new Actions patterns

## Best Practices

### Actions and Forms

1. **Use Actions for data mutations**: Leverage automatic pending state management
2. **Combine with useOptimistic**: Provide instant feedback for better UX
3. **Implement error boundaries**: Catch and handle action errors gracefully
4. **Use useFormStatus**: Avoid prop drilling for form state

### Server Components

1. **Fetch data in Server Components**: Reduce client bundle size and improve initial load
2. **Keep client components small**: Move interactive parts to Client Components
3. **Use Server Actions carefully**: Ensure proper authentication and validation
4. **Leverage streaming**: Use `prerenderToNodeStream()` for better performance

### Resource Management

1. **Set stylesheet precedence**: Ensure critical styles load first
2. **Preload critical resources**: Use `preload()` for fonts and key assets
3. **Establish early connections**: Use `preconnect()` for API domains
4. **Deduplicate scripts**: Let React handle script deduplication automatically

### Performance

1. **Use the `use` hook conditionally**: Avoid unnecessary data fetching
2. **Implement proper error boundaries**: Prevent entire app crashes
3. **Monitor hydration errors**: Use improved error messages to fix mismatches
4. **Optimize bundle size**: Leverage Server Components for static content

## Upgrade Considerations

### From React 18

1. **Update dependencies**: Ensure all React packages are v19
2. **Review TypeScript types**: Update type definitions for new APIs
3. **Test form interactions**: Verify form handling with new Actions
4. **Update error handling**: Migrate to new error callback options
5. **Remove forwardRef**: Replace with direct ref props where possible
6. **Update Context usage**: Consider simplifying to direct Context rendering

### TypeScript Support

React 19 includes updated TypeScript definitions for all new features. Ensure your `@types/react` package is updated to version 19.

```bash
npm install react@19 react-dom@19
npm install -D @types/react@19 @types/react-dom@19
```

## References

[1]: https://react.dev/blog/2024/12/05/react-19 "React v19 Release Blog"
[2]: https://react.dev/blog/2024/12/05/react-19#whats-new-in-react-19 "React 19 What's New"
[3]: https://react.dev/reference/react/hooks "React Hooks Reference"
