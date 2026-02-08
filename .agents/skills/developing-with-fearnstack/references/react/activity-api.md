---
title: "React Activity API Reference"
description: "Hide and show UI while preserving React and DOM state with <Activity>"
type: "api-reference"
tags: ["react", "activity", "performance", "state-preservation", "tabs", "react-19", "optimization"]
category: "frontend"
subcategory: "react"
version: "19.2"
last_updated: "2025-12-08"
status: "stable"
sources:
  - name: "React Activity Reference"
    url: "https://react.dev/reference/react/Activity"
  - name: "React 19.2 Release Blog"
    url: "https://react.dev/blog/2025/10/01/react-19-2"
  - name: "React Labs: View Transitions, Activity"
    url: "https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more"
related: ["react-19.md", "you-might-not-need-an-effect.md"]
author: "unknown"
contributors: []
---

# React Activity API Reference

The `<Activity>` component lets you hide parts of your UI without losing state. Introduced in React 19.2 (October 2025), it provides an alternative to conditional rendering that preserves both React state and DOM state when content is hidden. ([React Activity Reference][1])

## Overview

Activity solves a critical problem: how to hide parts of your UI without destroying state. ([React 19.2 Release Blog][2])

**Core Concept**: Instead of unmounting components with conditional rendering (`&&`), Activity visually hides them using `display: none` while preserving their internal state.

```jsx
// Before: State lost when hidden
{isVisible && <Page />}

// After: State preserved when hidden
<Activity mode={isVisible ? 'visible' : 'hidden'}>
  <Page />
</Activity>
```

## API Reference

### Component Signature

```jsx
import { Activity } from 'react';

<Activity mode={mode}>
  {children}
</Activity>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'visible' \| 'hidden'` | `'visible'` | Controls visibility of children |
| `children` | `ReactNode` | — | UI to show and hide |

### TypeScript Types

```typescript
interface ActivityProps {
  mode?: 'visible' | 'hidden';
  children: React.ReactNode;
}
```

## Modes

### `visible`

Shows the children normally. ([React Activity Reference][1])

- Children are rendered and visible
- Effects are mounted and running
- Updates are processed at normal priority

### `hidden`

Hides the children while preserving state. ([React Activity Reference][1])

- Children are hidden via `display: none`
- Effects are unmounted (cleanup functions run)
- Updates are deferred until React has idle time
- React state and DOM state are preserved

## How It Works

Activity implements a selective unmounting strategy that differs from both conditional rendering and CSS-based hiding. ([React 19.2 Release Blog][2])

### Internal Mechanism

1. **Visual Hiding**: Uses `display: none` CSS property on children
2. **State Preservation**: Maintains React component state and DOM state
3. **Effect Cleanup**: Destroys Effects when hidden, re-creates when visible
4. **Deferred Updates**: Re-renders still occur but at lower priority

### State Management Comparison

```
Conditional Rendering (&&):
  Hide → Unmount → Destroy state → Show → Remount → Re-initialize

Activity Component:
  Hide → Preserve state → Show → Restore state
```

### Effect Lifecycle

```javascript
// When Activity becomes hidden:
// 1. All Effects run their cleanup functions
// 2. Effects are not re-run while hidden
// 3. Props changes still cause re-renders (lower priority)

// When Activity becomes visible:
// 1. Effects are re-created and run
// 2. State is restored to previous values
```

## Usage Examples

### Preserving Sidebar State

Toggle a sidebar while preserving its expanded/collapsed sections. ([React Activity Reference][1])

```jsx
import { Activity, useState } from 'react';

function App() {
  const [showSidebar, setShowSidebar] = useState(true);

  return (
    <>
      <Activity mode={showSidebar ? 'visible' : 'hidden'}>
        <Sidebar />
      </Activity>
      <main>
        <button onClick={() => setShowSidebar(!showSidebar)}>
          Toggle sidebar
        </button>
        <Content />
      </main>
    </>
  );
}

function Sidebar() {
  // This state is preserved when sidebar is hidden
  const [expandedSections, setExpandedSections] = useState(['settings']);

  return (
    <nav>
      <CollapsibleSection
        title="Settings"
        expanded={expandedSections.includes('settings')}
        onToggle={() => toggleSection('settings')}
      />
      {/* ... more sections */}
    </nav>
  );
}
```

### Tab Interface with State Preservation

Switch between tabs without losing form data or scroll position. ([React Activity Reference][1])

```jsx
import { Activity, useState } from 'react';

function TabApp() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <div>
      <div role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'home'}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'contact'}
          onClick={() => setActiveTab('contact')}
        >
          Contact
        </button>
      </div>

      <Activity mode={activeTab === 'home' ? 'visible' : 'hidden'}>
        <HomeTab />
      </Activity>
      <Activity mode={activeTab === 'contact' ? 'visible' : 'hidden'}>
        <ContactTab />
      </Activity>
    </div>
  );
}

function ContactTab() {
  // Draft text preserved when switching tabs
  return (
    <form>
      <textarea
        placeholder="Type your message..."
        rows={4}
      />
      <button type="submit">Send</button>
    </form>
  );
}
```

### Pre-rendering with Suspense

Load content in the background while hidden for faster tab switches. ([React Activity Reference][1])

```jsx
import { Activity, useState, Suspense } from 'react';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TabButtons activeTab={activeTab} onTabChange={setActiveTab} />

      <Activity mode={activeTab === 'home' ? 'visible' : 'hidden'}>
        <Home />
      </Activity>
      <Activity mode={activeTab === 'posts' ? 'visible' : 'hidden'}>
        <Posts /> {/* Data fetches in background while hidden */}
      </Activity>
      <Activity mode={activeTab === 'settings' ? 'visible' : 'hidden'}>
        <Settings />
      </Activity>
    </Suspense>
  );
}
```

**Note**: Pre-rendering only works with Suspense-enabled data sources (e.g., `lazy()`, `use()` with cached Promises). It does not detect Effects-based data fetching. ([React Activity Reference][1])

### Improving Hydration Performance

Split your UI into independent hydration units. ([React Activity Reference][1])

```jsx
function Page() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <>
      {/* Buttons hydrate first and become interactive */}
      <TabButton onClick={() => setActiveTab('home')}>Home</TabButton>
      <TabButton onClick={() => setActiveTab('video')}>Video</TabButton>

      {/* Heavy components hydrate later */}
      <Activity mode={activeTab === 'home' ? 'visible' : 'hidden'}>
        <Home />
      </Activity>
      <Activity mode={activeTab === 'video' ? 'visible' : 'hidden'}>
        <HeavyVideoPlayer />
      </Activity>
    </>
  );
}
```

## Comparison: Activity vs Conditional Rendering

| Feature | Activity | Conditional (`&&`) |
|---------|----------|-------------------|
| React state | Preserved | Lost (unmounts) |
| DOM state | Preserved | Destroyed |
| Effect cleanup | Cleaned up | Cleaned up |
| DOM presence | Remains (hidden) | Removed |
| CSS property | `display: none` | N/A |
| Memory usage | Higher | Lower |
| Re-show speed | Instant | Re-render required |
| Use case | Frequently toggled | Rarely shown |

### When to Use Activity

**Use Activity when:**
- Users frequently toggle content visibility (tabs, sidebars, modals)
- You need to preserve form input values across visibility changes
- Content takes time to load and users might return to it
- You want faster hydration by splitting into independent units
- You need to maintain scroll position or video playback position

**Use conditional rendering when:**
- Content is rarely or never shown again
- Memory is a concern (many hidden components)
- You want a fresh state each time content appears
- Content has no meaningful state to preserve

## Caveats

### Text-Only Children Don't Hide

Components that render only text (no DOM element) won't be hidden because there's no element to apply `display: none` to. ([React Activity Reference][1])

```jsx
// Won't hide - no DOM element
<Activity mode="hidden">
  {() => "Hello, World!"}
</Activity>

// Will hide - has DOM element
<Activity mode="hidden">
  <span>Hello, World!</span>
</Activity>
```

### Media Playback Continues

Video and audio elements continue playing when hidden. Use Effect cleanup to pause them. ([React Activity Reference][1])

```jsx
import { useLayoutEffect, useRef } from 'react';

function Video({ src }) {
  const videoRef = useRef(null);

  useLayoutEffect(() => {
    const video = videoRef.current;

    // Cleanup: pause when Activity becomes hidden
    return () => {
      video.pause();
    };
  }, []);

  return <video ref={videoRef} src={src} />;
}
```

### Memory Trade-offs

Activity trades memory for speed. ([React 19.2 Release Blog][2])

- **Pros**: Faster show/hide transitions, preserved state
- **Cons**: All hidden content stays in DOM and React tree
- **Recommendation**: Use for frequently-toggled content; avoid for many rarely-shown items

### Effects Are Cleaned Up

When a component becomes hidden, its Effects run their cleanup functions. This means:

- Subscriptions are unsubscribed
- Timers are cleared
- Event listeners are removed

When the component becomes visible again, Effects re-run from scratch.

## Migration Pattern

### Before: State Lost on Toggle

```jsx
function App() {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <>
      <button onClick={() => setShowPanel(!showPanel)}>Toggle</button>
      {/* State is lost when hidden */}
      {showPanel && <Panel />}
    </>
  );
}
```

### After: State Preserved with Activity

```jsx
import { Activity } from 'react';

function App() {
  const [showPanel, setShowPanel] = useState(true);

  return (
    <>
      <button onClick={() => setShowPanel(!showPanel)}>Toggle</button>
      {/* State is preserved when hidden */}
      <Activity mode={showPanel ? 'visible' : 'hidden'}>
        <Panel />
      </Activity>
    </>
  );
}
```

## Best Practices

1. **Use for frequently-toggled content**: Tabs, sidebars, modals that users open/close often
2. **Combine with Suspense**: Enable background data loading for hidden content
3. **Clean up media Effects**: Pause video/audio in Effect cleanup functions
4. **Consider memory impact**: Don't wrap rarely-accessed content in Activity
5. **Test Effect cleanup**: Ensure your components properly clean up subscriptions and timers

## Future Development

The React team plans to add more modes to Activity for different use cases beyond the current `visible`/`hidden` pair. ([React 19.2 Release Blog][2])

## References

[1]: https://react.dev/reference/react/Activity "React Activity Reference"
[2]: https://react.dev/blog/2025/10/01/react-19-2 "React 19.2 Release Blog"
[3]: https://react.dev/blog/2025/04/23/react-labs-view-transitions-activity-and-more "React Labs: View Transitions, Activity"
