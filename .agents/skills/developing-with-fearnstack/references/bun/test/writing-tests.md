---
title: "Bun Writing Tests"
description: "Write tests using Bun's Jest-compatible API with async tests, timeouts, modifiers, and matchers"
type: "api-reference"
tags: ["bun", "test", "jest", "matchers", "async", "parametrized", "assertions"]
category: "typescript"
subcategory: "test"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Writing Tests Documentation"
    url: "https://bun.sh/docs/test/writing-tests"
related:
  - "../README.md"
  - "./overview.md"
  - "./mocks.md"
author: "unknown"
contributors: []
---

# Bun Writing Tests

Define tests with a Jest-like API imported from the built-in `bun:test` module. ([Bun Docs][1])

## Basic Usage

```typescript
import { expect, test } from "bun:test";

test("2 + 2", () => {
  expect(2 + 2).toBe(4);
});
```

## Grouping Tests

```typescript
import { expect, test, describe } from "bun:test";

describe("arithmetic", () => {
  test("2 + 2", () => {
    expect(2 + 2).toBe(4);
  });

  test("2 * 2", () => {
    expect(2 * 2).toBe(4);
  });
});
```

## Async Tests

### Using async/await

```typescript
import { expect, test } from "bun:test";

test("2 * 2", async () => {
  const result = await Promise.resolve(2 * 2);
  expect(result).toEqual(4);
});
```

### Using done callback

```typescript
import { expect, test } from "bun:test";

test("2 * 2", done => {
  Promise.resolve(2 * 2).then(result => {
    expect(result).toEqual(4);
    done();
  });
});
```

## Timeouts

```typescript
import { test } from "bun:test";

test("slow operation", async () => {
  const data = await slowOperation();
  expect(data).toBe(42);
}, 500); // test must run in <500ms
```

Default timeout is 5000ms.

## Retries and Repeats

### `test.retry`

```typescript
import { test } from "bun:test";

test(
  "flaky network request",
  async () => {
    const response = await fetch("https://example.com/api");
    expect(response.ok).toBe(true);
  },
  { retry: 3 }
);
```

### `test.repeats`

```typescript
import { test } from "bun:test";

test(
  "ensure test is stable",
  () => {
    expect(Math.random()).toBeLessThan(1);
  },
  { repeats: 20 } // Runs 21 times total (1 initial + 20 repeats)
);
```

## Test Modifiers

### `test.skip`

```typescript
import { expect, test } from "bun:test";

test.skip("wat", () => {
  expect(0.1 + 0.2).toEqual(0.3);
});
```

### `test.todo`

```typescript
import { expect, test } from "bun:test";

test.todo("fix this", () => {
  myTestFunction();
});
```

Run todo tests:

```bash
bun test --todo
```

### `test.only`

```typescript
import { test, describe } from "bun:test";

test("test #1", () => {}); // does not run

test.only("test #2", () => {}); // runs

describe.only("only", () => {
  test("test #3", () => {}); // runs
});
```

Run with:

```bash
bun test --only
```

### `test.if`

```typescript
const macOS = process.platform === "darwin";

test.if(macOS)("runs on macOS", () => {
  // runs if macOS
});
```

### `test.skipIf`

```typescript
const macOS = process.platform === "darwin";

test.skipIf(macOS)("runs on non-macOS", () => {
  // runs if *not* macOS
});
```

### `test.todoIf`

```typescript
const macOS = process.platform === "darwin";

test.todoIf(macOS)("runs on posix", () => {
  // TODO: only implemented for Linux
});
```

### `test.failing`

```typescript
// Will pass because the test is failing as expected
test.failing("math is broken", () => {
  expect(0.1 + 0.2).toBe(0.3);
});

// Will fail with a message that the test is now passing
test.failing("fixed bug", () => {
  expect(1 + 1).toBe(2);
});
```

## Conditional Describe Blocks

```typescript
const isMacOS = process.platform === "darwin";

describe.if(isMacOS)("macOS-specific features", () => {
  test("feature A", () => {});
  test("feature B", () => {});
});

describe.skipIf(process.platform === "win32")("Unix features", () => {
  test("feature C", () => {});
});

describe.todoIf(process.platform === "linux")("Upcoming Linux support", () => {
  test("feature D", () => {});
});
```

## Parametrized Tests

### `test.each`

```typescript
const cases = [
  [1, 2, 3],
  [3, 4, 7],
];

test.each(cases)("%p + %p should be %p", (a, b, expected) => {
  expect(a + b).toBe(expected);
});
```

### `describe.each`

```typescript
describe.each([
  [1, 2, 3],
  [3, 4, 7],
])("add(%i, %i)", (a, b, expected) => {
  test(`returns ${expected}`, () => {
    expect(a + b).toBe(expected);
  });
});
```

### Argument Passing

```typescript
// Array items passed as individual arguments
test.each([
  [1, 2, 3],
  [4, 5, 9],
])("add(%i, %i) = %i", (a, b, expected) => {
  expect(a + b).toBe(expected);
});

// Object items passed as a single argument
test.each([
  { a: 1, b: 2, expected: 3 },
  { a: 4, b: 5, expected: 9 },
])("add($a, $b) = $expected", data => {
  expect(data.a + data.b).toBe(data.expected);
});
```

### Format Specifiers

| Specifier | Description |
|-----------|-------------|
| `%p` | pretty-format |
| `%s` | String |
| `%d` | Number |
| `%i` | Integer |
| `%f` | Floating point |
| `%j` | JSON |
| `%o` | Object |
| `%#` | Index of the test case |
| `%%` | Single percent sign (%) |

## Assertion Counting

### `expect.hasAssertions()`

```typescript
test("async work calls assertions", async () => {
  expect.hasAssertions();

  const data = await fetchData();
  expect(data).toBeDefined();
});
```

### `expect.assertions(count)`

```typescript
test("exactly two assertions", () => {
  expect.assertions(2);

  expect(1 + 1).toBe(2);
  expect("hello").toContain("ell");
});
```

## Type Testing

### `expectTypeOf`

```typescript
import { expectTypeOf } from "bun:test";

// Basic type assertions
expectTypeOf<string>().toEqualTypeOf<string>();
expectTypeOf(123).toBeNumber();
expectTypeOf("hello").toBeString();

// Object type matching
expectTypeOf({ a: 1, b: "hello" }).toMatchObjectType<{ a: number }>();

// Function types
function greet(name: string): string {
  return `Hello ${name}`;
}

expectTypeOf(greet).toBeFunction();
expectTypeOf(greet).parameters.toEqualTypeOf<[string]>();
expectTypeOf(greet).returns.toEqualTypeOf<string>();

// Array and Promise types
expectTypeOf([1, 2, 3]).items.toBeNumber();
expectTypeOf(Promise.resolve(42)).resolves.toBeNumber();
```

Run TypeScript to verify: `bunx tsc --noEmit`

## Matchers

### Basic Matchers

| Matcher | Description |
|---------|-------------|
| `.not` | Negates the matcher |
| `.toBe()` | Strict equality |
| `.toEqual()` | Deep equality |
| `.toBeNull()` | Is null |
| `.toBeUndefined()` | Is undefined |
| `.toBeNaN()` | Is NaN |
| `.toBeDefined()` | Is defined |
| `.toBeFalsy()` | Is falsy |
| `.toBeTruthy()` | Is truthy |
| `.toStrictEqual()` | Strict deep equality |

### String and Array Matchers

| Matcher | Description |
|---------|-------------|
| `.toContain()` | Contains value |
| `.toHaveLength()` | Has length |
| `.toMatch()` | Matches regex |
| `.toContainEqual()` | Contains equal value |
| `.stringContaining()` | Contains substring |
| `.stringMatching()` | Matches string regex |
| `.arrayContaining()` | Contains array values |

### Object Matchers

| Matcher | Description |
|---------|-------------|
| `.toHaveProperty()` | Has property |
| `.toMatchObject()` | Matches object shape |
| `.toContainAllKeys()` | Contains all keys |
| `.toContainValue()` | Contains value |
| `.objectContaining()` | Contains object shape |

### Number Matchers

| Matcher | Description |
|---------|-------------|
| `.toBeCloseTo()` | Approximately equal |
| `.toBeGreaterThan()` | Greater than |
| `.toBeGreaterThanOrEqual()` | Greater than or equal |
| `.toBeLessThan()` | Less than |
| `.toBeLessThanOrEqual()` | Less than or equal |

### Function and Class Matchers

| Matcher | Description |
|---------|-------------|
| `.toThrow()` | Throws error |
| `.toBeInstanceOf()` | Is instance of |

### Promise Matchers

| Matcher | Description |
|---------|-------------|
| `.resolves()` | Promise resolves to |
| `.rejects()` | Promise rejects with |

### Mock Function Matchers

| Matcher | Description |
|---------|-------------|
| `.toHaveBeenCalled()` | Was called |
| `.toHaveBeenCalledTimes()` | Called n times |
| `.toHaveBeenCalledWith()` | Called with args |
| `.toHaveBeenLastCalledWith()` | Last called with |
| `.toHaveBeenNthCalledWith()` | Nth call with |
| `.toHaveReturned()` | Returned |
| `.toHaveReturnedWith()` | Returned value |

### Snapshot Matchers

| Matcher | Description |
|---------|-------------|
| `.toMatchSnapshot()` | Matches snapshot |
| `.toMatchInlineSnapshot()` | Matches inline snapshot |
| `.toThrowErrorMatchingSnapshot()` | Error matches snapshot |

## Best Practices

### Use Descriptive Test Names

```typescript
// Good
test("should calculate total price including tax for multiple items", () => {});

// Avoid
test("price calculation", () => {});
```

### Group Related Tests

```typescript
describe("User authentication", () => {
  describe("with valid credentials", () => {
    test("should return user data", () => {});
    test("should set authentication token", () => {});
  });

  describe("with invalid credentials", () => {
    test("should throw authentication error", () => {});
  });
});
```

### Use Appropriate Matchers

```typescript
// Good: Use specific matchers
expect(users).toHaveLength(3);
expect(user.email).toContain("@");
expect(response.status).toBeGreaterThanOrEqual(200);

// Avoid: Using toBe for everything
expect(users.length === 3).toBe(true);
```

### Test Error Conditions

```typescript
test("should throw error for invalid input", () => {
  expect(() => {
    validateEmail("not-an-email");
  }).toThrow("Invalid email format");
});

test("should handle async errors", async () => {
  await expect(async () => {
    await fetchUser("invalid-id");
  }).rejects.toThrow("User not found");
});
```

### Use Setup and Teardown

```typescript
import { beforeEach, afterEach, test } from "bun:test";

let testUser;

beforeEach(() => {
  testUser = createTestUser();
});

afterEach(() => {
  cleanupTestUser(testUser);
});

test("should update user profile", () => {
  // Use testUser in test
});
```

---

[1]: https://bun.sh/docs/test/writing-tests "Bun Writing Tests Documentation"
