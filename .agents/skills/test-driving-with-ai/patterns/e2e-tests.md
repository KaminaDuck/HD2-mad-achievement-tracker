# E2E Test Patterns

## Overview

End-to-end tests verify complete user journeys through the application. They test the system as a whole, from user interface to backend services.

## User Journey Testing

Structure E2E tests around real user workflows:

```javascript
describe('User Registration Journey', () => {
  it('should complete registration and land on dashboard', async () => {
    // Navigate to registration
    await page.goto('/register');

    // Fill registration form
    await page.fill('[name="email"]', 'newuser@example.com');
    await page.fill('[name="password"]', 'SecurePass123!');
    await page.fill('[name="confirmPassword"]', 'SecurePass123!');

    // Submit and verify redirect
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Verify welcome message
    await expect(page.locator('h1')).toContainText('Welcome');
  });
});
```

### Journey Decomposition

Break complex journeys into logical steps:

| Journey: Checkout |
|-------------------|
| 1. Add items to cart |
| 2. View cart and verify items |
| 3. Proceed to checkout |
| 4. Enter shipping information |
| 5. Enter payment information |
| 6. Review and confirm order |
| 7. Verify order confirmation |

## Natural Language Specifications

Modern frameworks support natural language test definitions:

### Given/When/Then Format

```gherkin
Feature: User Authentication

Scenario: Successful login
  Given I am on the login page
  When I enter valid credentials
  And I click the login button
  Then I should be redirected to the dashboard
  And I should see my username in the header

Scenario: Failed login with wrong password
  Given I am on the login page
  When I enter my email with an incorrect password
  And I click the login button
  Then I should see an error message "Invalid credentials"
  And I should remain on the login page
```

### AI-Powered Natural Language

With agentic testing tools, tests can be even more natural:

```
"Complete checkout using a credit card and verify order confirmation message."

The agent:
1. Identifies the checkout button visually
2. Locates credit card input fields
3. Confirms action with success message
4. No brittle selectors needed
```

## Visual Testing

### Snapshot-Based Visual Testing

```javascript
it('renders product page correctly', async () => {
  await page.goto('/products/widget-123');

  // Compare against baseline screenshot
  await expect(page).toHaveScreenshot('product-page.png', {
    threshold: 0.1  // Allow 10% pixel difference
  });
});
```

### Visual Language Model (VLM) Testing

VLMs "see" the UI like humans do:

```
Traditional: Find element by XPath/CSS selector
VLM-powered: "Click the shopping cart icon"

Benefits:
- UI refactors don't break tests
- Handles contextual instructions: "Click Delete next to John Doe"
- Same test runs across web, mobile, desktop
```

### When to Use Visual Testing

| Use Case | Approach |
|----------|----------|
| Design consistency | Snapshot comparison |
| Cross-browser rendering | Visual diff tools (Applitools, Percy) |
| Dynamic content layout | VLM-based validation |
| Accessibility compliance | Specialized accessibility tools |

## Agentic E2E Testing

AI agents can autonomously explore and test applications:

### Self-Healing Locators

When UI elements shift, AI-powered tools adapt:

```yaml
# Traditional: Breaks when class changes
selector: ".btn-primary.submit-form"

# Self-healing: Multiple fallback strategies
selectors:
  - text: "Submit"
  - role: button
  - data-testid: "submit-btn"
  - visual: "blue button at bottom of form"
```

### Autonomous Exploration

Agents can discover issues without predefined scripts:

```yaml
# Let agent explore the application
exploration:
  start_url: "/app"
  depth: 3
  actions:
    - click buttons and links
    - fill forms with valid data
    - look for error states
    - report anomalies
```

## E2E Test Best Practices

### Test Data Isolation

```javascript
beforeEach(async () => {
  // Create isolated test user
  testUser = await api.createUser({
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!'
  });
});

afterEach(async () => {
  // Clean up test data
  await api.deleteUser(testUser.id);
});
```

### Waiting Strategies

```javascript
// Bad: Fixed waits
await page.waitForTimeout(5000);  // Flaky and slow

// Good: Wait for specific conditions
await page.waitForSelector('[data-loaded="true"]');
await expect(page.locator('.spinner')).toBeHidden();
await page.waitForResponse(resp => resp.url().includes('/api/data'));
```

### Parallel Execution

```javascript
// playwright.config.js
module.exports = {
  workers: 4,  // Run 4 tests in parallel
  fullyParallel: true,

  // Isolate browser contexts
  use: {
    browserName: 'chromium',
    headless: true,
  }
};
```

## E2E Test Anti-Patterns

### Avoid: Selector Fragility

```javascript
// Bad: Brittle CSS selectors
await page.click('div.container > div:nth-child(2) > button.btn-primary');

// Good: Semantic selectors
await page.click('button[data-testid="submit-order"]');
await page.getByRole('button', { name: 'Submit Order' }).click();
```

### Avoid: Test Interdependence

```javascript
// Bad: Tests depend on each other
it('creates order', async () => { /* creates order 123 */ });
it('views order', async () => { /* assumes order 123 exists */ });

// Good: Each test is self-contained
it('views created order', async () => {
  const order = await createTestOrder();
  await page.goto(`/orders/${order.id}`);
  await expect(page.locator('.order-status')).toContainText('Pending');
});
```

### Avoid: Testing Implementation Details

```javascript
// Bad: Testing internal state
expect(localStorage.getItem('auth_token')).toBeTruthy();

// Good: Testing user-visible behavior
await expect(page.locator('.user-menu')).toContainText(username);
```

## When to Use E2E Tests

### Good Fit

- Critical user journeys (checkout, signup, core workflows)
- Smoke tests to verify deployment
- Cross-browser/device compatibility
- Integration between frontend and backend

### Poor Fit

- Testing individual function logic (use unit tests)
- Performance testing (E2E adds overhead)
- Testing edge cases in business logic (use unit/integration tests)
- Tests requiring sub-second feedback (E2E is slow)

## CI/CD Integration

### Smoke Testing on Every PR

```yaml
e2e-smoke:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run smoke tests
      run: npx playwright test --grep @smoke
```

### Full E2E on Nightly

```yaml
e2e-full:
  schedule:
    - cron: '0 2 * * *'  # 2 AM daily
  steps:
    - name: Run full E2E suite
      run: npx playwright test
    - name: Upload report
      uses: actions/upload-artifact@v4
      with:
        name: playwright-report
        path: playwright-report/
```

## Prompt Template for E2E Tests

```
Write E2E tests for this user journey:

JOURNEY: [Description of user goal]

STEPS:
1. [Step 1]
2. [Step 2]
3. [Step 3]

EXPECTED OUTCOMES:
- [What user should see at end]
- [Side effects to verify]

ERROR SCENARIOS:
- [What if step X fails]
- [What if network is slow]

Use [Playwright/Cypress] with semantic selectors.
Include proper wait strategies.
Ensure test is self-contained and isolated.
```
