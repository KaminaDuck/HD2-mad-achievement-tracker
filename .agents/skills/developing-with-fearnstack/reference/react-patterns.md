---
title: React Patterns
description: React hooks, effects, and best practices for Fearnstack apps
---

# React Patterns

This guide covers when to use (and NOT use) React hooks and effects, consolidated from React's official guidance. Focus on patterns that work with TanStack libraries.

## When NOT to Use useEffect

Most of the time, you don't need `useEffect`. Here are common anti-patterns and their fixes.

### Deriving State from Props

```tsx
// ❌ Anti-pattern: Effect to sync state with props
function Form({ items }) {
  const [selection, setSelection] = useState(null);

  useEffect(() => {
    setSelection(null);
  }, [items]);
}

// ✅ Better: Derive during render
function Form({ items }) {
  const [selection, setSelection] = useState(null);
  const [prevItems, setPrevItems] = useState(items);

  if (items !== prevItems) {
    setPrevItems(items);
    setSelection(null);
  }
}

// ✅ Best: Lift state up or use key to reset
function Form({ items }) {
  // Selection lives in parent, or use <Form key={items.id} />
}
```

### Transforming Data

```tsx
// ❌ Anti-pattern: Effect to transform data
function UserList({ users }) {
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setFiltered(users.filter(u => u.name.includes(search)));
  }, [users, search]);
}

// ✅ Better: Compute during render
function UserList({ users }) {
  const [search, setSearch] = useState("");
  const filtered = users.filter(u => u.name.includes(search));
}

// ✅ Best: useMemo for expensive computations
function UserList({ users }) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(
    () => users.filter(u => u.name.includes(search)),
    [users, search]
  );
}
```

### Handling User Events

```tsx
// ❌ Anti-pattern: Effect for event handling
function Form() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted) {
      sendAnalytics("form_submitted");
      setSubmitted(false);
    }
  }, [submitted]);

  return <button onClick={() => setSubmitted(true)}>Submit</button>;
}

// ✅ Better: Handle in event handler
function Form() {
  const handleSubmit = () => {
    sendAnalytics("form_submitted");
  };

  return <button onClick={handleSubmit}>Submit</button>;
}
```

### Resetting State on Prop Change

```tsx
// ❌ Anti-pattern: Effect to reset state
function ProfilePage({ userId }) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    setComment("");
  }, [userId]);
}

// ✅ Better: Use key to reset component
function ProfilePage({ userId }) {
  return <CommentForm key={userId} />;
}
```

### Fetching Data

```tsx
// ❌ Anti-pattern: Effect for data fetching
function Profile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchUser(userId).then(data => {
      setUser(data);
      setLoading(false);
    });
  }, [userId]);
}

// ✅ Best: Use TanStack Query
function Profile({ userId }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => fetchUser(userId),
  });
}
```

## When to Use useEffect

Use `useEffect` only to synchronize with **external systems**.

### Subscribing to External Events

```tsx
function WindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    handleResize(); // Initial value
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <span>{size.width} x {size.height}</span>;
}
```

### Connecting to Third-Party Libraries

```tsx
function Map({ center, zoom }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const map = new MapLibrary(containerRef.current, { center, zoom });
    return () => map.destroy();
  }, []);

  // Update map when props change
  useEffect(() => {
    map.setCenter(center);
    map.setZoom(zoom);
  }, [center, zoom]);

  return <div ref={containerRef} />;
}
```

### Initializing Analytics

```tsx
function App() {
  useEffect(() => {
    analytics.init();
    return () => analytics.cleanup();
  }, []);
}
```

## React 19 Alternatives

React 19 provides new primitives that eliminate many useEffect use cases.

### Actions Instead of Effects

```tsx
// ❌ Old pattern: Effect + state for async operations
function UpdateProfile() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // cleanup, race conditions, etc.
  }, []);

  const handleSubmit = async (data) => {
    setIsPending(true);
    try {
      await updateProfile(data);
    } catch (e) {
      setError(e);
    }
    setIsPending(false);
  };
}

// ✅ React 19: useActionState
function UpdateProfile() {
  const [state, action, isPending] = useActionState(
    async (prevState, formData) => {
      const result = await updateProfile(formData);
      return result;
    },
    null
  );
}
```

### Optimistic Updates

```tsx
// ❌ Old pattern: Complex effect chains
function LikeButton({ liked, onLike }) {
  const [optimisticLiked, setOptimisticLiked] = useState(liked);

  useEffect(() => {
    setOptimisticLiked(liked);
  }, [liked]);

  const handleClick = async () => {
    setOptimisticLiked(!liked);
    try {
      await onLike();
    } catch {
      setOptimisticLiked(liked);
    }
  };
}

// ✅ React 19: useOptimistic
function LikeButton({ liked, onLike }) {
  const [optimisticLiked, addOptimistic] = useOptimistic(liked);

  return (
    <form action={async () => {
      addOptimistic(!liked);
      await onLike();
    }}>
      <button>{optimisticLiked ? "Unlike" : "Like"}</button>
    </form>
  );
}
```

### Form Handling

```tsx
// ❌ Old: Manual form state + effects
function SignupForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  // Multiple effects for form handling
}

// ✅ React 19: useFormStatus + useActionState
function SignupForm() {
  const [state, action] = useActionState(signup, null);

  return (
    <form action={action}>
      <input name="email" />
      <SubmitButton />
      {state?.error && <p>{state.error}</p>}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Sign Up</button>;
}
```

## Hook Best Practices

### Custom Hooks for Logic Reuse

```tsx
// Extract reusable logic into custom hooks
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
}

// Usage
function Search() {
  const [input, setInput] = useState("");
  const debouncedInput = useDebounce(input, 300);

  const { data } = useQuery({
    queryKey: ["search", debouncedInput],
    queryFn: () => search(debouncedInput),
    enabled: debouncedInput.length > 0,
  });
}
```

### Combining with TanStack Query

```tsx
// Custom hook for user data
function useUser(userId: string) {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: async () => {
      const res = await client.api.users[":id"].$get({ param: { id: userId } });
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId,
  });
}

// Usage - no effects needed
function Profile({ userId }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <Spinner />;
  if (error) return <Error message={error.message} />;
  return <UserCard user={user} />;
}
```

### Combining with TanStack Form

```tsx
// Form with validation - no effects
function ProfileForm({ initialData }) {
  const form = useForm({
    defaultValues: initialData,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: profileSchema,
    },
    onSubmit: async ({ value }) => {
      await updateProfile(value);
    },
  });

  // All state managed by form - no useEffect needed
}
```

## Effect Cleanup Patterns

When you do need effects, always clean up properly.

```tsx
// Subscription with cleanup
useEffect(() => {
  const subscription = eventEmitter.subscribe(handler);
  return () => subscription.unsubscribe();
}, []);

// Timer with cleanup
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);
}, []);

// AbortController for fetch
useEffect(() => {
  const controller = new AbortController();

  fetch(url, { signal: controller.signal })
    .then(handleResponse)
    .catch(handleError);

  return () => controller.abort();
}, [url]);
```

## Summary

| Situation | Don't Use Effect | Use Instead |
|-----------|------------------|-------------|
| Transform data | useEffect + setState | Compute during render / useMemo |
| Handle events | useEffect trigger | Event handler |
| Fetch data | useEffect + loading state | TanStack Query |
| Form state | useEffect sync | TanStack Form |
| Reset on prop change | useEffect + setState | Key prop |
| Async operations | useEffect + isPending | useActionState (React 19) |
| Optimistic UI | useEffect chain | useOptimistic (React 19) |

## Related Docs

- [React 19](../domains/frontend/react-19.md) - New hooks and patterns
- [TanStack Query](../domains/frontend/tanstack-query.md) - Data fetching
- [TanStack Form](../domains/frontend/tanstack-form.md) - Form state
