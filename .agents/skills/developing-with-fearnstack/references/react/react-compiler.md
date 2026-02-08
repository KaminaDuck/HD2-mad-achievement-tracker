---
title: "React Compiler Reference"
description: "Automatic memoization optimization with babel-plugin-react-compiler"
type: "tool-reference"
tags: ["react", "compiler", "memoization", "babel", "optimization", "performance", "vite", "webpack"]
category: "frontend"
subcategory: "react"
version: "1.0"
last_updated: "2025-12-06"
status: "stable"
sources:
  - name: "React Compiler Overview"
    url: "https://react.dev/learn/react-compiler"
  - name: "React Compiler Installation"
    url: "https://react.dev/learn/react-compiler/installation"
  - name: "Incremental Adoption"
    url: "https://react.dev/learn/react-compiler/incremental-adoption"
  - name: "Debugging Guide"
    url: "https://react.dev/learn/react-compiler/debugging"
related: ["react-19.md"]
author: "unknown"
contributors: []
---

# React Compiler Reference

React Compiler is an automatic optimization tool that handles memoization for React applications without requiring manual intervention. It eliminates the need for `useMemo`, `useCallback`, and `React.memo` by automatically optimizing components at build time. ([React Compiler Overview][1])

## Overview

### What It Does

React Compiler analyzes your React code and automatically applies memoization optimizations that developers previously had to implement manually. ([React Compiler Overview][1])

**Eliminates manual memoization:**
- `useMemo` - Automatic caching of expensive calculations
- `useCallback` - Automatic stable function references
- `React.memo` - Automatic component memoization

### Requirements

- **React 19** - Best compatibility and full feature support ([React Compiler Installation][2])
- **React 17/18** - Also supported with some limitations ([React Compiler Installation][2])
- **Rules of React** - Code must follow React's rules for correct compilation

## Installation

Install React Compiler as a dev dependency:

```bash
# npm
npm install -D babel-plugin-react-compiler@latest

# pnpm
pnpm add -D babel-plugin-react-compiler@latest

# yarn
yarn add -D babel-plugin-react-compiler@latest
```

([React Compiler Installation][2])

## Build Tool Configuration

### Babel

React Compiler must run **first** in your Babel plugin pipeline to access original source information. ([React Compiler Installation][2])

```javascript
// babel.config.js
module.exports = {
  plugins: [
    'babel-plugin-react-compiler', // must run first!
    // ... other plugins
  ],
};
```

### Vite

Add to `vite.config.js` using the `@vitejs/plugin-react` babel configuration: ([React Compiler Installation][2])

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});
```

**Alternative with separate Babel plugin:**

```bash
npm install -D vite-plugin-babel
```

```javascript
import babel from 'vite-plugin-babel';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    babel({
      babelConfig: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});
```

### Next.js

Refer to [Next.js documentation](https://nextjs.org/docs/app/api-reference/next-config-js/reactCompiler) for configuration. ([React Compiler Installation][2])

### React Router

```bash
npm install vite-plugin-babel
```

```javascript
import { defineConfig } from "vite";
import babel from "vite-plugin-babel";
import { reactRouter } from "@react-router/dev/vite";

const ReactCompilerConfig = { /* ... */ };

export default defineConfig({
  plugins: [
    reactRouter(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"], // if using TypeScript
        plugins: [
          ["babel-plugin-react-compiler", ReactCompilerConfig],
        ],
      },
    }),
  ],
});
```

([React Compiler Installation][2])

### Other Build Tools

- **Webpack** - Community loader: [react-compiler-webpack](https://github.com/SukkaW/react-compiler-webpack) ([React Compiler Installation][2])
- **Expo** - See [Expo documentation](https://docs.expo.dev/guides/react-compiler/) ([React Compiler Installation][2])
- **Metro (React Native)** - Uses Babel via Metro, follow Babel configuration ([React Compiler Installation][2])
- **Rspack** - See [Rspack documentation](https://rspack.dev/guide/tech/react#react-compiler) ([React Compiler Installation][2])
- **Rsbuild** - See [Rsbuild documentation](https://rsbuild.dev/guide/framework/react#react-compiler) ([React Compiler Installation][2])

## ESLint Integration

Install the ESLint plugin for React Compiler rules:

```bash
npm install -D eslint-plugin-react-hooks@latest
```

The compiler rules are available in the `recommended-latest` preset. Follow the [installation instructions](https://github.com/facebook/react/blob/main/packages/eslint-plugin-react-hooks/README.md#installation). ([React Compiler Installation][2])

**The ESLint plugin:**
- Identifies violations of the Rules of React
- Shows which components can't be optimized
- Provides helpful error messages for fixing issues

## Verification

### React DevTools

1. Install the React Developer Tools browser extension
2. Open your app in development mode
3. Look for the **Memo ✨** badge next to optimized component names

([React Compiler Installation][2])

### Build Output

Compiled code includes memoization logic using the compiler runtime: ([React Compiler Installation][2])

```javascript
import { c as _c } from "react/compiler-runtime";

export default function MyApp() {
  const $ = _c(1);
  let t0;
  if ($[0] === Symbol.for("react.memo_cache_sentinel")) {
    t0 = <div>Hello World</div>;
    $[0] = t0;
  } else {
    t0 = $[0];
  }
  return t0;
}
```

## Incremental Adoption

React Compiler supports three main incremental adoption strategies. ([Incremental Adoption][3])

### 1. Directory-Based Adoption

Use Babel's `overrides` configuration to apply the compiler to specific directories: ([Incremental Adoption][3])

```javascript
// babel.config.js
module.exports = {
  plugins: [],
  overrides: [
    {
      test: './src/modern/**/*.{js,jsx,ts,tsx}',
      plugins: ['babel-plugin-react-compiler']
    }
  ]
};
```

**Expanding coverage:**

```javascript
module.exports = {
  overrides: [
    {
      test: [
        './src/modern/**/*.{js,jsx,ts,tsx}',
        './src/features/**/*.{js,jsx,ts,tsx}'
      ],
      plugins: ['babel-plugin-react-compiler']
    }
  ]
};
```

### 2. Opt-in Mode with "use memo" Directive

Use `compilationMode: 'annotation'` to compile only components that explicitly opt in: ([Incremental Adoption][3])

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      compilationMode: 'annotation',
    }],
  ],
};
```

**Usage:**

```javascript
function TodoList({ todos }) {
  "use memo"; // Opt this component into compilation

  const sortedTodos = todos.slice().sort();
  return (
    <ul>
      {sortedTodos.map(todo => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </ul>
  );
}

function useSortedData(data) {
  "use memo"; // Opt this hook into compilation
  return data.slice().sort();
}
```

### 3. Runtime Feature Flags

Control compilation at runtime for A/B testing and gradual rollout: ([Incremental Adoption][3])

```javascript
// babel.config.js
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', {
      gating: {
        source: 'ReactCompilerFeatureFlags',
        importSpecifierName: 'isCompilerEnabled',
      },
    }],
  ],
};
```

```javascript
// ReactCompilerFeatureFlags.js
export function isCompilerEnabled() {
  return getFeatureFlag('react-compiler-enabled');
}
```

## Directives

### "use memo" - Opt In

Use in annotation mode to opt a component or hook into compilation: ([Incremental Adoption][3])

```javascript
function MyComponent() {
  "use memo";
  // Component is compiled
}
```

### "use no memo" - Opt Out

Temporarily exclude problematic components from compilation: ([React Compiler Installation][2])

```javascript
function ProblematicComponent() {
  "use no memo"; // Skip compilation for this component
  // Component code here
}
```

**Important:** Fix the underlying issue and remove the directive once resolved.

## Debugging

### Compiler Errors vs Runtime Issues

**Compiler Errors:**
- Occur at build time and prevent code from compiling
- Rare because the compiler skips problematic code rather than failing
- Should be reported as potential compiler bugs

**Runtime Issues:**
- Occur when compiled code behaves differently than expected
- More common than compiler errors
- Usually result from Rules of React violations

([Debugging Guide][4])

### Common Breaking Patterns

The main issue is **memoization-for-correctness** — when your app depends on specific values being memoized to work properly: ([Debugging Guide][4])

1. **Effects that rely on referential equality** - Effects depend on objects/arrays maintaining the same reference
2. **Dependency arrays that need stable references** - Unstable dependencies cause effects to fire too often
3. **Conditional logic based on reference checks** - Code uses referential equality for caching

**Common symptoms:**
- Effects over-firing
- Infinite loops
- Missing updates

### Debugging Workflow

1. **Temporarily disable compilation** using `"use no memo"`: ([Debugging Guide][4])

```javascript
function ProblematicComponent() {
  "use no memo";
  // ... rest of component
}
```

2. If the issue disappears, it's likely a Rules of React violation

3. **Alternative approach:** Remove all manual memoization (`useMemo`, `useCallback`, `memo`) from the problematic component. If the bug still occurs, you have a Rules of React violation that needs fixing. ([Debugging Guide][4])

4. Fix issues step by step, then remove `"use no memo"`

5. Verify the component shows the ✨ badge in React DevTools

### Reporting Bugs

Before reporting, verify it's a compiler bug: ([Debugging Guide][4])

1. Verify it's not a Rules of React violation (check with ESLint)
2. Create a minimal reproduction
3. Test without the compiler to confirm the issue only occurs with compilation

Report to [facebook/react](https://github.com/facebook/react/issues/new?template=compiler_bug_report.yml) with:
- React and compiler versions
- Minimal reproduction code
- Expected vs actual behavior
- Error messages

## Why Incremental Adoption?

1. **Build Confidence** - Test optimizations on small sections first
2. **Verify Correctness** - Ensure app behaves properly with compiled code
3. **Measure Performance** - Quantify real-world improvements
4. **Systematic Fixes** - Address Rules of React violations gradually
5. **Risk Mitigation** - Reduces bugs and keeps migration manageable

([Incremental Adoption][3])

## Additional Resources

- [React Compiler Working Group](https://github.com/reactwg/react-compiler) - GitHub discussions
- [Rules of React](/reference/rules) - Required for correct compilation
- [Configuration Options](/reference/react-compiler/configuration) - All compiler settings
- [Compiling Libraries](/reference/react-compiler/compiling-libraries) - Pre-compiled library distribution

---

[1]: https://react.dev/learn/react-compiler "React Compiler Overview"
[2]: https://react.dev/learn/react-compiler/installation "React Compiler Installation"
[3]: https://react.dev/learn/react-compiler/incremental-adoption "Incremental Adoption"
[4]: https://react.dev/learn/react-compiler/debugging "Debugging Guide"
