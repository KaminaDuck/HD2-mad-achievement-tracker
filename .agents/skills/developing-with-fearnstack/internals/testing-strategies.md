---
title: Testing Strategies
description: Comprehensive testing approach for Fearnstack applications
---

# Testing Strategies

This guide covers testing at every level of a Fearnstack application, from unit tests to end-to-end tests.

## Testing Philosophy

```
                    END-TO-END TESTS
                         ┌─┐
                        ┌┘ └┐
                       ┌┘   └┐
                      ┌┘     └┐     Few, slow, expensive
                     ┌┘       └┐
                    └─────────────┘
              INTEGRATION TESTS
                    ┌─────────────┐
                   ┌┘             └┐
                  ┌┘               └┐   Some, moderate
                 ┌┘                 └┐
                └───────────────────────┘
              UNIT TESTS
                ┌───────────────────────┐
               ┌┘                       └┐
              ┌┘                         └┐  Many, fast, cheap
             ┌┘                           └┐
            └───────────────────────────────────┘
```

1. **Unit tests**: Fast, isolated, test logic
2. **Integration tests**: Test component interactions
3. **E2E tests**: Test user flows in real browser

## Unit Testing

### Bun Test Runner

```typescript
// utils.test.ts
import { describe, it, expect } from "bun:test";
import { formatDate, calculateTotal } from "./utils";

describe("formatDate", () => {
  it("formats date correctly", () => {
    const date = new Date("2024-01-15");
    expect(formatDate(date)).toBe("Jan 15, 2024");
  });

  it("handles invalid dates", () => {
    expect(() => formatDate(null as any)).toThrow();
  });
});

describe("calculateTotal", () => {
  it("sums item prices", () => {
    const items = [{ price: 10 }, { price: 20 }];
    expect(calculateTotal(items)).toBe(30);
  });

  it("returns 0 for empty array", () => {
    expect(calculateTotal([])).toBe(0);
  });
});
```

### Testing Zod Schemas

```typescript
// schemas.test.ts
import { describe, it, expect } from "bun:test";
import { userSchema, createUserSchema } from "./schemas";

describe("userSchema", () => {
  it("validates correct data", () => {
    const result = userSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Alice",
      email: "alice@example.com",
      role: "user",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = userSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Alice",
      email: "not-an-email",
      role: "user",
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].path).toEqual(["email"]);
  });

  it("rejects invalid role", () => {
    const result = userSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "Alice",
      email: "alice@example.com",
      role: "superuser", // Not in enum
    });
    expect(result.success).toBe(false);
  });
});
```

## API Testing

### Hono Test Helpers

```typescript
// users.test.ts
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { testClient } from "hono/testing";
import app from "../index";

describe("Users API", () => {
  const client = testClient(app);

  describe("GET /api/users", () => {
    it("returns user list", async () => {
      const res = await client.api.users.$get();
      expect(res.status).toBe(200);

      const users = await res.json();
      expect(Array.isArray(users)).toBe(true);
    });

    it("supports pagination", async () => {
      const res = await client.api.users.$get({
        query: { page: "1", limit: "10" },
      });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/users", () => {
    it("creates user with valid data", async () => {
      const res = await client.api.users.$post({
        json: {
          name: "Test User",
          email: `test${Date.now()}@example.com`,
        },
      });
      expect(res.status).toBe(201);

      const user = await res.json();
      expect(user.name).toBe("Test User");
      expect(user.id).toBeDefined();
    });

    it("rejects invalid email", async () => {
      const res = await client.api.users.$post({
        json: {
          name: "Test",
          email: "invalid",
        },
      });
      expect(res.status).toBe(400);

      const error = await res.json();
      expect(error.details?.email).toBeDefined();
    });
  });

  describe("GET /api/users/:id", () => {
    it("returns user by id", async () => {
      // Create user first
      const createRes = await client.api.users.$post({
        json: { name: "Test", email: `test${Date.now()}@example.com` },
      });
      const created = await createRes.json();

      const res = await client.api.users[":id"].$get({
        param: { id: created.id },
      });
      expect(res.status).toBe(200);
    });

    it("returns 404 for non-existent user", async () => {
      const res = await client.api.users[":id"].$get({
        param: { id: "00000000-0000-0000-0000-000000000000" },
      });
      expect(res.status).toBe(404);
    });
  });
});
```

### Testing Middleware

```typescript
// auth.test.ts
import { describe, it, expect } from "bun:test";
import { Hono } from "hono";
import { authMiddleware } from "./middleware/auth";

describe("authMiddleware", () => {
  const app = new Hono()
    .use("/protected/*", authMiddleware)
    .get("/protected/data", (c) => c.json({ secret: "data" }))
    .get("/public", (c) => c.json({ public: true }));

  it("allows requests with valid token", async () => {
    const res = await app.request("/protected/data", {
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(200);
  });

  it("rejects requests without token", async () => {
    const res = await app.request("/protected/data");
    expect(res.status).toBe(401);
  });

  it("allows public routes", async () => {
    const res = await app.request("/public");
    expect(res.status).toBe(200);
  });
});
```

## Component Testing

### Testing Library Setup

```typescript
// test-utils.tsx
import { ReactNode } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(ui: ReactNode) {
  const queryClient = createTestQueryClient();

  return {
    ...render(
      <QueryClientProvider client={queryClient}>
        {ui}
      </QueryClientProvider>
    ),
    queryClient,
  };
}
```

### Testing with Query

```typescript
// UserList.test.tsx
import { describe, it, expect } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "./test-utils";
import { UserList } from "./UserList";

// Mock the API client
import { client } from "../lib/api";
jest.mock("../lib/api");

describe("UserList", () => {
  it("shows loading state", () => {
    (client.api.users.$get as jest.Mock).mockReturnValue(
      new Promise(() => {}) // Never resolves
    );

    renderWithProviders(<UserList />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("renders user list", async () => {
    (client.api.users.$get as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([
        { id: "1", name: "Alice", email: "alice@test.com" },
        { id: "2", name: "Bob", email: "bob@test.com" },
      ]),
    });

    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });
  });

  it("shows error state", async () => {
    (client.api.users.$get as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Failed to fetch" }),
    });

    renderWithProviders(<UserList />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });
});
```

### Testing Forms

```typescript
// CreateUserForm.test.tsx
import { describe, it, expect } from "bun:test";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "./test-utils";
import { CreateUserForm } from "./CreateUserForm";

describe("CreateUserForm", () => {
  it("validates required fields", async () => {
    renderWithProviders(<CreateUserForm />);

    const submitButton = screen.getByRole("button", { name: /submit/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  it("validates email format", async () => {
    renderWithProviders(<CreateUserForm />);

    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "not-an-email");
    await userEvent.tab(); // Blur to trigger validation

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
    });
  });

  it("submits valid form", async () => {
    const onSuccess = jest.fn();
    renderWithProviders(<CreateUserForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/name/i), "Alice");
    await userEvent.type(screen.getByLabelText(/email/i), "alice@test.com");
    await userEvent.click(screen.getByRole("button", { name: /submit/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
```

## End-to-End Testing

### Playwright Setup

```typescript
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Tests

```typescript
// e2e/users.spec.ts
import { test, expect } from "@playwright/test";

test.describe("User Management", () => {
  test("creates a new user", async ({ page }) => {
    await page.goto("/users");

    // Click create button
    await page.click('[data-testid="create-user-button"]');

    // Fill form
    await page.fill('[name="name"]', "E2E Test User");
    await page.fill('[name="email"]', `e2e${Date.now()}@test.com`);

    // Submit
    await page.click('[type="submit"]');

    // Verify success
    await expect(page.getByText("E2E Test User")).toBeVisible();
  });

  test("shows validation errors", async ({ page }) => {
    await page.goto("/users/create");

    // Submit empty form
    await page.click('[type="submit"]');

    // Verify errors
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/email is required/i)).toBeVisible();
  });

  test("navigates to user detail", async ({ page }) => {
    await page.goto("/users");

    // Click on first user
    await page.click('[data-testid="user-row"]:first-child');

    // Verify navigation
    await expect(page).toHaveURL(/\/users\/[a-z0-9-]+/);
    await expect(page.getByTestId("user-detail")).toBeVisible();
  });
});
```

### Testing AI Chat

```typescript
// e2e/chat.spec.ts
import { test, expect } from "@playwright/test";

test.describe("AI Chat", () => {
  test("sends message and receives response", async ({ page }) => {
    await page.goto("/chat");

    // Type message
    await page.fill('[name="message"]', "Hello, how are you?");
    await page.click('[type="submit"]');

    // Wait for response (streaming may take time)
    await expect(page.locator(".assistant-message")).toBeVisible({
      timeout: 30000,
    });
  });
});
```

## Mocking Strategies

### MSW for API Mocking

```typescript
// mocks/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/users", () => {
    return HttpResponse.json([
      { id: "1", name: "Mock User", email: "mock@test.com" },
    ]);
  }),

  http.post("/api/users", async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json(
      { id: "new-id", ...data },
      { status: 201 }
    );
  }),
];

// mocks/server.ts
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);

// test setup
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## CI/CD Integration

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

      - name: Install dependencies
        run: bun install

      - name: Run unit tests
        run: bun test

      - name: Run type check
        run: bun run typecheck

      - name: Install Playwright
        run: bunx playwright install --with-deps

      - name: Run E2E tests
        run: bunx playwright test

      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: test-results
          path: test-results/
```

## Testing Checklist

| Test Type | What to Test | Tools |
|-----------|--------------|-------|
| Unit | Utilities, schemas | Bun test |
| Unit | Business logic | Bun test |
| API | Endpoints, validation | Hono testClient |
| API | Middleware | Hono test |
| Component | Rendering, state | Testing Library |
| Component | User interactions | userEvent |
| E2E | User flows | Playwright |
| E2E | Cross-browser | Playwright |

## Related Docs

- [Bun Testing](../domains/runtime/bun-testing.md) - Test runner
- [Hono Fundamentals](../domains/backend/hono-fundamentals.md) - API testing
- [TanStack Form](../domains/frontend/tanstack-form.md) - Form testing
