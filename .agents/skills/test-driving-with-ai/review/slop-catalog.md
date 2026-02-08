# AI Slop Test Catalog

## Overview

AI-generated tests often pass but catch nothing. These "slop tests" create a safety illusion - coverage metrics climb while actual defect detection plummets.

This catalog documents common slop patterns, how to detect them, and how to fix them.

## The Core Problem

AI treats your buggy code as the source of truth. When your implementation contains a bug, AI-generated tests document that bug as expected behavior.

**Statistics:**
- Only **0.4%** of AI-generated tests provide genuine verification
- Test suites show **84%** coverage but only **46%** mutation score
- LLM-generated tests achieve only **20.32%** mutation scores on complex functions

---

## Pattern 1: Mock Abuse

### Infinite Mock Loop

```python
# SLOP: Tests the mock, not the function
def test_payment_success():
    mock_processor.process.return_value = {"status": "success"}
    result = process_payment(mock_processor, 100)
    assert result["status"] == "success"  # Asserts what was mocked!
```

This test verifies the mock setup, not actual behavior. It passes even if `process_payment` is completely broken.

### Mocking the Subject Under Test

```python
# SLOP: Mocking the function being tested
@patch('mymodule.calculate_tax')
def test_calculate_tax(mock_calc):
    mock_calc.return_value = 15.0
    result = calculate_tax(100, 0.15)  # Calling the mock!
    assert result == 15.0
```

### Unnecessary Pure Function Mocking

```python
# SLOP: format_date is pure, no side effects
@patch('utils.format_date')
def test_user_display(mock_format):
    mock_format.return_value = "Jan 1, 2025"
    # Test continues with mocked pure function
```

### Detection Signals

- Mock count exceeds assertion count
- Mocked values appear verbatim in assertions
- Pure functions are being mocked
- More `@patch` decorators than test methods

### Fix

Remove circular mocking. Keep mocks only for external dependencies:

```python
# GOOD: Mock external dependency, assert real behavior
@patch('requests.post')
def test_payment_calls_api(mock_post):
    mock_post.return_value.json.return_value = {"status": "success"}

    result = process_payment(amount=100)

    mock_post.assert_called_once_with(
        "https://api.payment.com/charge",
        json={"amount": 100}
    )
    assert result.confirmed is True
```

---

## Pattern 2: Tautological Assertions

### Self-Referential Assertions

```python
# SLOP: Asserts a variable equals itself
def test_payment():
    status = "success"
    response = {"status": status}
    assert response["status"] == "success"  # Tautology
```

### Asserting Constructed Values

```python
# SLOP: Asserts what was just assigned
def test_user_creation():
    user = {"name": "John", "email": "john@example.com"}
    assert user["name"] == "John"  # Tests dictionary creation, not function
```

### Detection Signals

- Assertions compare values to themselves
- Expected values are constructed in the same test
- No function under test is called

### Fix

Call the actual function and verify its behavior:

```python
# GOOD: Call function and verify output
def test_user_creation():
    user = create_user("john@example.com", "John")
    assert user.name == "John"
    assert user.email == "john@example.com"
    assert user.id is not None  # Verify generated values
```

---

## Pattern 3: Existence-Only Checks

### Weak Assertions

```python
# SLOP: Only checks field exists, not its value
def test_user_creation():
    user = create_user("john@example.com")
    assert "email" in user
    assert "created_at" in user
```

This passes even if email is "WRONG@BROKEN.COM".

### Type-Only Checks

```python
# SLOP: Just checks type, not content
assert isinstance(result, list)
assert len(result) > 0
```

### Detection Signals

- `in` operator without value check
- `isinstance` without content verification
- `len(x) > 0` without element inspection
- `is not None` without value assertion

### Fix

Assert specific values:

```python
# GOOD: Validate actual values
def test_user_creation():
    user = create_user("john@example.com")
    assert user["email"] == "john@example.com"
    assert user["created_at"] <= datetime.now()
```

---

## Pattern 4: Implementation Mirroring

### Recapitulating Logic

```python
# The implementation
def calculate_total(items):
    return sum(item.price * item.quantity for item in items)

# SLOP: Just rewrites the implementation
def test_calculate_total():
    items = [Item(price=10, quantity=2), Item(price=5, quantity=3)]
    expected = sum(item.price * item.quantity for item in items)
    assert calculate_total(items) == expected
```

### Detection Signals

- Test logic mirrors implementation logic
- Same algorithm appears in test and code
- Changes to implementation require identical changes to test

### Fix

Test observable behavior with known values:

```python
# GOOD: Known inputs, known outputs
def test_calculate_total():
    items = [
        Item(price=10, quantity=2),  # 20
        Item(price=5, quantity=3)    # 15
    ]
    assert calculate_total(items) == 35
```

---

## Pattern 5: Happy Path Only

### Missing Error Cases

```python
# SLOP: Only tests success scenario
def test_user_login():
    result = login("valid@email.com", "correctpassword")
    assert result.success is True
```

### Detection Signals

- No tests for invalid inputs
- No tests for error conditions
- No tests for edge cases
- All tests expect success

### Fix

Add error and edge case tests:

```python
# GOOD: Include failure scenarios
def test_login_with_wrong_password():
    result = login("valid@email.com", "wrongpassword")
    assert result.success is False
    assert "invalid credentials" in result.error.lower()

def test_login_with_nonexistent_user():
    result = login("notauser@email.com", "anypassword")
    assert result.success is False

def test_login_rate_limiting():
    for _ in range(10):
        login("user@email.com", "wrong")
    result = login("user@email.com", "wrong")
    assert result.error == "rate limited"
```

---

## Pattern 6: Copy-Paste Variations

### Redundant Tests

```python
# SLOP: Tests nothing new after the first one
def test_user_name_john(): assert User("John").name == "John"
def test_user_name_jane(): assert User("Jane").name == "Jane"
def test_user_name_bob(): assert User("Bob").name == "Bob"
# ... 50 more variations
```

### Detection Signals

- Multiple tests with nearly identical structure
- Only data values change between tests
- No new behavior is tested

### Fix

Use parameterized tests or test unique behaviors:

```python
# GOOD: Parameterized test
@pytest.mark.parametrize("name", ["John", "Jane", "Bob"])
def test_user_name(name):
    assert User(name).name == name

# EVEN BETTER: Test interesting cases
def test_user_name_with_unicode():
    assert User("Jose").name == "Jose"

def test_user_name_empty_raises():
    with pytest.raises(ValueError):
        User("")
```

---

## Pattern 7: Variable Amnesia

### Semantic Drift in Long Tests

```python
# SLOP: Variable name changes mid-test
def test_complex_workflow():
    user_account = User(id=1)
    # ... many lines later ...
    assert client_account.balance == 100  # NameError!
```

LLMs generate text probabilistically. In long tests, they may "forget" earlier variable names.

### Detection Signals

- NameError in tests
- Variables referenced but never defined
- Inconsistent naming within a test

### Fix

Keep tests short and focused. Review for consistency.

---

## Quick Detection Checklist

When reviewing AI-generated tests, check:

| Check | Question | If Yes |
|-------|----------|--------|
| Mock abuse | Do assertions verify mocked values? | REWRITE |
| Tautology | Does test assert what it just created? | REWRITE |
| Existence | Only checking if keys/fields exist? | STRENGTHEN |
| Mirroring | Does test recapitulate implementation? | REWRITE |
| Happy path | Are error cases missing? | ADD TESTS |
| Redundancy | Are tests near-duplicates? | CONSOLIDATE |

## Prevention: Prompt Techniques

### Specify Behavior, Not Implementation

```
BAD: "Write tests for this function"

GOOD:
"Write tests verifying these REQUIREMENTS:
1. Returns sorted list
2. Raises ValueError for empty input
3. Handles duplicates correctly

Do NOT mirror the implementation logic."
```

### Request Negative Cases

```
"Include tests for:
- Invalid input types
- Empty inputs
- Boundary values
- Error conditions
- Concurrent access"
```

### Context Isolation

Run test generation from isolated directories to prevent AI from "peeking" at implementation code.
