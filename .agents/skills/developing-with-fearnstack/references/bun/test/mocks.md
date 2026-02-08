---
title: "Bun Test Mocks"
description: "Create mock functions, spies, and module mocks for comprehensive test isolation"
type: "api-reference"
tags: ["bun", "test", "mocks", "spies", "jest", "module-mocking", "testing"]
category: "typescript"
subcategory: "test"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Mocks Documentation"
    url: "https://bun.sh/docs/test/mocks"
related:
  - "../README.md"
  - "./overview.md"
  - "./writing-tests.md"
author: "unknown"
contributors: []
---

# Bun Test Mocks

Mocking allows replacing dependencies with controlled implementations. Bun provides function mocks, spies, and module mocks. ([Bun Docs][1])

## Basic Function Mocks

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

### Jest Compatibility

```typescript
import { test, expect, jest } from "bun:test";

const random = jest.fn(() => Math.random());

test("random", () => {
  const val = random();
  expect(val).toBeGreaterThan(0);
  expect(random).toHaveBeenCalled();
});
```

## Mock Function Properties

```typescript
import { mock } from "bun:test";

const random = mock((multiplier: number) => multiplier * Math.random());

random(2);
random(10);

random.mock.calls;
// [[ 2 ], [ 10 ]]

random.mock.results;
// [
//   { type: "return", value: 0.6533907460954099 },
//   { type: "return", value: 0.6452713933037312 }
// ]
```

### Available Properties and Methods

| Property/Method | Description |
|-----------------|-------------|
| `mockFn.getMockName()` | Returns the mock name |
| `mockFn.mock.calls` | Array of call arguments |
| `mockFn.mock.results` | Array of return values |
| `mockFn.mock.instances` | Array of `this` contexts |
| `mockFn.mock.lastCall` | Arguments of most recent call |
| `mockFn.mockClear()` | Clears call history |
| `mockFn.mockReset()` | Clears history and removes implementation |
| `mockFn.mockRestore()` | Restores original implementation |
| `mockFn.mockImplementation(fn)` | Sets new implementation |
| `mockFn.mockImplementationOnce(fn)` | Sets implementation for next call |
| `mockFn.mockName(name)` | Sets mock name |
| `mockFn.mockReturnThis()` | Returns `this` |
| `mockFn.mockReturnValue(value)` | Sets return value |
| `mockFn.mockReturnValueOnce(value)` | Sets return value for next call |
| `mockFn.mockResolvedValue(value)` | Sets resolved Promise value |
| `mockFn.mockResolvedValueOnce(value)` | Sets resolved Promise for next call |
| `mockFn.mockRejectedValue(value)` | Sets rejected Promise value |
| `mockFn.mockRejectedValueOnce(value)` | Sets rejected Promise for next call |
| `mockFn.withImplementation(fn, callback)` | Temporarily changes implementation |

## Practical Examples

### Basic Mock Usage

```typescript
import { test, expect, mock } from "bun:test";

test("mock function behavior", () => {
  const mockFn = mock((x: number) => x * 2);

  const result1 = mockFn(5);
  const result2 = mockFn(10);

  expect(mockFn).toHaveBeenCalledTimes(2);
  expect(mockFn).toHaveBeenCalledWith(5);
  expect(mockFn).toHaveBeenLastCalledWith(10);

  expect(result1).toBe(10);
  expect(result2).toBe(20);

  expect(mockFn.mock.calls).toEqual([[5], [10]]);
  expect(mockFn.mock.results).toEqual([
    { type: "return", value: 10 },
    { type: "return", value: 20 },
  ]);
});
```

### Dynamic Mock Implementations

```typescript
import { test, expect, mock } from "bun:test";

test("dynamic mock implementations", () => {
  const mockFn = mock();

  mockFn.mockImplementationOnce(() => "first");
  mockFn.mockImplementationOnce(() => "second");
  mockFn.mockImplementation(() => "default");

  expect(mockFn()).toBe("first");
  expect(mockFn()).toBe("second");
  expect(mockFn()).toBe("default");
  expect(mockFn()).toBe("default");
});
```

### Async Mocks

```typescript
import { test, expect, mock } from "bun:test";

test("async mock functions", async () => {
  const asyncMock = mock();

  asyncMock.mockResolvedValueOnce("first result");
  asyncMock.mockResolvedValue("default result");

  expect(await asyncMock()).toBe("first result");
  expect(await asyncMock()).toBe("default result");

  const rejectMock = mock();
  rejectMock.mockRejectedValue(new Error("Mock error"));

  await expect(rejectMock()).rejects.toThrow("Mock error");
});
```

## Spies with `spyOn()`

Track calls without replacing the implementation:

```typescript
import { test, expect, spyOn } from "bun:test";

const ringo = {
  name: "Ringo",
  sayHi() {
    console.log(`Hello I'm ${this.name}`);
  },
};

const spy = spyOn(ringo, "sayHi");

test("spyOn", () => {
  expect(spy).toHaveBeenCalledTimes(0);
  ringo.sayHi();
  expect(spy).toHaveBeenCalledTimes(1);
});
```

### Advanced Spy Usage

```typescript
import { test, expect, spyOn, afterEach } from "bun:test";

class UserService {
  async getUser(id: string) {
    return { id, name: `User ${id}` };
  }

  async saveUser(user: any) {
    return { ...user, saved: true };
  }
}

const userService = new UserService();

afterEach(() => {
  jest.restoreAllMocks();
});

test("spy on service methods", async () => {
  const getUserSpy = spyOn(userService, "getUser");
  const saveUserSpy = spyOn(userService, "saveUser");

  const user = await userService.getUser("123");
  await userService.saveUser(user);

  expect(getUserSpy).toHaveBeenCalledWith("123");
  expect(saveUserSpy).toHaveBeenCalledWith(user);
});

test("spy with mock implementation", async () => {
  const getUserSpy = spyOn(userService, "getUser").mockResolvedValue({
    id: "123",
    name: "Mocked User",
  });

  const result = await userService.getUser("123");

  expect(result.name).toBe("Mocked User");
  expect(getUserSpy).toHaveBeenCalledWith("123");
});
```

## Module Mocks with `mock.module()`

```typescript
import { test, expect, mock } from "bun:test";

mock.module("./module", () => {
  return {
    foo: "bar",
  };
});

test("mock.module", async () => {
  const esm = await import("./module");
  expect(esm.foo).toBe("bar");

  const cjs = require("./module");
  expect(cjs.foo).toBe("bar");
});
```

### Overriding Already Imported Modules

```typescript
import { test, expect, mock } from "bun:test";
import { foo } from "./module";

test("mock.module", async () => {
  const cjs = require("./module");
  expect(foo).toBe("bar");
  expect(cjs.foo).toBe("bar");

  mock.module("./module", () => {
    return {
      foo: "baz",
    };
  });

  // Live bindings are updated
  expect(foo).toBe("baz");
  expect(cjs.foo).toBe("baz");
});
```

### Hoisting & Preloading

For ensuring mocks before import, use `--preload`:

```typescript
// my-preload.ts
import { mock } from "bun:test";

mock.module("./module", () => {
  return {
    foo: "bar",
  };
});
```

```bash
bun test --preload ./my-preload
```

Or in `bunfig.toml`:

```toml
[test]
preload = ["./my-preload"]
```

### Mocking External Dependencies

```typescript
import { test, expect, mock } from "bun:test";

mock.module("pg", () => ({
  Client: mock(function () {
    return {
      connect: mock(async () => {}),
      query: mock(async (sql: string) => ({
        rows: [{ id: 1, name: "Test User" }],
      })),
      end: mock(async () => {}),
    };
  }),
}));

test("database operations", async () => {
  const { Database } = await import("./database");
  const db = new Database();

  const users = await db.getUsers();
  expect(users).toHaveLength(1);
  expect(users[0].name).toBe("Test User");
});
```

## Global Mock Functions

### Clear All Mocks

```typescript
import { expect, mock, test } from "bun:test";

const random1 = mock(() => Math.random());
const random2 = mock(() => Math.random());

test("clearing all mocks", () => {
  random1();
  random2();

  expect(random1).toHaveBeenCalledTimes(1);
  expect(random2).toHaveBeenCalledTimes(1);

  mock.clearAllMocks();

  expect(random1).toHaveBeenCalledTimes(0);
  expect(random2).toHaveBeenCalledTimes(0);

  // Implementations are preserved
  expect(typeof random1()).toBe("number");
});
```

### Restore All Mocks

```typescript
import { expect, mock, spyOn, test } from "bun:test";

import * as fooModule from "./foo.ts";
import * as barModule from "./bar.ts";

test("foo, bar", () => {
  const fooSpy = spyOn(fooModule, "foo");
  const barSpy = spyOn(barModule, "bar");

  fooSpy.mockImplementation(() => 42);
  barSpy.mockImplementation(() => 43);

  expect(fooModule.foo()).toBe(42);
  expect(barModule.bar()).toBe(43);

  mock.restore();

  expect(fooModule.foo()).toBe("foo");
  expect(barModule.bar()).toBe("bar");
});
```

## Vitest Compatibility

```typescript
import { test, expect, vi } from "bun:test";

test("vitest compatibility", () => {
  const mockFn = vi.fn(() => 42);

  mockFn();
  expect(mockFn).toHaveBeenCalled();

  // Available: vi.fn, vi.spyOn, vi.mock, vi.restoreAllMocks, vi.clearAllMocks
});
```

## Implementation Details

### Cache Interaction

Module mocks interact with both ESM and CommonJS caches.

### Lazy Evaluation

Mock factory callback is only evaluated when the module is imported.

### Path Resolution

Supports relative paths, absolute paths, and package names.

### Live Bindings

Mocked ESM modules maintain live bindings - changing the mock updates all imports.

## Advanced Patterns

### Factory Functions

```typescript
import { mock } from "bun:test";

function createMockUser(overrides = {}) {
  return {
    id: "mock-id",
    name: "Mock User",
    email: "mock@example.com",
    ...overrides,
  };
}

const mockUserService = {
  getUser: mock(async (id: string) => createMockUser({ id })),
  createUser: mock(async (data: any) => createMockUser(data)),
};
```

### Mock Cleanup Patterns

```typescript
import { afterEach, beforeEach, mock } from "bun:test";

beforeEach(() => {
  mock.module("./logger", () => ({
    log: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
  }));
});

afterEach(() => {
  mock.restore();
  mock.clearAllMocks();
});
```

## Best Practices

### Keep Mocks Simple

```typescript
// Good: Simple, focused mock
const mockUserApi = {
  getUser: mock(async id => ({ id, name: "Test User" })),
};

// Avoid: Overly complex mock behavior
const complexMock = mock(input => {
  if (input.type === "A") return processTypeA(input);
  // ... lots of complex logic
});
```

### Use Type-Safe Mocks

```typescript
interface UserService {
  getUser(id: string): Promise<User>;
  createUser(data: CreateUserData): Promise<User>;
}

const mockUserService: UserService = {
  getUser: mock(async (id: string) => ({ id, name: "Test User" })),
  createUser: mock(async data => ({ id: "new-id", ...data })),
};
```

### Test Mock Behavior

```typescript
test("service calls API correctly", async () => {
  const mockApi = { fetchUser: mock(async () => ({ id: "1" })) };

  const service = new UserService(mockApi);
  await service.getUser("123");

  expect(mockApi.fetchUser).toHaveBeenCalledWith("123");
  expect(mockApi.fetchUser).toHaveBeenCalledTimes(1);
});
```

## Notes

- `__mocks__` directory and auto-mocking are not yet supported
- ESM modules use JavaScriptCore patches for live binding updates
- Use preload for mocks that need to prevent original module side effects

---

[1]: https://bun.sh/docs/test/mocks "Bun Mocks Documentation"
