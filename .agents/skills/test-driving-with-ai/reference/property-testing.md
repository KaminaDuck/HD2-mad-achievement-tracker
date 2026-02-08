# Property-Based Testing with AI

## Overview

Property-based testing (PBT) differs from example-based testing by specifying *properties* that should hold for all valid inputs, then automatically generating hundreds or thousands of test cases to find violations.

Traditional example-based test:
```python
def test_reverse():
    assert reverse([1, 2, 3]) == [3, 2, 1]
```

Property-based test:
```python
@given(st.lists(st.integers()))
def test_reverse_involution(xs):
    assert reverse(reverse(xs)) == xs
```

The property version tests the invariant that reversing twice returns the original list, across randomly generated inputs. When a test fails, the framework *shrinks* the failing input to a minimal reproduction case.

AI changes PBT in two directions: using LLMs to discover and generate properties, and using PBT to validate AI-generated code. This document covers both.

---

## Property Discovery

### Manual Property Specification

Writing good properties is hard - it requires domain expertise. Common property types:

- Roundtrip/Inverse: `decode(encode(x)) == x` - the classic serialization test
- Idempotence: `f(f(x)) == f(x)`
- Invariants like `len(sorted(xs)) == len(xs)` - sorting shouldn't lose elements
- Commutativity: `f(a, b) == f(b, a)`
- Associativity: `f(f(a, b), c) == f(a, f(b, c))` - order of operations shouldn't matter

The challenge: identifying which properties matter for a given function. A sorting function should preserve length and elements, but knowing to check this requires understanding what sorting means.

### AI-Assisted Property Discovery

LLMs can infer properties from code, documentation, or a combination:

Given code to analyze:
```
Given this function, what properties should hold for all valid inputs?

def merge_sorted(a: list[int], b: list[int]) -> list[int]:
    """Merge two sorted lists into one sorted list."""
    ...
```

An LLM might suggest:
- Output is sorted if inputs are sorted
- `len(result) == len(a) + len(b)`
- Every element in result appears in either `a` or `b`
- Output contains all elements from both inputs

**From documentation and types:**
Docstrings, type annotations, and function names provide signals. A function named `encrypt` paired with one named `decrypt` suggests a roundtrip property.

**From existing tests:**
Given example-based tests, an LLM can generalize to properties:
```
These tests exist:
- test_sort_empty: assert sort([]) == []
- test_sort_single: assert sort([1]) == [1]
- test_sort_reversed: assert sort([3,2,1]) == [1,2,3]

What property could cover all three?
```

### Invariant Synthesis

LLMs can generate loop invariants for program verification. The InvBench benchmark (arXiv 2505) tested LLMs on synthesizing invariants for 486 benchmarks covering linear and non-linear arithmetic, arrays, and nested loops.

LLMs perform best with step-by-step reasoning and few-shot examples. Chain-of-thought prompting improved invariant generation compared to direct queries.

The BALI approach (Branch-Aware Loop Invariant Inference) uses abstract interpretation feedback to guide LLM invariant generation. This reduces hallucination of incorrect invariants.

---

## Property Generation

### Prompting for Properties

These prompt structures work well for property-based tests:

**Behavioral specification:**
```
Write Hypothesis properties for this function. Focus on:
1. What invariants should hold regardless of input?
2. What relationships exist between input and output?
3. What edge cases exist (empty, single element, large)?

Do not mirror the implementation logic.
```

**Negative properties:**
```
What properties should NOT hold? What inputs should raise exceptions?
```

**Shrink strategy guidance:**
```
The default shrinking may not find minimal cases for this domain.
Generate a custom shrink strategy that preserves [constraint].
```

### Common Pitfalls

**Overly weak properties:**
```python
@given(st.lists(st.integers()))
def test_sort_returns_list(xs):
    result = sort(xs)
    assert isinstance(result, list)  # Passes for any function returning a list
```

This property passes even if `sort` returns an empty list every time.

**Overly strong properties:**
```python
@given(st.integers())
def test_square_root(n):
    assert sqrt(n) * sqrt(n) == n  # Fails due to floating point
```

Floating-point arithmetic makes exact equality impossible. Use approximate comparisons.

**Properties that mirror implementation:**
```python
@given(st.lists(st.integers()))
def test_my_sort(xs):
    expected = sorted(xs)  # Using Python's sort to test your sort
    assert my_sort(xs) == expected
```

This tests compatibility with the reference, not correctness. If both implementations share a bug, the test passes.

**Insufficient generators:**
```python
@given(st.text())
def test_parse_email(email):
    # st.text() rarely produces valid email addresses
    result = parse_email(email)
    ...
```

Generic generators rarely produce inputs that exercise interesting code paths. Custom generators targeting the input domain almost always work better - generic ones miss the interesting cases.

---

## Fuzzing with AI

### Coverage-Guided Fuzzing

Traditional fuzzers like AFL generate random inputs and track which code paths are exercised. Inputs that reach new branches are kept and mutated further.

AI-guided fuzzing adds semantic awareness. Instead of random bit flips, an LLM can generate inputs that are syntactically valid for the target format (JSON, SQL, protocol buffers).

### Grammar-Aware Fuzzing

For structured inputs, grammar-aware fuzzing generates syntactically valid cases:

```python
# LLM-generated grammar for a configuration format
@st.composite
def config_strategy(draw):
    return {
        "version": draw(st.integers(min_value=1, max_value=3)),
        "enabled": draw(st.booleans()),
        "timeout_ms": draw(st.integers(min_value=0, max_value=60000)),
        "retries": draw(st.integers(min_value=0, max_value=10)),
    }
```

LLMs can generate these composite strategies from documentation or examples, reducing manual effort.

### Mutation Strategies

Beyond random generation, LLMs suggest targeted mutations:
- Integer overflow: "What inputs would trigger overflow?" - targets arithmetic edge cases
- Stack depth: "Generate inputs that maximize recursion"
- Boundary cases at the edge of valid/invalid

ThoughtWorks research notes that AI-assisted fuzzing combines traditional coverage metrics with semantic understanding of what inputs "mean."

---

## Integration Patterns

### PBT for Validating AI-Generated Code

Property-based tests catch bugs that example-based tests miss. One study on edge case detection found that EBT and PBT each caught about two-thirds of bugs individually, but combining both approaches pushed detection above 80%. The gains come from complementary coverage: PBT finds edge cases developers didn't anticipate, while EBT validates specific business logic.

**Workflow for AI-generated code:**

1. Human writes property-based specifications
2. AI generates implementation
3. PBT framework runs generated tests against implementation
4. Failures indicate bugs in generated code
5. Human reviews and refines

This inverts the typical pattern where AI generates tests for human code.

### Real Bug Discovery

Anthropic's research ran an agentic system using property-based testing against popular Python libraries. The agent:

1. Selected a function from the target library
2. Generated properties using Claude
3. Ran Hypothesis tests
4. Investigated failures to distinguish bugs from specification errors

The agent found real bugs, several now patched:
- NumPy's `random.wald` returned negative numbers (patch merged: numpy/numpy#29609)
- AWS Lambda Powertools `slice_dictionary()` returned first chunk repeatedly (merged)
- Tokenizers `EncodingVisualizer` generated invalid HSL CSS (merged)
- SciPy numerical stability issues
- Pandas type handling problems

The agent ran autonomously. Human review was needed only to confirm findings and submit patches.

### TDD Integration

Property-based testing fits TDD workflows:

1. **Red**: Write properties describing expected behavior
2. **Green**: Implement to satisfy properties (AI can assist here)
3. **Refactor**: Properties catch regressions during cleanup

Properties serve as specifications that outlive implementation details.

---

## Tool-Specific Guidance

### Hypothesis (Python)

```python
from hypothesis import given, strategies as st, settings

@given(st.lists(st.integers(), min_size=1))
@settings(max_examples=500)
def test_max_is_in_list(xs):
    m = max(xs)
    assert m in xs
```

Features:
- `@given` decorator with strategies
- `@settings` for configuration (examples, deadline, database)
- Built-in shrinking for minimal reproductions
- Stateful testing for sequences of operations

### fast-check (JavaScript/TypeScript)

```typescript
import fc from 'fast-check';

test('reverse is involutive', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), (arr) => {
      return isEqual(arr.reverse().reverse(), arr);
    })
  );
});
```

Features:
- `fc.property` for defining properties
- `fc.assert` for running tests
- Arbitraries for custom generators
- Async property support

### QuickCheck (Haskell, Erlang)

```haskell
prop_reverse_involutive :: [Int] -> Bool
prop_reverse_involutive xs = reverse (reverse xs) == xs
```

The original property-based testing library. Features:
- Type-driven generation
- Monadic generators for complex structures
- Shrinking built into the type system

---

## Limitations and Challenges

For comprehensive guidance on when AI-assisted testing is not appropriate, including security-critical, regulatory, and safety-critical contexts, see [when-not-to-use-ai-tests.md](when-not-to-use-ai-tests.md).

### Complex Domain Invariants

LLMs don't understand your business rules. Financial calculations, physics simulations, and regulatory compliance have invariants that aren't obvious from code alone - and getting them wrong matters.

**Mitigation:** Provide domain context explicitly. Include business rules, regulations, or mathematical definitions in prompts.

### Performance Properties

"This function should complete in O(n log n) time" is hard to express as a property. Timing-based tests are flaky.

**Mitigation:** Test proxy properties like "result for input size 1000 uses fewer comparisons than n^2."

### Concurrency Properties

Race conditions and deadlocks are stateful and timing-dependent. Standard PBT doesn't model concurrent execution.

**Mitigation:** Use stateful testing modes (Hypothesis's `RuleBasedStateMachine`) or dedicated concurrency testing tools.

### Oracle Problem

Properties need an oracle - a way to know if output is correct. For complex functions, the only oracle might be the implementation itself.

**Mitigation:** Test properties that don't require computing the full answer:
- "Output is sorted" doesn't require knowing the correct sort order
- "Output length equals input length" is checkable without knowing values
- "Operation is deterministic" just requires running twice

LLM-based test oracles can derive expected behavior from natural language specifications, but reliability varies. Financial and regulatory domains remain challenging.

---

## Sources

### Primary Sources

1. **Anthropic Research** - "Finding bugs across the Python ecosystem with Claude and property-based testing"
   https://red.anthropic.com/2026/property-based-testing/
   Paper: https://arxiv.org/abs/2510.09907
   *Agentic PBT system finding real bugs in NumPy, SciPy, Pandas, with merged patches*

2. **ACM Digital Library** - "From Prompts to Properties: Rethinking LLM Code Generation with Property-Based Testing"
   https://dl.acm.org/doi/abs/10.1145/3691620.3695026
   *Academic paper on using PBT to validate LLM-generated code*

3. **ResearchGate/arXiv** - "Understanding the Characteristics of LLM-Generated Property-Based Tests in Exploring Edge Cases"
   https://www.researchgate.net/publication/397040980
   arXiv: https://arxiv.org/abs/2510.25297
   *Tanaka et al., NAIST - Comparative study of PBT vs EBT for edge case detection*

4. **ThoughtWorks** - "Fuzzing in the AI Era"
   https://www.thoughtworks.com/insights/blog/technology-strategy/fuzzing-ai-era
   *Industry perspective on AI-assisted fuzzing*

### Academic Research

5. **arXiv InvBench** - "Can Large Language Models Synthesize Invariants for Program Verification?"
   https://arxiv.org/abs/2505.09546
   *Benchmark of LLMs on invariant synthesis*

6. **arXiv BALI** - "Branch-Aware Loop Invariant Inference with LLMs"
   https://arxiv.org/abs/2501.15834
   *Abstract interpretation feedback for LLM invariant generation*

7. **arXiv** - "Test Oracle Automation in the Era of Large Language Models" (Dantas et al.)
   https://arxiv.org/abs/2405.12766
   *Survey of LLM approaches to the test oracle problem*

### Tutorials and Documentation

8. **Hypothesis Documentation**
   https://hypothesis.readthedocs.io/en/latest/
   *Official Python PBT library documentation*

9. **ArjanCodes** - "Hypothesis Testing Tutorial"
   https://www.arjancodes.com/blog/python-hypothesis-testing/
   *Practical introduction with examples*

10. **Towards Data Science** - "Property-Based Testing with Hypothesis"
    https://towardsdatascience.com/property-based-testing-with-hypothesis/
    *Tutorial covering strategies and stateful testing*

---

## Internal References

- [ai-slop-tests.md](ai-slop-tests.md) - Line 311 mentions property-based assertions; Line 418 lists Hypothesis, fast-check as tools
- [tdd-research.md](tdd-research.md) - TDD workflows that complement property-based testing
- [prompt-engineering-tests.md](prompt-engineering-tests.md) - Prompt patterns for test generation including property-based approaches
