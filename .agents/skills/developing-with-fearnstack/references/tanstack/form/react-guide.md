---
author: unknown
category: typescript
contributors: []
description: Complete guide to using TanStack Form with React
last_updated: '2025-11-01'
related:
- overview.md
sources:
- name: React Quick Start
  url: https://tanstack.com/form/latest/docs/framework/react/quick-start
- name: Basic Concepts
  url: https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts
- name: Validation Guide
  url: https://tanstack.com/form/latest/docs/framework/react/guides/validation
- name: Array Fields Guide
  url: https://tanstack.com/form/latest/docs/framework/react/guides/arrays
- name: Linked Fields Guide
  url: https://tanstack.com/form/latest/docs/framework/react/guides/linked-fields
- name: SSR Guide
  url: https://tanstack.com/form/latest/docs/framework/react/guides/ssr
- name: Async Initial Values
  url: https://tanstack.com/form/latest/docs/framework/react/guides/async-initial-values
- name: Debugging Guide
  url: https://tanstack.com/form/latest/docs/framework/react/guides/debugging
status: stable
subcategory: forms
tags:
- tanstack
- react
- forms
- validation
- hooks
- typescript
- state-management
title: TanStack Form React Guide
type: framework-guide
version: 0.1.8
---

# TanStack Form React Guide

Comprehensive guide for using TanStack Form with React, emphasizing type safety, performance and composition for an unmatched developer experience. ([React Quick Start][1])

## Installation

```bash
npm install @tanstack/react-form
```

([React Quick Start][1])

## Implementation Approaches

TanStack Form offers two implementation patterns. ([React Quick Start][1])

### Recommended: Using `createFormHook`

This pattern reduces boilerplate across your application: ([React Quick Start][1])

```tsx
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'
import { z } from 'zod'

const { fieldContext, formContext } = createFormHookContexts()

const { useAppForm } = createFormHook({
  fieldComponents: { TextField, NumberField },
  formComponents: { SubmitButton },
  fieldContext,
  formContext,
})

const form = useAppForm({
  defaultValues: { username: '', age: 0 },
  validators: { onChange: z.object({...}) },
  onSubmit: ({ value }) => {...}
})
```

**Benefits:**
- Bind components once, reuse throughout applications
- Centralized configuration
- Better type inference
- Reduced boilerplate

### Alternative: Direct Hook Usage

For one-off components, use `useForm` and `form.Field` directly: ([React Quick Start][1])

```tsx
import { useForm } from '@tanstack/react-form'

const form = useForm({
  defaultValues: { username: '', age: 0 },
  onSubmit: ({ value }) => alert(JSON.stringify(value))
})

<form.Field name="age" validators={{...}}>
  {(field) => (
    <input
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.valueAsNumber)}
    />
  )}
</form.Field>
```

## Form State Management

TanStack Form uses a Form Instance pattern created via the `useForm` hook. This instance provides methods and properties for managing form state. ([Basic Concepts][2])

### Form Options

Share configuration across multiple forms using `formOptions`, which accepts default values and other shared settings. ([Basic Concepts][2])

### Form State

The form tracks both base state (values, submission status) and derived state (whether submission is allowed, validation status). ([Basic Concepts][2])

## Field Creation

Fields are created using `form.Field` component with a render prop pattern. ([Basic Concepts][2])

```tsx
<form.Field name="email">
  {(field) => (
    <div>
      <label htmlFor={field.name}>Email:</label>
      <input
        id={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
      />
      {field.state.meta.errors && (
        <em>{field.state.meta.errors.join(', ')}</em>
      )}
    </div>
  )}
</form.Field>
```

### Field State

Each field maintains its own state including: ([Basic Concepts][2])

- **Current value**
- **Validation errors and status**
- **Metadata flags:**
  - `isTouched` - Field has received focus
  - `isDirty` - Value differs from default
  - `isPristine` - Value matches default
  - `isBlurred` - Field has lost focus
  - `isDefaultValue` - Value is exactly the default

**Important:** A field remains 'dirty' once changed, even if reverted to the default value in TanStack's persistent dirty state model. ([Basic Concepts][2])

### Type Safety

All field names enforce TypeScript checking. ([React Quick Start][1])

```tsx
// TypeScript error if 'unknownField' doesn't exist
<form.Field name="unknownField">
```

## Validation

TanStack Form provides highly customizable validation with three key capabilities: ([Validation Guide][3])

- **Timing control:** Choose when validation runs (onChange, onBlur, onSubmit)
- **Scope flexibility:** Define rules at field or form level
- **Execution types:** Support both synchronous and asynchronous validation

### Validation Timing

Developers control validation execution through callbacks on the `<Field />` component. When validation finds errors, the message becomes available in `field.state.meta.errors`. ([Validation Guide][3])

```tsx
<form.Field
  name="email"
  validators={{
    onChange: ({ value }) => {
      if (!value.includes('@')) return 'Invalid email'
    },
    onBlur: ({ value }) => {
      if (!value) return 'Email required'
    }
  }}
>
  {(field) => <input {...field} />}
</form.Field>
```

The framework allows different validation rules at different trigger points on the same field. ([Validation Guide][3])

### Error Access

Errors can be accessed two ways: ([Validation Guide][3])

1. **Array format:** `field.state.meta.errors` returns all active errors
2. **Map format:** `field.state.meta.errorMap` provides errors keyed by trigger type (onChange, onBlur, etc.)

The error structure matches validator return types, enabling type-safe error handling.

### Form-Level Validation

While each `<Field>` has its own validators, the `useForm()` hook accepts similar validation callbacks at the form level. This enables centralized validation logic that can set field-specific errors, particularly useful for server-side validation after submission. ([Validation Guide][3])

### Asynchronous Validation

Dedicated async methods (`onChangeAsync`, `onBlurAsync`, etc.) handle network requests. Synchronous validation runs first by default; async runs only if sync succeeds unless `asyncAlways: true` is set. ([Validation Guide][3])

**Built-in debouncing** prevents excessive API calls: running a network request on every keystroke is a good way to DDOS your database. ([Validation Guide][3])

```tsx
<form.Field
  name="username"
  validators={{
    onChangeAsync: async ({ value }) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      return value.includes('error') ? 'Username taken' : undefined
    },
    onChangeAsyncDebounceMs: 500
  }}
>
  {(field) => <input {...field} />}
</form.Field>
```

### Schema-Based Validation

TanStack Form supports Standard Schema specification libraries including Zod, Valibot, ArkType, and Effect/Schema, allowing schemas to be passed directly as validators with automatic error propagation. ([Validation Guide][3], [React Quick Start][1])

```tsx
import { z } from 'zod'

const form = useForm({
  validators: {
    onChange: z.object({
      username: z.string().min(3),
      age: z.number().min(18)
    })
  }
})
```

### Submission Prevention

The `canSubmit` flag prevents invalid form submission, remaining true until the form is touched and contains validation errors. ([Validation Guide][3])

## Array Fields

TanStack Form supports arrays as form values, including nested objects within arrays. ([Array Fields Guide][4])

### Basic Array Implementation

Use `field.state.value` on array values with `mode="array"`: ([Array Fields Guide][4])

```tsx
<form.Field name="people" mode="array">
  {(field) => (
    <div>
      {field.state.value.map((_, i) => (
        <div key={i}>
          {/* render array items */}
        </div>
      ))}
    </div>
  )}
</form.Field>
```

### Array Operations

**Adding Items:**
The `pushValue()` method adds new array entries: ([Array Fields Guide][4])

```tsx
<button
  onClick={() => field.pushValue({ name: '', age: 0 })}
  type="button"
>
  Add person
</button>
```

### Nested Field Access

Access individual array item properties using bracket notation in field names: ([Array Fields Guide][4])

```tsx
<form.Field key={i} name={`people[${i}].name`}>
  {(subField) => (
    <input
      value={subField.state.value}
      onChange={(e) => subField.handleChange(e.target.value)}
    />
  )}
</form.Field>
```

This approach allows mapping over arrays while maintaining proper form state synchronization for each nested field within array items. ([Array Fields Guide][4])

## Linked Fields

When you need to coordinate validation between multiple form fields, TanStack Form provides a mechanism to trigger re-validation of dependent fields. ([Linked Fields Guide][5])

### Using `onChangeListenTo`

The framework allows you to specify which fields should trigger validation updates on a particular field. ([Linked Fields Guide][5])

This property accepts an array of field names that, when changed, will cause the current field's validators to re-run.

**Example: Password Confirmation:**

```tsx
<form.Field
  name="confirmPassword"
  validators={{
    onChangeListenTo: ['password'],
    onChange: ({ value, fieldApi }) => {
      if (value !== fieldApi.form.getFieldValue('password')) {
        return 'Passwords do not match'
      }
    }
  }}
>
  {(field) => <input type="password" {...field} />}
</form.Field>
```

([Linked Fields Guide][5])

The framework also supports `onBlurListenTo` for coordinating validation when fields lose focus. ([Linked Fields Guide][5])

## Reactive Updates

Two primary patterns for subscribing to state changes: ([Basic Concepts][2])

### 1. `useStore` Hook

Subscribe to specific form state slices:

```tsx
import { useStore } from '@tanstack/react-store'

const canSubmit = useStore(form.store, (state) => state.canSubmit)
```

The documentation emphasizes: it is strongly recommended to provide one (a selector), as omitting it will result in unnecessary re-renders. ([Basic Concepts][2])

### 2. `form.Subscribe` Component

Render prop component for reactive UI updates:

```tsx
<form.Subscribe selector={(state) => state.canSubmit}>
  {(canSubmit) => (
    <button type="submit" disabled={!canSubmit}>
      Submit
    </button>
  )}
</form.Subscribe>
```

([Basic Concepts][2])

## Form Submission

Forms accept an `onSubmit` handler that receives the entire form value. This enables centralized submission logic with access to complete form state. ([Basic Concepts][2])

```tsx
const form = useForm({
  defaultValues: { username: '', email: '' },
  onSubmit: async ({ value }) => {
    // Submit to API
    await fetch('/api/users', {
      method: 'POST',
      body: JSON.stringify(value)
    })
  }
})
```

## Server-Side Rendering

TanStack Form supports SSR through three primary meta-frameworks: ([SSR Guide][6])

- TanStack Start
- Next.js App Router
- Remix

### Hydration Pattern

The documentation emphasizes a shared form configuration approach: formOptions that we'll use to share the form's shape across the client and server. ([SSR Guide][6])

This involves:

1. **Shared Configuration:** Define `formOptions` once to ensure type consistency between server and client environments
2. **Server Validation:** Create server-side validators using framework-specific utilities (`createServerValidate`)
3. **State Merging:** Use `mergeForm()` and `useTransform()` hooks to combine server-returned state with client form state

([SSR Guide][6])

### Framework-Specific Patterns

**Next.js:** Uses `useActionState` hook with React Server Actions, importing from `@tanstack/react-form/nextjs` for server code and standard imports for client components. ([SSR Guide][6])

**Remix:** Leverages `useActionData` hook with route actions, following similar import patterns. ([SSR Guide][6])

**TanStack Start:** Implements server functions with `getFormData()` to retrieve state in route loaders. ([SSR Guide][6])

### Critical Best Practice

The documentation warns about import paths: Notice the import path is different from the client. ([SSR Guide][6]) Incorrect imports cause hydration errors. Server-side code must import framework-specific modules while client components use base `@tanstack/react-form`.

## Async Initial Values

The documentation recommends integrating TanStack Form with TanStack Query to handle asynchronous initial values effectively. ([Async Initial Values][7])

Rather than implementing data fetching from scratch, the guide recommends combining two complementary libraries: While we could implement many of these features from scratch, it would end up looking a lot like another project we maintain: TanStack Query. ([Async Initial Values][7])

### Implementation Pattern

```tsx
import { useQuery } from '@tanstack/react-query'

const { data, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId)
})

if (isLoading) return <p>Loading..</p>

const form = useForm({
  defaultValues: data,
  onSubmit: async ({ value }) => {...}
})
```

([Async Initial Values][7])

This pattern addresses: ([Async Initial Values][7])
- Showing loading spinners during API requests
- Graceful error handling
- Automatic data caching so fetches don't repeat unnecessarily

## Debugging

### Common Issues

#### 1. Uncontrolled Input Warnings

The most common error occurs when form values change from `undefined` to defined. The solution is straightforward: It's likely you forgot the `defaultValues` in your useForm Hook or form.Field component usage. ([Debugging Guide][8])

This happens because inputs render before initialization, causing React to flag the transition from uncontrolled to controlled.

#### 2. Type Inference Issues

When `field.state.value` shows type `unknown`, your form's type definition is too complex for safe evaluation. Solutions include: ([Debugging Guide][8])

- Breaking forms into smaller, focused pieces
- Using more specific type definitions
- Casting values explicitly: `field.state.value as string`

#### 3. TypeScript Compilation Errors

If you encounter "Type instantiation is excessively deep and possibly infinite" during `tsc` compilation, you've hit an edge case in the type system. The workaround: your code will still execute correctly at runtime—it's purely a TypeScript issue. ([Debugging Guide][8])

**Response approach:** Report the issue on GitHub with a minimal reproduction case.

### Best Practice

Always ensure `defaultValues` is provided when initializing forms to prevent controlled/uncontrolled component warnings. ([Debugging Guide][8])

## Best Practices

1. **Use `createFormHook` for application-wide forms** - Reduces boilerplate and centralizes configuration
2. **Always provide `defaultValues`** - Prevents uncontrolled component warnings
3. **Use selectors with `useStore`** - Prevents unnecessary re-renders
4. **Leverage schema validation** - Zod, Valibot, or ArkType for complex validation logic
5. **Debounce async validation** - Prevent API abuse with built-in debouncing
6. **Use linked fields for dependent validation** - `onChangeListenTo` for password confirmation patterns
7. **Integrate with TanStack Query for async data** - Leverage established patterns for data fetching
8. **Follow SSR import patterns** - Use framework-specific imports for server code
9. **Break down complex forms** - Improves type inference and maintainability
10. **Use `form.Subscribe` for reactive UI** - Better than manual state subscriptions

## Links

**Official Documentation:**
- [React Quick Start](https://tanstack.com/form/latest/docs/framework/react/quick-start)
- [Basic Concepts](https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts)
- [Validation Guide](https://tanstack.com/form/latest/docs/framework/react/guides/validation)
- [Array Fields](https://tanstack.com/form/latest/docs/framework/react/guides/arrays)
- [Linked Fields](https://tanstack.com/form/latest/docs/framework/react/guides/linked-fields)
- [SSR Guide](https://tanstack.com/form/latest/docs/framework/react/guides/ssr)
- [Async Initial Values](https://tanstack.com/form/latest/docs/framework/react/guides/async-initial-values)
- [Debugging](https://tanstack.com/form/latest/docs/framework/react/guides/debugging)

[1]: https://tanstack.com/form/latest/docs/framework/react/quick-start "React Quick Start"
[2]: https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts "Basic Concepts"
[3]: https://tanstack.com/form/latest/docs/framework/react/guides/validation "Validation Guide"
[4]: https://tanstack.com/form/latest/docs/framework/react/guides/arrays "Array Fields Guide"
[5]: https://tanstack.com/form/latest/docs/framework/react/guides/linked-fields "Linked Fields Guide"
[6]: https://tanstack.com/form/latest/docs/framework/react/guides/ssr "SSR Guide"
[7]: https://tanstack.com/form/latest/docs/framework/react/guides/async-initial-values "Async Initial Values"
[8]: https://tanstack.com/form/latest/docs/framework/react/guides/debugging "Debugging Guide"