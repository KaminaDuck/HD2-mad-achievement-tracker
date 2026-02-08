---
title: "You Might Not Need an Effect"
description: "React patterns for avoiding unnecessary useEffect usage"
type: "pattern-reference"
tags: ["react", "hooks", "useEffect", "patterns", "performance", "best-practices", "frontend"]
category: "frontend"
subcategory: "react"
version: "1.0"
last_updated: "2025-12-06"
status: "stable"
sources:
  - name: "You Might Not Need an Effect"
    url: "https://react.dev/learn/you-might-not-need-an-effect"
related: ["react-19.md", "react-compiler.md"]
author: "unknown"
contributors: []
---

# You Might Not Need an Effect

Effects are an escape hatch from the React paradigm for synchronizing with external systems outside of React, such as non-React widgets, network requests, or browser APIs. ([You Might Not Need an Effect][1])

**Core Principle**: If there's no external system involved (e.g., you want to update a component's state when props or state change), you shouldn't need an Effect. Removing unnecessary Effects makes code easier to follow, faster to run, and less error-prone. ([You Might Not Need an Effect][1])

## Quick Decision Tree

```
Should this code run?
├─ Because component was displayed? → Effect
├─ Because user performed action? → Event handler
└─ Can it be calculated during render? → Calculate during rendering
```

---

## When NOT to Use Effects

### 1. Transforming Data for Rendering

When something can be calculated from existing props or state, don't put it in state. Calculate it during rendering instead. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function Form() {
  const [firstName, setFirstName] = useState('Taylor');
  const [lastName, setLastName] = useState('Swift');
  const [fullName, setFullName] = useState('');

  // 🔴 Avoid: redundant state and unnecessary Effect
  useEffect(() => {
    setFullName(firstName + ' ' + lastName);
  }, [firstName, lastName]);
}
```

**Right Way:**
```jsx
function Form() {
  const [firstName, setFirstName] = useState('Taylor');
  const [lastName, setLastName] = useState('Swift');

  // ✅ Good: calculated during rendering
  const fullName = firstName + ' ' + lastName;
}
```

**Key Principle**: Derived state should be calculated during render, not stored and synchronized via Effects.

---

### 2. Caching Expensive Calculations

Use `useMemo` instead of Effects for expensive computations that only need to recalculate when specific dependencies change. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function TodoList({ todos, filter }) {
  const [newTodo, setNewTodo] = useState('');
  const [visibleTodos, setVisibleTodos] = useState([]);

  // 🔴 Avoid: redundant state and unnecessary Effect
  useEffect(() => {
    setVisibleTodos(getFilteredTodos(todos, filter));
  }, [todos, filter]);
}
```

**Right Way (Simple Case):**
```jsx
function TodoList({ todos, filter }) {
  const [newTodo, setNewTodo] = useState('');

  // ✅ This is fine if getFilteredTodos() is not slow
  const visibleTodos = getFilteredTodos(todos, filter);
}
```

**Right Way (Expensive Computation):**
```jsx
import { useMemo, useState } from 'react';

function TodoList({ todos, filter }) {
  const [newTodo, setNewTodo] = useState('');

  // ✅ Does not re-run unless todos or filter change
  const visibleTodos = useMemo(
    () => getFilteredTodos(todos, filter),
    [todos, filter]
  );
}
```

**Note**: React Compiler can automatically memoize expensive calculations, eliminating the need for manual `useMemo` in many cases. See [React Compiler](react-compiler.md). ([You Might Not Need an Effect][1])

---

### 3. Handling User Events

Event-specific logic belongs in event handlers, not Effects. Ask yourself *why* the code needs to run—if it's because of a user interaction, use an event handler. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function ProductPage({ product, addToCart }) {
  // 🔴 Avoid: Event-specific logic inside an Effect
  useEffect(() => {
    if (product.isInCart) {
      showNotification(`Added ${product.name} to the shopping cart!`);
    }
  }, [product]);

  function handleBuyClick() {
    addToCart(product);
  }
}
```

**Issue**: If the app "remembers" the cart between page reloads, the notification fires again on refresh because `product.isInCart` is already true.

**Right Way:**
```jsx
function ProductPage({ product, addToCart }) {
  // ✅ Good: Event-specific logic is called from event handlers
  function buyProduct() {
    addToCart(product);
    showNotification(`Added ${product.name} to the shopping cart!`);
  }

  function handleBuyClick() {
    buyProduct();
  }

  function handleCheckoutClick() {
    buyProduct();
    navigateTo('/checkout');
  }
}
```

---

### 4. Resetting All State When a Prop Changes

Use the `key` prop to reset entire component state instead of Effects. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
export default function ProfilePage({ userId }) {
  const [comment, setComment] = useState('');

  // 🔴 Avoid: Resetting state on prop change in an Effect
  useEffect(() => {
    setComment('');
  }, [userId]);
}
```

**Issue**: Renders stale values first, then re-renders with reset state.

**Right Way:**
```jsx
export default function ProfilePage({ userId }) {
  return (
    <Profile
      userId={userId}
      key={userId}  // ✅ Pass userId as key
    />
  );
}

function Profile({ userId }) {
  // ✅ This and any other state will reset on key change automatically
  const [comment, setComment] = useState('');
}
```

**Key Principle**: Using a `key` prop tells React to treat components with different keys as conceptually different components, resetting all state.

---

### 5. Adjusting Part of State on Prop Change

Store IDs or primitive values instead of objects, and derive the full object during render. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function List({ items }) {
  const [isReverse, setIsReverse] = useState(false);
  const [selection, setSelection] = useState(null);

  // 🔴 Avoid: Adjusting state on prop change in an Effect
  useEffect(() => {
    setSelection(null);
  }, [items]);
}
```

**Better Way (Direct Adjustment During Render):**
```jsx
function List({ items }) {
  const [isReverse, setIsReverse] = useState(false);
  const [selection, setSelection] = useState(null);
  const [prevItems, setPrevItems] = useState(items);

  // Better: Adjust the state while rendering
  if (items !== prevItems) {
    setPrevItems(items);
    setSelection(null);
  }
}
```

**Best Way (Recalculate Instead):**
```jsx
function List({ items }) {
  const [isReverse, setIsReverse] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // ✅ Best: Calculate everything during rendering
  const selection = items.find(item => item.id === selectedId) ?? null;
}
```

**Key Principle**: Store the selected *ID* instead of the object. If the ID isn't in the list, selection will be null automatically.

---

### 6. Notifying Parent Components About State Changes

Update parent state and notify in the same event handler, or lift state up entirely. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false);

  // 🔴 Avoid: The onChange handler runs too late
  useEffect(() => {
    onChange(isOn);
  }, [isOn, onChange]);

  function handleClick() {
    setIsOn(!isOn);
  }
}
```

**Right Way (Shared Logic):**
```jsx
function Toggle({ onChange }) {
  const [isOn, setIsOn] = useState(false);

  // ✅ Good: Update state and notify in the same pass
  function updateToggle(nextIsOn) {
    setIsOn(nextIsOn);
    onChange(nextIsOn);
  }

  function handleClick() {
    updateToggle(!isOn);
  }
}
```

**Better Way (Controlled Component):**
```jsx
// ✅ Also good: the component is fully controlled by its parent
function Toggle({ isOn, onChange }) {
  function handleClick() {
    onChange(!isOn);
  }
}
```

**Key Principle**: Lift state up to the parent and use unidirectional data flow.

---

### 7. Chains of Computations

Effect chains that trigger other state updates cause excessive re-renders. Calculate derived state during rendering or in event handlers. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function Game() {
  const [card, setCard] = useState(null);
  const [goldCardCount, setGoldCardCount] = useState(0);
  const [round, setRound] = useState(1);
  const [isGameOver, setIsGameOver] = useState(false);

  // 🔴 Avoid: Chains of Effects that adjust state to trigger each other
  useEffect(() => {
    if (card !== null && card.gold) {
      setGoldCardCount(c => c + 1);
    }
  }, [card]);

  useEffect(() => {
    if (goldCardCount > 3) {
      setRound(r => r + 1);
      setGoldCardCount(0);
    }
  }, [goldCardCount]);

  useEffect(() => {
    if (round > 5) {
      setIsGameOver(true);
    }
  }, [round]);

  useEffect(() => {
    alert('Good game!');
  }, [isGameOver]);
}
```

**Issues**:
- Multiple render passes: `setCard` → render → `setGoldCardCount` → render → `setRound` → render → `setIsGameOver` → render
- Rigid and fragile code (can't step through game history)

**Right Way:**
```jsx
function Game() {
  const [card, setCard] = useState(null);
  const [goldCardCount, setGoldCardCount] = useState(0);
  const [round, setRound] = useState(1);

  // ✅ Calculate what you can during rendering
  const isGameOver = round > 5;

  function handlePlaceCard(nextCard) {
    if (isGameOver) {
      throw Error('Game already ended.');
    }

    // ✅ Calculate all next state in the event handler
    setCard(nextCard);
    if (nextCard.gold) {
      if (goldCardCount < 3) {
        setGoldCardCount(goldCardCount + 1);
      } else {
        setGoldCardCount(0);
        setRound(round + 1);
        if (round === 5) {
          alert('Good game!');
        }
      }
    }
  }
}
```

**Benefits**: Single render pass, supports game history without triggering Effect chains.

---

### 8. Passing Data to Parent

Data should flow from parent to child. Parent should fetch/manage data and pass it down. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function Parent() {
  const [data, setData] = useState(null);
  return <Child onFetched={setData} />;
}

function Child({ onFetched }) {
  const data = useSomeAPI();

  // 🔴 Avoid: Passing data to parent in an Effect
  useEffect(() => {
    if (data) {
      onFetched(data);
    }
  }, [onFetched, data]);
}
```

**Right Way:**
```jsx
function Parent() {
  const data = useSomeAPI();
  // ✅ Good: Passing data down to the child
  return <Child data={data} />;
}

function Child({ data }) {
  // ...
}
```

---

### 9. Posting Data (Form Submission)

Form submissions should be handled in event handlers, not Effects. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function Form() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // ✅ Good: Analytics on display
  useEffect(() => {
    post('/analytics/event', { eventName: 'visit_form' });
  }, []);

  // 🔴 Avoid: Event-specific logic inside an Effect
  const [jsonToSubmit, setJsonToSubmit] = useState(null);
  useEffect(() => {
    if (jsonToSubmit !== null) {
      post('/api/register', jsonToSubmit);
    }
  }, [jsonToSubmit]);

  function handleSubmit(e) {
    e.preventDefault();
    setJsonToSubmit({ firstName, lastName });
  }
}
```

**Right Way:**
```jsx
function Form() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // ✅ Good: Analytics on display
  useEffect(() => {
    post('/analytics/event', { eventName: 'visit_form' });
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    // ✅ Good: Event-specific logic is in the event handler
    post('/api/register', { firstName, lastName });
  }
}
```

---

### 10. Initialization Logic

App-wide logic that should only run once should be at module level or guarded. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function App() {
  // 🔴 Avoid: Effects with logic that should only ever run once
  useEffect(() => {
    loadDataFromLocalStorage();
    checkAuthToken();
  }, []);
}
```

**Issue**: Effects run twice in development mode (Strict Mode).

**Right Way (With Guard):**
```jsx
let didInit = false;

function App() {
  useEffect(() => {
    if (!didInit) {
      didInit = true;
      // ✅ Only runs once per app load
      loadDataFromLocalStorage();
      checkAuthToken();
    }
  }, []);
}
```

**Better Way (Module Level):**
```jsx
if (typeof window !== 'undefined') {
  // ✅ Only runs once per app load
  checkAuthToken();
  loadDataFromLocalStorage();
}

function App() {
  // ...
}
```

---

### 11. Data Fetching

Effects ARE appropriate for data fetching, but you must handle race conditions properly. ([You Might Not Need an Effect][1])

**Wrong Way (Race Condition):**
```jsx
function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);

  // 🔴 Avoid: Fetching without cleanup logic (race condition)
  useEffect(() => {
    fetchResults(query, page).then(json => {
      setResults(json);
    });
  }, [query, page]);
}
```

**Issue**: If user types quickly ("h" → "he" → "hel"), responses may arrive out of order.

**Right Way:**
```jsx
function SearchResults({ query }) {
  const [results, setResults] = useState([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let ignore = false;

    fetchResults(query, page).then(json => {
      if (!ignore) {
        setResults(json);
      }
    });

    return () => {
      ignore = true;  // Cleanup ignores stale responses
    };
  }, [query, page]);
}
```

**Better Way (Custom Hook):**
```jsx
function useData(url) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let ignore = false;

    fetch(url)
      .then(response => response.json())
      .then(json => {
        if (!ignore) {
          setData(json);
        }
      });

    return () => {
      ignore = true;
    };
  }, [url]);

  return data;
}

function SearchResults({ query }) {
  const [page, setPage] = useState(1);
  const params = new URLSearchParams({ query, page });
  const results = useData(`/api/search?${params}`);
}
```

**Note**: Modern frameworks like Next.js, Remix, and TanStack Query provide more efficient built-in data fetching mechanisms.

---

### 12. Subscribing to External Stores

Use `useSyncExternalStore` instead of manual subscription Effects. ([You Might Not Need an Effect][1])

**Wrong Way:**
```jsx
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  // Not ideal: Manual store subscription in an Effect
  useEffect(() => {
    function updateState() {
      setIsOnline(navigator.onLine);
    }

    updateState();
    window.addEventListener('online', updateState);
    window.addEventListener('offline', updateState);

    return () => {
      window.removeEventListener('online', updateState);
      window.removeEventListener('offline', updateState);
    };
  }, []);

  return isOnline;
}
```

**Right Way (`useSyncExternalStore`):**
```jsx
function subscribe(callback) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function useOnlineStatus() {
  // ✅ Good: Subscribing to external store with built-in Hook
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,  // Client value
    () => true               // Server value
  );
}
```

---

## When Effects ARE Appropriate

Effects are appropriate for:

1. **Synchronizing with external systems** (non-React widgets, network, browser DOM)
2. **Data fetching** (with proper race condition handling)
3. **Setting up subscriptions** to external stores
4. **Sending analytics** when a component is displayed

---

## Best Practices Summary

1. **Calculate, don't store** derived state during rendering
2. **Use `useMemo`** for expensive calculations only
3. **Use `key` prop** to reset entire component tree
4. **Prefer event handlers** for user interactions
5. **Batch state updates** in single event handler
6. **Lift state up** to share between components
7. **Extract custom Hooks** for reusable logic
8. **Use `useSyncExternalStore`** for external subscriptions
9. **Handle race conditions** in data fetching Effects
10. **Avoid Effect chains** – calculate in event handlers instead

---

## References

[1]: https://react.dev/learn/you-might-not-need-an-effect "You Might Not Need an Effect"
