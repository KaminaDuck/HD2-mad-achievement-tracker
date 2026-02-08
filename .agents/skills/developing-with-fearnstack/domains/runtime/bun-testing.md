---
title: Bun Testing
description: Bun's built-in test runner with Jest-compatible API
---

# Bun Testing

Bun includes a fast, built-in test runner with a Jest-compatible API. No configuration required.

## Quick Start

```bash
# Run tests
bun test

# Run specific file
bun test src/utils.test.ts

# Watch mode
bun test --watch

# Run tests matching pattern
bun test --grep "user"
```

## Writing Tests

### Basic Test

```typescript
// utils.test.ts
import { describe, it, expect, test } from "bun:test";
import { add, multiply } from "./utils";

// Using 'it'
describe("math utils", () => {
  it("should add numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("should multiply numbers", () => {
    expect(multiply(2, 3)).toBe(6);
  });
});

// Using 'test' (alias for 'it')
test("simple test", () => {
  expect(1 + 1).toBe(2);
});
```

### Async Tests

```typescript
import { describe, it, expect } from "bun:test";

describe("async operations", () => {
  it("should handle promises", async () => {
    const result = await fetchData();
    expect(result).toBeDefined();
  });

  it("should handle async/await", async () => {
    const user = await getUser("123");
    expect(user.name).toBe("Alice");
  });
});
```

## Assertions

```typescript
import { expect } from "bun:test";

// Equality
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).toStrictEqual(expected);  // Strict deep equality

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(number).toBeGreaterThan(3);
expect(number).toBeGreaterThanOrEqual(3);
expect(number).toBeLessThan(5);
expect(number).toBeLessThanOrEqual(5);
expect(number).toBeCloseTo(0.3, 5);     // Floating point

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain("substring");

// Arrays
expect(array).toContain(item);
expect(array).toHaveLength(3);

// Objects
expect(object).toHaveProperty("key");
expect(object).toHaveProperty("key", "value");
expect(object).toMatchObject({ key: "value" });

// Errors
expect(() => throwError()).toThrow();
expect(() => throwError()).toThrow("message");
expect(() => throwError()).toThrow(ErrorClass);

// Negation
expect(value).not.toBe(other);
expect(array).not.toContain(item);
```

## Setup and Teardown

```typescript
import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from "bun:test";

describe("database tests", () => {
  let db: Database;

  beforeAll(async () => {
    // Run once before all tests
    db = await createDatabase();
  });

  afterAll(async () => {
    // Run once after all tests
    await db.close();
  });

  beforeEach(async () => {
    // Run before each test
    await db.clear();
  });

  afterEach(async () => {
    // Run after each test
    await db.rollback();
  });

  it("should insert data", async () => {
    await db.insert({ name: "test" });
    expect(await db.count()).toBe(1);
  });
});
```

## Mocking

### Mock Functions

```typescript
import { mock } from "bun:test";

const mockFn = mock((x: number) => x * 2);

// Call the mock
mockFn(5);
mockFn(10);

// Assertions
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(2);
expect(mockFn).toHaveBeenCalledWith(5);
expect(mockFn).toHaveBeenLastCalledWith(10);

// Return values
expect(mockFn.mock.calls).toEqual([[5], [10]]);
expect(mockFn.mock.results[0].value).toBe(10);
```

### Mock Implementations

```typescript
const mockFn = mock();

// Set return value
mockFn.mockReturnValue(42);
expect(mockFn()).toBe(42);

// Set return value once
mockFn.mockReturnValueOnce(1).mockReturnValueOnce(2).mockReturnValue(0);
expect(mockFn()).toBe(1);
expect(mockFn()).toBe(2);
expect(mockFn()).toBe(0);

// Mock implementation
mockFn.mockImplementation((x) => x * 3);
expect(mockFn(5)).toBe(15);

// Reset
mockFn.mockReset();
```

### Spying

```typescript
import { spyOn } from "bun:test";

const user = {
  getName: () => "Alice",
};

const spy = spyOn(user, "getName");

user.getName();

expect(spy).toHaveBeenCalled();
expect(spy).toHaveBeenCalledTimes(1);

// Restore original
spy.mockRestore();
```

### Module Mocking

```typescript
import { mock } from "bun:test";

// Mock a module
mock.module("./database", () => ({
  connect: mock(() => Promise.resolve({ connected: true })),
  query: mock(() => Promise.resolve([])),
}));

// Now imports get the mock
import { connect, query } from "./database";
```

## Snapshot Testing

```typescript
import { expect, it } from "bun:test";

it("should match snapshot", () => {
  const user = {
    name: "Alice",
    age: 30,
    roles: ["admin", "user"],
  };

  expect(user).toMatchSnapshot();
});

// Inline snapshots
it("should match inline snapshot", () => {
  expect({ name: "Bob" }).toMatchInlineSnapshot(`
    {
      "name": "Bob",
    }
  `);
});
```

Update snapshots:

```bash
bun test --update-snapshots
```

## Test Coverage

```bash
# Generate coverage report
bun test --coverage

# Coverage with thresholds
bun test --coverage --coverage-threshold=80
```

## Skipping and Focusing

```typescript
// Skip tests
it.skip("skipped test", () => {
  // Not run
});

describe.skip("skipped suite", () => {
  // Not run
});

// Focus on specific tests (only these run)
it.only("focused test", () => {
  // Only this runs
});

describe.only("focused suite", () => {
  // Only this suite runs
});

// Conditional skip
it.skipIf(process.env.CI)("skip in CI", () => {
  // Skipped in CI
});

// Todo tests
it.todo("implement later");
```

## Timeout

```typescript
// Set timeout for a test
it("slow test", async () => {
  await slowOperation();
}, 10000); // 10 second timeout

// Global timeout
describe("slow suite", () => {
  // ... tests
}, { timeout: 30000 });
```

## Testing Hono Apps

```typescript
import { describe, it, expect } from "bun:test";
import { testClient } from "hono/testing";
import app from "./server";

describe("API", () => {
  const client = testClient(app);

  it("should return users", async () => {
    const res = await client.api.users.$get();
    expect(res.status).toBe(200);

    const users = await res.json();
    expect(Array.isArray(users)).toBe(true);
  });

  it("should create a user", async () => {
    const res = await client.api.users.$post({
      json: { name: "Alice", email: "alice@example.com" },
    });

    expect(res.status).toBe(201);

    const user = await res.json();
    expect(user.name).toBe("Alice");
  });

  it("should handle errors", async () => {
    const res = await client.api.users[":id"].$get({
      param: { id: "invalid" },
    });

    expect(res.status).toBe(404);
  });
});
```

## Configuration

Create `bunfig.toml`:

```toml
[test]
# Test file patterns
include = ["**/*.test.ts", "**/*.spec.ts"]

# Coverage
coverage = true
coverageThreshold = 80

# Timeout
timeout = 5000

# Bail on first failure
bail = false
```

Or in `package.json`:

```json
{
  "scripts": {
    "test": "bun test",
    "test:watch": "bun test --watch",
    "test:coverage": "bun test --coverage"
  }
}
```

## CI Integration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1

      - run: bun install
      - run: bun test --coverage
```

## Next Steps

- [Bun Runtime](bun-runtime.md) - Runtime features
- [Bun Bundler](bun-bundler.md) - Building applications
- [Hono Fundamentals](../backend/hono-fundamentals.md) - Testing Hono apps
