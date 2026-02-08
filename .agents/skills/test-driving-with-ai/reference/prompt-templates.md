# Prompt Engineering for AI-Assisted Testing

## Overview

The quality of AI-generated tests depends directly on the quality of prompts used to generate them. Vague prompts produce the "slop tests" documented in [ai-slop-tests.md](ai-slop-tests.md): tests that pass but catch nothing, assertions that verify mock setups rather than behavior, and coverage theater that creates a safety illusion.

This document covers prompt engineering patterns for the full test lifecycle: generation, review, refactoring, and maintenance.

Per research from the Cypress Copilot study (IEEE Access, 2025), teams using structured prompting techniques reported up to 65% reduction in test automation development time and maintainability ratings of 8.2/10 from senior engineers. The key difference between bad prompts and good prompts is often 10x in output quality.

---

## Core Principles

### Specify Behavior, Not Implementation

The most common prompting mistake is describing what code does rather than what it should do. AI treats your code as the source of truth. When your implementation contains a bug, a prompt that says "write tests for this function" will document that bug as expected behavior.

**Bad: Implementation-focused**
```
Write tests for this UserList component
```

**Good: Behavior-focused**
```
Write tests verifying these REQUIREMENTS for a UserList component:

EXPECTED BEHAVIOR:
1. Shows "Loading users..." initially
2. HIDES loading spinner after successful fetch
3. Displays user cards with name, email, phone
4. Shows error message if fetch fails
5. Empty user list should hide loading spinner

Write tests that verify EXPECTED BEHAVIOR above, not just what
the code currently does.
```

The good prompt specifies observable outcomes. If the implementation fails to hide the loading spinner after fetch, the test should fail, not document the bug.

### Explicit Constraint Enumeration

AI will not generate negative tests, edge cases, or boundary conditions unless explicitly requested. AI-generated tests heavily favor happy-path scenarios, leaving error handling, timeouts, and invalid inputs untested.

Enumerate explicitly:
- Boundary values (min, max, off-by-one)
- Error conditions: timeouts, malformed responses, permission denied
- Edge cases like empty inputs, null values, and concurrent operations
- What happens during state transitions, not just before/after

**Example: Explicit edge cases**
```
EDGE CASES TO TEST:
- Network timeout scenarios (5s+ delays)
- Malformed API responses (missing fields, wrong types)
- Component unmounting during active fetch
- Empty user list (0 users)
- Large user list (1000+ users, pagination behavior)
- Concurrent fetch requests (race conditions)
```

### Context Management and Isolation

Context pollution is a major source of poor AI test output. Per the Elite AI-Assisted Coding guide, running test generation sessions from isolated directories prevents AI from "peeking" at existing implementation code.

**Technique: Phase separation**
- Phase 1: Generate tests in isolated test directory, with only specifications as context
- Phase 2: Switch to project root for implementation against those tests

This forces AI to rely on behavioral specifications rather than reverse-engineering implementation details. The result: tests that verify intended behavior, not accidental behavior.

For TDD workflows specifically, see the context isolation technique documented in [tdd-research.md](tdd-research.md).

### Iterative Refinement

AI-generated tests are drafts, not final products. The most effective workflow treats generation as step one of a multi-step process:

1. Generate initial tests from behavioral specifications
2. Run mutation testing to identify weak assertions
3. Feed surviving mutants back to AI for targeted improvements
4. Human review for business logic correctness
5. Repeat until mutation score hits 70%+

---

## Test Generation Prompts

### Structural Patterns

#### EXPECTED BEHAVIOR Format

This format, adapted from the prompt techniques originally in [ai-slop-tests.md](ai-slop-tests.md), produces consistently better test quality:

```
Write unit tests covering these requirements for [component/function]:

EXPECTED BEHAVIOR:
1. [Observable outcome 1]
2. [Observable outcome 2]
3. [Observable outcome 3]

EDGE CASES TO TEST:
- [Edge case 1]
- [Edge case 2]
- [Edge case 3]

Write tests that verify EXPECTED BEHAVIOR above, not just what
the code currently does.

Implementation:
[code here]
```

#### Given/When/Then Specification

For BDD-style test generation, particularly effective with Cypress, Playwright, and other E2E frameworks:

```
Generate test cases for [feature] using Given/When/Then format:

Feature: [Feature name]

Scenario: [Happy path scenario]
  Given [precondition]
  When [action]
  Then [expected outcome]

Scenario: [Error scenario]
  Given [precondition]
  When [error-triggering action]
  Then [error handling behavior]

Include both positive and negative scenarios. For each scenario,
generate executable test code using [framework].
```

#### Boundary Value Analysis

For functions with numeric or ranged inputs:

```
Apply boundary value analysis to test [function name].

Input constraints:
- [parameter 1]: valid range [min] to [max], type [type]
- [parameter 2]: valid range [min] to [max], type [type]

Generate tests for:
1. Minimum valid values
2. Maximum valid values
3. Just below minimum (should fail/error)
4. Just above maximum (should fail/error)
5. Typical values in valid range
6. Zero, null, empty string (where applicable)

Use [framework] syntax. Include clear assertions for each case.
```

### Context Patterns

#### Role Priming

Setting an explicit role improves output quality. Per the Agentic Workers research, role priming aligns responses with professional testing standards:

```
You are a senior QA engineer with 10 years of experience in test automation.
Your tests are known for:
- High defect detection rates
- Clear, maintainable structure
- Thorough edge case coverage
- Minimal false positives

Given this function: [code]

Write unit tests that a senior engineer would be proud of. Focus on
behaviors that could break in production, not just happy paths.
```

#### Few-Shot Learning

Providing 2-5 examples of good tests dramatically improves AI output quality. This technique, validated in the Cypress Copilot research, helps AI understand your team's testing style:

```
Here are examples of high-quality tests from our codebase:

Example 1:
[paste existing good test]

Example 2:
[paste existing good test]

Following the same style, structure, and assertion patterns,
generate tests for this new function:

[new function code]

Match the assertion style, error handling patterns, and
naming conventions from the examples.
```

#### Existing Test Suite as Context

When adding tests to an existing suite:

```
This is our existing test file for [module]:

[paste existing tests]

Add tests for this new function, following the
same patterns:
- Same describe/it structure
- Same assertion library usage
- Same setup/teardown patterns
- Same naming conventions

New function:
[new function code]
```

### Templates

#### Unit Test Generation Template

```
## Context
You are writing unit tests for [language] using [framework].
The codebase follows [style/conventions].

## Function Under Test
[paste function code]

## Function Purpose
[1-2 sentence description of intended behavior]

## Requirements
The function must:
1. [requirement 1]
2. [requirement 2]
3. [requirement 3]

## Test Requirements
Generate tests covering:
- All stated requirements
- Input validation (invalid types, null, undefined)
- Boundary conditions
- Error handling paths
- Return value correctness

## Output Format
Provide complete, runnable test code with clear test names
describing what behavior is being verified.
```

#### Integration Test Template

```
## Context
Testing integration between [component A] and [component B].
Framework: [framework]

## Integration Points
1. [Component A] calls [Component B] via [method/API]
2. Data flows: [describe data flow]
3. Error propagation: [describe how errors should propagate]

## Scenarios to Test

### Happy Path
- [describe successful integration scenario]

### Failure Scenarios
- [Component B] returns error
- [Component B] times out
- [Component B] returns malformed data
- Network failure between components

### Edge Cases
- Concurrent calls
- Large payloads
- Empty responses

Generate integration tests using [framework]. Mock external
dependencies but test real integration between A and B.
```

#### Edge Case Expansion Template

```
Given these existing tests:

[paste existing test cases]

The following edge cases are NOT covered. Generate additional
tests for each:

MISSING EDGE CASES:
1. [edge case 1 - describe scenario]
2. [edge case 2 - describe scenario]
3. [edge case 3 - describe scenario]

For each edge case, write a focused test that:
- Has a descriptive name explaining the scenario
- Sets up the specific edge case condition
- Asserts the correct behavior
- Includes relevant error messages for failures
```

---

## Test Review Prompts

### Reviewing AI-Generated Tests

Before merging AI-generated tests, use AI to review them:

```
Review these AI-generated tests for quality issues:

[paste generated tests]

Check for:
1. TAUTOLOGICAL ASSERTIONS: Does any assertion just verify
   a mock's return value or a variable against itself?
2. MISSING NEGATIVE CASES: Are error conditions tested?
3. MOCK ABUSE: Are assertions testing the mock setup rather
   than actual behavior?
4. IMPLEMENTATION MIRRORING: Do tests recapitulate implementation
   logic instead of testing behavior?
5. WEAK ASSERTIONS: Are assertions specific enough to catch bugs?

For each issue found, explain the problem and suggest a fix.
```

### Mutation Testing Feedback

After running mutation testing (mutmut, Stryker, pitest). For comprehensive coverage of mutation testing concepts, LLM workflows, and additional prompt templates, see [mutation-testing-ai.md](mutation-testing-ai.md).

```
Mutation testing found these surviving mutants:

[paste mutation report or list surviving mutants]

For each surviving mutant, generate a test case that would
kill it. Focus on the specific condition or logic that the
mutation changes.

Current test suite:
[paste relevant tests]

Generate only the new tests needed to kill these mutants.
```

### Assertion Quality Analysis

```
Analyze the assertion quality in these tests:

[paste tests]

For each test, evaluate:
1. Is the assertion testing behavior or implementation?
2. Could this assertion pass with buggy code?
3. Is the expected value hardcoded correctly or derived from the test setup?
4. Are all important side effects and return values checked?

Suggest specific improvements to strengthen weak assertions.
```

---

## Test Refactoring and Maintenance Prompts

Prompt templates for refactoring and maintaining AI-generated test suites have been consolidated into [test-maintenance-ai.md](test-maintenance-ai.md), which covers:

- **Refactoring prompts**: Reducing mock abuse, improving assertion specificity, removing duplication, converting test frameworks
- **Maintenance prompts**: Updating tests after code changes, diagnosing flaky tests, test suite cleanup
- **Detection strategies**: Identifying problematic tests, measuring test debt, flaky test detection
- **Prevention practices**: Generation practices that reduce maintenance, review gates that catch problems early

---

## Anti-Patterns

Before applying prompt engineering techniques, verify that AI-generated tests are appropriate for your code category. Security-critical, regulatory, and safety-critical code often require human-written tests regardless of prompt quality. See [when-not-to-use-ai-tests.md](when-not-to-use-ai-tests.md).

### Overly Generic Prompts

**Bad:**
```
Write tests for this code
```

This produces tests that mirror implementation, miss edge cases, and use circular mock-assert patterns.

**Good:**
```
Write tests that verify [specific requirements] for this code,
including [specific edge cases]. Tests should fail if [specific
failure modes] occur.
```

### Implementation-Focused Prompts

**Bad:**
```
Test that calculate_total loops through items and sums prices
```

This produces tests that verify the loop exists, not that the total is correct.

**Good:**
```
Test that calculate_total returns correct totals for:
- Empty cart (0)
- Single item
- Multiple items
- Items with discounts applied
- Large quantities (verify no overflow)
```

### Missing Constraint Specification

**Bad:**
```
Generate test cases for user registration
```

**Good:**
```
Generate test cases for user registration where:
- Email must be valid format and unique
- Password requires 8+ chars, uppercase, number
- Username is 3-20 alphanumeric characters
- Age must be 18+
- All fields are required

Test both valid registration and each validation failure.
```

### Context Overload

Dumping entire codebases into prompts reduces AI effectiveness. LLMs have effective context limits far below their advertised maximums.

**Bad:**
```
[10 files of code]
Write tests for all of this
```

**Good:**
```
[Single function or small module]
Write tests for this function. It integrates with [brief description
of dependencies], which should be mocked.
```

---

## Tool-Specific Patterns

### Claude Code / Claude CLI

Per Anthropic's documentation, Claude responds well to explicit XML tags for structure:

```xml
<testing_context>
Framework: pytest
Style: BDD with pytest-bdd
Coverage target: 80%+ with focus on business logic
</testing_context>

<function_under_test>
[code]
</function_under_test>

<requirements>
1. [requirement 1]
2. [requirement 2]
</requirements>

<edge_cases>
- [edge case 1]
- [edge case 2]
</edge_cases>

Generate tests following the context above.
```

### Cursor

Cursor's strength is codebase awareness. Use it for:

```
Look at how tests are structured in [test directory].
Following the same patterns, generate tests for [new file].
Index the codebase first to understand testing conventions.
```

### GitHub Copilot

Copilot works best with inline context:

```python
# Test calculate_total
# Requirements:
# - Returns sum of (price * quantity) for all items
# - Returns 0 for empty list
# - Raises ValueError for negative prices
# - Handles float precision correctly
def test_calculate_total_empty_list():
    # Copilot will complete based on comment context
```

---

## Sources

### Top Tier (Highest Quality)

1. **Anthropic Claude Documentation** - "Prompting Best Practices"
   https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering
   *Official Claude 4.x prompting guidance with testing-specific patterns*

2. **Kent Beck** - "Augmented Coding: Beyond the Vibes"
   https://tidyfirst.substack.com/p/augmented-coding-beyond-the-vibes
   *TDD system prompts and warning signs for AI going off track*

3. **Elite AI-Assisted Coding** - "Guide AI Agents Through Test-Driven Development"
   https://elite-ai-assisted-coding.dev/p/guide-ai-agents-through-test-driven-development
   *Context isolation technique and phase separation workflow*

4. **Codemanship** - "Why Does TDD Work So Well In AI-assisted Programming?"
   https://codemanship.wordpress.com/2026/01/09/why-does-test-driven-development-work-so-well-in-ai-assisted-programming/
   *Smaller steps, continuous testing, and clarifying with examples*

### Second Tier (High Quality)

5. **IEEE Access** - "Cypress Copilot: Few-Shot Chain Prompting for Test Automation"
   https://ieeexplore.ieee.org/document/10812696
   *Research validation: 65% time reduction, 8.2/10 maintainability rating*

6. **PromptingGuide.ai** - "Chain-of-Thought Prompting"
   https://www.promptingguide.ai/techniques/cot
   *Zero-shot CoT and Auto-CoT techniques applicable to test reasoning*

7. **Kualitee** - "30 Expert AI Prompts for QA Teams"
   https://www.kualitee.com/blog/ai/expert-ai-prompts-for-qa-teams/
   *Prompt templates for full QA workflow*

8. **Agentic Workers** - "Mastering Unit Test Creation with ChatGPT"
   https://agenticworkers.com/blog/mastering-unit-test-creation-with-chatgpt-Q8SJ1O
   *Prompt chaining workflow and common mistakes*

### Third Tier (Useful Examples)

9. **Gizra** - "Test Refactoring with AI"
   https://www.gizra.com/blog/ai-test-refactor/
   *Real-world case study: WDIO to PHPUnit conversion*

10. **Oursky** - "4 Essential AI Testing Prompts"
    https://www.oursky.com/blogs/4-essential-ai-testing-prompts-to-streamline-your-qa-process
    *Practical templates for exploratory, smoke, and regression testing*

11. **Graphite** - "Programming with AI Workflows"
    https://graphite.com/guides/programming-with-ai-workflows-claude-copilot-cursor
    *Tool comparison and review workflow integration*

### Internal References

- [tdd-research.md](tdd-research.md) - Kent Beck's TDD system prompt and context isolation techniques
- [ai-slop-tests.md](ai-slop-tests.md) - Detection and prevention of low-quality AI-generated tests
- [reviewing-ai-tests.md](reviewing-ai-tests.md) - PR review workflows for AI-generated tests

---

*Research compiled: January 2026*
