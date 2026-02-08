---
title: "Bun Test Runner"
description: "Fast, built-in, Jest-compatible test runner with TypeScript support, lifecycle hooks, mocking, and watch mode"
type: "api-reference"
tags: ["bun", "test", "jest", "testing", "runner", "typescript", "watch"]
category: "typescript"
subcategory: "test"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Test Documentation"
    url: "https://bun.sh/docs/test"
related:
  - "../README.md"
  - "./writing-tests.md"
  - "./mocks.md"
author: "unknown"
contributors: []
---

# Bun Test Runner

Bun ships with a fast, built-in, Jest-compatible test runner with TypeScript and JSX support. ([Bun Docs][1])

## Features

- TypeScript and JSX out of the box
- Lifecycle hooks (`beforeAll`, `beforeEach`, `afterEach`, `afterAll`)
- Snapshot testing
- UI & DOM testing
- Watch mode with `--watch`
- Script pre-loading with `--preload`
- Jest compatibility (tracking: [GitHub issue](https://github.com/oven-sh/bun/issues/1825))

## Basic Usage

### Run Tests

```bash
bun test
```

### Test File Example

```typescript
import { expect, test } from "bun:test";

test("2 + 2", () => {
  expect(2 + 2).toBe(4);
});
```

### File Discovery

The runner recursively searches for files matching:

- `*.test.{js|jsx|ts|tsx}`
- `*_test.{js|jsx|ts|tsx}`
- `*.spec.{js|jsx|ts|tsx}`
- `*_spec.{js|jsx|ts|tsx}`

## Test Filtering

### By File Path

```bash
bun test <filter> <filter> ...
```

### By Test Name

```bash
bun test --test-name-pattern addition
```

### Specific File

```bash
bun test ./test/specific-file.test.ts
```

## CI/CD Integration

### GitHub Actions

```yaml
jobs:
  build:
    name: build-app
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Install bun
        uses: oven-sh/setup-bun@v2
      - name: Install dependencies
        run: bun install
      - name: Run tests
        run: bun test
```

### JUnit XML Reports

```bash
bun test --reporter=junit --reporter-outfile=./bun.xml
```

## Timeouts

```bash
# Default is 5000ms
bun test --timeout 20
```

Per-test timeout via third argument:

```typescript
test("slow operation", async () => {
  const data = await slowOperation();
  expect(data).toBe(42);
}, 500); // must run in <500ms
```

## Concurrent Test Execution

### Enable Concurrency

```bash
bun test --concurrent
```

### Limit Concurrency

```bash
bun test --concurrent --max-concurrency 4
```

### `test.concurrent`

```typescript
import { test, expect } from "bun:test";

test.concurrent("concurrent test 1", async () => {
  await fetch("/api/endpoint1");
  expect(true).toBe(true);
});

test.concurrent("concurrent test 2", async () => {
  await fetch("/api/endpoint2");
  expect(true).toBe(true);
});
```

### `test.serial`

Force sequential execution even with `--concurrent`:

```typescript
import { test, expect } from "bun:test";

let sharedState = 0;

test.serial("first serial test", () => {
  sharedState = 1;
  expect(sharedState).toBe(1);
});

test.serial("second serial test", () => {
  expect(sharedState).toBe(1);
  sharedState = 2;
});
```

## Rerun and Randomize

### Rerun Tests

```bash
bun test --rerun-each 100
```

### Randomize Order

```bash
bun test --randomize
```

### Reproducible Random Order

```bash
bun test --seed 123456
```

## Bail on Failure

```bash
# bail after 1 failure
bun test --bail

# bail after 10 failures
bun test --bail=10
```

## Watch Mode

```bash
bun test --watch
```

## Lifecycle Hooks

| Hook | Description |
|------|-------------|
| `beforeAll` | Runs once before all tests |
| `beforeEach` | Runs before each test |
| `afterEach` | Runs after each test |
| `afterAll` | Runs once after all tests |

### Preload Scripts

```bash
bun test --preload ./setup.ts
```

## Mocks

```typescript
import { test, expect, mock } from "bun:test";

const random = mock(() => Math.random());

test("random", () => {
  const val = random();
  expect(val).toBeGreaterThan(0);
  expect(random).toHaveBeenCalled();
  expect(random).toHaveBeenCalledTimes(1);
});
```

Or use `jest.fn()`:

```typescript
import { test, expect, jest } from "bun:test";

const random = jest.fn(() => Math.random());
```

## Snapshot Testing

```typescript
import { test, expect } from "bun:test";

test("snapshot", () => {
  expect({ a: 1 }).toMatchSnapshot();
});
```

Update snapshots:

```bash
bun test --update-snapshots
```

## UI & DOM Testing

Compatible with:

- [HappyDOM](https://github.com/capricorn86/happy-dom)
- [DOM Testing Library](https://testing-library.com/docs/dom-testing-library/intro/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro)

## AI Agent Integration

Enable quieter output for AI assistants:

```bash
CLAUDECODE=1 bun test
REPL_ID=1 bun test
AGENT=1 bun test
```

## CLI Reference

### Execution Control

| Flag | Description |
|------|-------------|
| `--timeout <ms>` | Per-test timeout (default: 5000) |
| `--rerun-each <n>` | Re-run each test file n times |
| `--concurrent` | Run all tests concurrently |
| `--max-concurrency <n>` | Max concurrent tests (default: 20) |
| `--randomize` | Run tests in random order |
| `--seed <n>` | Set random seed |
| `--bail[=n]` | Exit after n failures (default: 1) |

### Test Filtering

| Flag | Description |
|------|-------------|
| `--todo` | Include tests marked with `test.todo()` |
| `--test-name-pattern`, `-t` | Filter by test name regex |

### Reporting

| Flag | Description |
|------|-------------|
| `--reporter <type>` | Output format: `junit`, `dots` |
| `--reporter-outfile <path>` | Output file for reporter |
| `--dots` | Enable dots reporter |

### Coverage

| Flag | Description |
|------|-------------|
| `--coverage` | Generate coverage profile |
| `--coverage-reporter <type>` | Format: `text`, `lcov` |
| `--coverage-dir <path>` | Coverage directory (default: `coverage`) |

### Snapshots

| Flag | Description |
|------|-------------|
| `--update-snapshots`, `-u` | Update snapshot files |

## Examples

```bash
# Run all test files
bun test

# Filter by file name
bun test foo bar

# Filter by test name
bun test --test-name-pattern baz
```

---

[1]: https://bun.sh/docs/test "Bun Test Documentation"
