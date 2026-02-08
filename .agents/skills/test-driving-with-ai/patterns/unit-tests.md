# Unit Test Patterns

## Overview

Unit tests verify individual functions or methods in isolation. They form the foundation of the testing pyramid and run fastest.

## Given/When/Then Structure

Structure tests to clearly separate setup, action, and verification:

```python
def test_should_expire_session_when_inactive_30_minutes():
    # Given: A session with last activity 31 minutes ago
    session = Session(last_activity=now() - minutes(31))

    # When: Checking if session is expired
    result = session.is_expired()

    # Then: Session should be marked as expired
    assert result is True
```

### Naming Convention

Test names should describe the expected behavior:
- `test_should_<expected_outcome>_when_<condition>`
- `test_<action>_returns_<result>_for_<input>`

## Boundary Value Testing

Test at the edges of valid ranges:

```python
# For a function accepting values 1-100
@pytest.mark.parametrize("value,expected", [
    (0, "invalid"),    # Just below minimum
    (1, "valid"),      # At minimum
    (2, "valid"),      # Just above minimum
    (99, "valid"),     # Just below maximum
    (100, "valid"),    # At maximum
    (101, "invalid"),  # Just above maximum
])
def test_validate_value_boundaries(value, expected):
    assert validate(value) == expected
```

### Common Boundaries to Test

| Type | Boundaries |
|------|------------|
| Numbers | 0, 1, -1, MAX_INT, MIN_INT |
| Strings | "", " ", very long strings |
| Collections | [], [single], [many] |
| Dates | epoch, now, far future, leap years |
| Nulls | None, undefined, missing key |

## Error Case Testing

Always test what happens when things go wrong:

```python
def test_should_raise_value_error_for_negative_amount():
    with pytest.raises(ValueError) as exc:
        process_payment(-100)

    assert "negative" in str(exc.value).lower()

def test_should_return_none_when_user_not_found():
    result = find_user("nonexistent-id")
    assert result is None
```

### Error Cases to Consider

- Invalid input types
- Null/None/undefined values
- Network timeouts
- Resource not found
- Permission denied
- Malformed data
- Concurrent modification

## Mocking Guidelines

Mock only external dependencies, not the code under test.

### Good Mocking

```python
# Mock external HTTP call
@patch('requests.get')
def test_fetches_user_from_api(mock_get):
    mock_get.return_value.json.return_value = {"name": "John"}

    result = fetch_user("123")

    assert result.name == "John"
    mock_get.assert_called_once_with("https://api.example.com/users/123")
```

### Bad Mocking (Avoid)

```python
# DON'T mock the function being tested
@patch('mymodule.calculate_tax')
def test_calculate_tax(mock_calc):
    mock_calc.return_value = 15.0
    result = calculate_tax(100, 0.15)  # Testing the mock, not the function!
    assert result == 15.0

# DON'T mock pure functions
@patch('utils.format_date')  # format_date is pure, no side effects
def test_display_user(mock_format):
    ...
```

### When to Mock

| Mock | Don't Mock |
|------|------------|
| HTTP clients | Pure functions |
| Database connections | Simple utilities |
| File system operations | The function being tested |
| External APIs | Domain logic |
| Time/randomness | In-memory data structures |

## Assertion Patterns

### Strong Assertions

```python
# Good: Specific value assertions
assert user.email == "test@example.com"
assert response.status_code == 201
assert len(items) == 3
assert items[0].name == "First"

# Bad: Weak existence checks
assert user.email  # Passes for any truthy value
assert "status" in response  # Doesn't verify the status
assert items  # Passes for any non-empty list
```

### Assertion Libraries

pytest provides rich assertions:
```python
# Approximate comparisons
assert result == pytest.approx(3.14159, rel=1e-5)

# Exception checking
with pytest.raises(ValueError, match="invalid.*format"):
    parse_date("not-a-date")

# Collection assertions
assert set(result) == {"a", "b", "c"}
```

## Test Independence

Each test should run independently:

```python
# Bad: Tests depend on execution order
def test_create_user():
    create_user("john@example.com")

def test_find_user():
    # Fails if test_create_user didn't run first
    user = find_user("john@example.com")
    assert user is not None

# Good: Each test creates its own data
def test_find_user_returns_created_user():
    user = create_user("john@example.com")
    found = find_user("john@example.com")
    assert found.id == user.id
```

## Prompt Template for Unit Tests

```
Write unit tests for this function:

FUNCTION:
[paste function]

REQUIREMENTS:
1. [requirement 1]
2. [requirement 2]

EDGE CASES TO TEST:
- [edge case 1]
- [edge case 2]

Use [framework] with Given/When/Then structure.
Include boundary values and error cases.
Do NOT mock the function being tested.
```
