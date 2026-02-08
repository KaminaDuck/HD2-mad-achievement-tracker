# Property-Based Testing Patterns

## Overview

Property-based testing specifies *properties* that should hold for all valid inputs, then automatically generates hundreds of test cases to find violations.

```python
# Example-based: Tests one specific case
def test_reverse():
    assert reverse([1, 2, 3]) == [3, 2, 1]

# Property-based: Tests an invariant across many inputs
@given(st.lists(st.integers()))
def test_reverse_involution(xs):
    assert reverse(reverse(xs)) == xs
```

## Common Property Types

### Roundtrip / Inverse

```python
# encode/decode should be inverse operations
@given(st.text())
def test_encode_decode_roundtrip(text):
    assert decode(encode(text)) == text

# serialize/deserialize
@given(st.dictionaries(st.text(), st.integers()))
def test_json_roundtrip(data):
    assert json.loads(json.dumps(data)) == data
```

### Idempotence

```python
# Applying operation twice should equal applying once
@given(st.lists(st.integers()))
def test_sort_is_idempotent(xs):
    assert sort(sort(xs)) == sort(xs)

@given(st.text())
def test_normalize_is_idempotent(text):
    assert normalize(normalize(text)) == normalize(text)
```

### Invariants

```python
# Sorting preserves length
@given(st.lists(st.integers()))
def test_sort_preserves_length(xs):
    assert len(sort(xs)) == len(xs)

# Sorting preserves elements
@given(st.lists(st.integers()))
def test_sort_preserves_elements(xs):
    assert sorted(sort(xs)) == sorted(xs)
```

### Commutativity

```python
# Order of arguments doesn't matter
@given(st.integers(), st.integers())
def test_add_is_commutative(a, b):
    assert add(a, b) == add(b, a)

@given(st.sets(st.integers()), st.sets(st.integers()))
def test_union_is_commutative(a, b):
    assert a.union(b) == b.union(a)
```

### Associativity

```python
# Grouping doesn't matter
@given(st.integers(), st.integers(), st.integers())
def test_add_is_associative(a, b, c):
    assert add(add(a, b), c) == add(a, add(b, c))
```

## Property Discovery with AI

LLMs can help identify properties from code or documentation:

### From Code Analysis

```
Given this function, what properties should hold for all valid inputs?

def merge_sorted(a: list[int], b: list[int]) -> list[int]:
    """Merge two sorted lists into one sorted list."""
    ...
```

Expected properties:
- Output is sorted if inputs are sorted
- `len(result) == len(a) + len(b)`
- Every element in result appears in either `a` or `b`
- Output contains all elements from both inputs

### From Existing Tests

```
These example tests exist:
- test_sort_empty: assert sort([]) == []
- test_sort_single: assert sort([1]) == [1]
- test_sort_reversed: assert sort([3,2,1]) == [1,2,3]

What property could cover all three?
```

Answer: `sort(xs)` should be a sorted permutation of `xs`

## Hypothesis (Python)

### Basic Usage

```python
from hypothesis import given, strategies as st, settings

@given(st.lists(st.integers(), min_size=1))
@settings(max_examples=500)
def test_max_is_in_list(xs):
    m = max(xs)
    assert m in xs
```

### Custom Strategies

```python
# Composite strategy for domain objects
@st.composite
def valid_order(draw):
    customer = draw(st.builds(Customer, id=st.integers(min_value=1)))
    items = draw(st.lists(
        st.builds(OrderItem, price=st.decimals(min_value=0.01, max_value=1000)),
        min_size=1,
        max_size=10
    ))
    return Order(customer=customer, items=items)

@given(valid_order())
def test_order_total_is_sum_of_items(order):
    assert order.total == sum(item.price for item in order.items)
```

### Stateful Testing

```python
from hypothesis.stateful import RuleBasedStateMachine, rule, invariant

class ShoppingCartMachine(RuleBasedStateMachine):
    def __init__(self):
        self.cart = ShoppingCart()
        self.expected_items = []

    @rule(item=st.builds(Item, name=st.text(), price=st.decimals(min_value=0.01)))
    def add_item(self, item):
        self.cart.add(item)
        self.expected_items.append(item)

    @rule()
    def clear_cart(self):
        self.cart.clear()
        self.expected_items.clear()

    @invariant()
    def item_count_matches(self):
        assert len(self.cart.items) == len(self.expected_items)

TestCart = ShoppingCartMachine.TestCase
```

## fast-check (JavaScript/TypeScript)

### Basic Usage

```typescript
import fc from 'fast-check';

test('reverse is involutive', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      const reversed = [...arr].reverse().reverse();
      return arr.every((val, idx) => val === reversed[idx]);
    })
  );
});
```

### Custom Arbitraries

```typescript
const validEmail = fc.tuple(
  fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789')),
  fc.constantFrom('gmail.com', 'example.org', 'test.io')
).map(([local, domain]) => `${local}@${domain}`);

test('email parsing roundtrip', () => {
  fc.assert(
    fc.property(validEmail, (email) => {
      const parsed = parseEmail(email);
      return formatEmail(parsed) === email;
    })
  );
});
```

## Common Pitfalls

### Overly Weak Properties

```python
# Bad: Passes for any function returning a list
@given(st.lists(st.integers()))
def test_sort_returns_list(xs):
    result = sort(xs)
    assert isinstance(result, list)

# Better: Verify sorting property
@given(st.lists(st.integers()))
def test_sort_is_ordered(xs):
    result = sort(xs)
    for i in range(len(result) - 1):
        assert result[i] <= result[i + 1]
```

### Properties Mirroring Implementation

```python
# Bad: Just recapitulates the implementation
@given(st.lists(st.integers()))
def test_my_sort(xs):
    expected = sorted(xs)  # Using reference implementation
    assert my_sort(xs) == expected
```

This tests compatibility, not correctness. If both have the same bug, the test passes.

### Floating Point Issues

```python
# Bad: Exact equality fails for floats
@given(st.floats(allow_nan=False))
def test_sqrt_squared(x):
    if x >= 0:
        assert sqrt(x) ** 2 == x  # Fails due to precision

# Better: Approximate comparison
@given(st.floats(min_value=0, max_value=1e10, allow_nan=False))
def test_sqrt_squared(x):
    assert abs(sqrt(x) ** 2 - x) < 1e-10
```

### Insufficient Generators

```python
# Bad: st.text() rarely produces valid emails
@given(st.text())
def test_parse_email(email):
    result = parse_email(email)
    ...

# Better: Custom generator for valid emails
@given(valid_email_strategy())
def test_parse_email_valid(email):
    result = parse_email(email)
    assert result is not None
```

## Integration with TDD

Property-based tests fit the TDD workflow:

1. **Red**: Write property describing expected behavior
2. **Green**: Implement to satisfy property
3. **Refactor**: Properties catch regressions

Properties serve as specifications that outlive implementation details.

## When to Use Property-Based Testing

### Good Fit

- Pure functions with clear mathematical properties
- Serialization/deserialization
- Data transformations
- State machines with known invariants
- Parsers and formatters

### Poor Fit

- External side effects (use mocks + example tests)
- Complex business logic without clear invariants
- UI behavior testing
- Tests requiring specific known scenarios

## Prompt Template for Property Discovery

```
Analyze this function and identify properties that should hold:

FUNCTION:
[paste function]

TYPE SIGNATURE:
[input types] -> [output types]

Consider:
1. Roundtrip/inverse properties
2. Idempotence
3. Invariants (length, membership, ordering)
4. Commutativity
5. Associativity
6. Relationships between inputs and outputs

Generate Hypothesis tests for identified properties.
```
