---
name: test-driving-with-ai
description: >
  Use when writing tests before implementation (TDD workflow).
  Guides the Red-Green-Refactor cycle with AI-specific concerns:
  context isolation, warning sign detection, and mandatory mutation testing.
---

# Test-Driving With AI

## Core Philosophy

> "TDD served a critical function in AI-assisted development: it kept me in the loop. When you're directing thousands of lines of code generation, you need a forcing function that makes you actually understand what's being built. Tests are that forcing function."
> - Obie Fernandez

**The fundamental tension**: AI tests document what code *does*; human tests specify what code *should do*. TDD inverts the typical AI workflow - tests come from requirements, not implementation.

### Why TDD Matters More With AI

1. **Forcing function** - Tests force humans to understand what's being built
2. **Context management** - Broken code pollutes AI context; tests keep it clean
3. **Control mechanism** - TDD is how humans maintain control over AI output
4. **Quality signal** - Tests catch AI regressions and hallucinations

### The Reality of AI-Generated Tests

Without TDD discipline, AI testing produces:
- **0.4%** genuinely useful tests (99.6% garbage) - Wireframe.today study
- **84%** coverage with **46%** mutation score (false confidence) - KeelCode analysis
- Tests that pass but catch no bugs

---

## Quick Reference

| Phase | Action | Hard Rule |
|-------|--------|-----------|
| ORIENT | Detect scenario, check boundaries, select test type | - |
| RED | Write failing test from requirements (not implementation) | Test MUST fail first |
| GREEN | Implement minimum to pass | Tests MUST pass before commit |
| REFACTOR | Improve structure, tests still pass | - |
| REVIEW | Slop check + mutation testing | 70%+ mutation score |

### Warning Signs (Stop Immediately)

1. **Loop** - Same error 3+ times
2. **Scope creep** - "While I'm at it..."
3. **Test deletion** - Modifying tests to pass
4. **Excessive mocking** - Mocking the subject
5. **Context pollution** - Broken code accumulating

### Key Statistics

- **0.4%** of AI tests provide genuine verification
- **84%** coverage / **46%** mutation score = false confidence
- **70%** mutation score minimum threshold

---

## Workflow Overview

```
ORIENT -> RED -> GREEN -> REFACTOR -> REVIEW -> (repeat)
```

Phases are guidance, not gates. Guardrails enforce only critical rules:
- Test MUST exist and fail before implementation begins
- Tests MUST pass before commit
- Warning signs ALWAYS trigger stop
- Refactor phase SHOULD NOT be skipped entirely

---

## Phase 1: ORIENT

Determine WHAT behavior is being specified and WHETHER AI-assisted testing is appropriate.

### Scenario Detection

Before starting, identify which scenario applies:

**Greenfield** (no existing tests):
- Full TDD workflow
- Maximum freedom in test structure

**Expanding** (adding to existing suite):
- Read existing test patterns first
- Follow conventions (describe structure, assertion style, naming)
- Match the team's testing idioms

**Retrofitting** (adding tests to untested code):
- This is NOT TDD - code exists first
- Start with characterization tests (document current behavior)
- Be explicit: "This is retrofitting, not TDD"

### Boundaries Check

Before proceeding, evaluate whether AI-assisted testing is appropriate:

| Scenario | Action | Rationale |
|----------|--------|-----------|
| Security-critical (auth, crypto, input validation) | Human writes tests | AI lacks threat modeling mindset |
| Regulatory (SOC2, HIPAA, PCI, FDA) | Human writes tests | Audits require traceability |
| Safety-critical (medical, automotive, aerospace) | Human writes tests | Standards require human verification |
| Complex business logic (financial calc, domain rules) | Human writes core tests, AI expands | AI cannot infer domain invariants |
| Standard application code | AI-assisted TDD appropriate | Proceed with workflow |

For detailed boundaries guidance, see [boundaries.md](boundaries.md).

### Test Type Selection

| Scope | Test Type | Key Patterns |
|-------|-----------|--------------|
| Single function/method | Unit Test | Given/When/Then, boundary values, error cases |
| Component interaction | Integration Test | Contract testing, state transitions, error propagation |
| User journey | E2E Test | Natural language specs, visual validation |
| Invariants across inputs | Property-Based Test | Roundtrip properties, fuzzing |

For detailed patterns, see [patterns/](patterns/).

### Verbose Output Example

```
ORIENT: Understanding what behavior we're specifying.

You've asked for user session timeout handling. Before I write any code,
I need to understand the expected behavior:
- What triggers a timeout? (inactivity duration)
- What should happen when timeout occurs? (redirect, message, cleanup)
- Are there any security implications? (This touches auth - let me flag that.)

I see existing tests in tests/unit/auth/. Reading patterns...
The suite uses pytest with fixtures, Given/When/Then naming.
I'll follow these conventions.
```

---

## Phase 2: RED (Write Failing Test)

### Context Isolation Principle

**Do NOT read implementation code when writing tests from requirements.**

This prevents the AI from "peeking" at existing behavior and documenting bugs as features. Tests must derive from requirements only.

```
REQUIREMENTS -> TEST -> IMPLEMENTATION
     |            |
     |  (no read) |
     +------------+
```

### Test Quality Criteria

A properly written test in the Red phase:

| Criterion | Good | Bad |
|-----------|------|-----|
| Specifies | WHAT should happen | HOW it works |
| Derives from | Requirements | Implementation |
| Scope | One behavior | Multiple behaviors |
| Assertions | Observable outcomes | Internal state |
| Complexity | Simplest failing case | Complex setup |

### Writing the Test

1. Write a test based on requirements only
2. Run the test to confirm it fails
3. The failure message should describe what's missing
4. If test passes unexpectedly, investigate before proceeding

### Verbose Output Example

```
RED: Writing a failing test first.

I'm writing a test based on requirements only - I won't look at any existing
session code to avoid documenting current behavior as expected behavior.

The simplest failing test: "session expires after 30 minutes of inactivity"

[writes test]

Running the test to confirm it fails...
Test fails as expected: "SessionManager has no attribute 'check_timeout'"

Good - the failure tells us exactly what's missing.
```

---

## Phase 3: GREEN (Make It Pass)

### Minimum Implementation Rule

Implement ONLY what is needed to make the current test pass. Do not:
- Anticipate future requirements
- Add related features
- Refactor while implementing

### Five Warning Signs

These warning signs indicate the agent is off track. When detected, STOP and surface to human:

| Warning Sign | Detection | Action |
|--------------|-----------|--------|
| **Loop** | Same error 3+ times with similar approach | Stop, surface pattern, present options |
| **Scope creep** | "While I'm at it..." or unrequested functionality | Stop, ask before proceeding |
| **Test deletion** | Modifying or deleting tests to make them pass | Stop immediately, critical warning |
| **Excessive mocking** | Mocking the subject under test | Stop, rewrite approach |
| **Context pollution** | Broken code accumulating in context | Consider revert to green |

### Never Auto-Revert Policy

On repeated failures, the agent:
1. Stops and surfaces the pattern
2. Explains why this might indicate being off-track
3. Presents options:
   - Revert to last green commit
   - Try a different approach
   - Human takes over
4. Waits for human decision
5. Does NOT proceed without explicit direction

### Commit on Green

When tests pass:
1. Commit immediately with descriptive message
2. This creates a safe point to return to
3. Broken code should not remain in context

### Verbose Output Example

```
GREEN: Implementing minimum code to pass.

Now I'll implement just enough to make this one test pass. I won't add
timeout configuration, logging, or other features until we have tests for them.

[implements minimal code]

Running tests... PASS

Committing on green: "Add session timeout check"

---

[later, if stuck]

I'm seeing a pattern: same TypeError three times with similar approaches.

This often indicates one of:
- Missing dependency or import
- Incorrect assumption about the API
- Need for a different approach entirely

Options:
1. Revert to last green commit (cleans context, loses this work)
2. I try a different approach (describe what you'd like)
3. You take over from here

What would you like to do?
```

---

## Phase 4: REFACTOR

### Structural vs Behavioral Changes

- **Structural changes** (rename, extract, move): Tests should still pass
- **Behavioral changes** (new behavior, fix bug): Requires new test first

If a proposed change affects both, split into separate commits.

### Refactoring Rules

1. Run tests before refactoring
2. Make one structural change
3. Run tests after
4. If tests fail: revert the change
5. Repeat until clean

### Don't Skip This Phase

Skipping refactor accumulates technical debt. Even small improvements compound.

### Verbose Output Example

```
REFACTOR: Improving structure without changing behavior.

Tests are passing. I see an opportunity to extract the timeout calculation
into a separate method for clarity.

Running tests before change... PASS
Making change: extracting calculate_timeout()
Running tests after change... PASS

Structure improved, behavior unchanged. Committing: "refactor: extract timeout calculation"
```

---

## Phase 5: REVIEW

### Slop Detection

Before considering work complete, run through the slop detection checklist.
See [review/slop-catalog.md](review/slop-catalog.md) for full patterns and examples.

Key checks:
- Assertions verify behavior, not mocked values
- Error cases are tested
- No implementation mirroring

### Mandatory Mutation Testing

Mutation testing is required in the Review phase. Coverage lies; mutation score reveals truth.

**Workflow:**
1. Run mutation testing tool
2. Review surviving mutants
3. Generate tests to kill high-priority survivors
4. Iterate until threshold achieved

**Thresholds:**
| Context | Minimum Score |
|---------|---------------|
| Standard code | 70% |
| Complex business logic | 80% |
| Security-adjacent | 90% |

For mutation testing guidance, see [review/mutation-testing.md](review/mutation-testing.md).

### Verbose Output Example

```
REVIEW: Validating test quality.

Quick slop check: PASS
- No mock abuse detected
- Assertions verify values, not just existence
- Error cases covered

Running mutation testing...
Result: 58% mutation score (14/24 mutants killed)

10 mutants survived. Generating targeted tests for:
- Boundary: day <= 1 vs day < 1
- Return value: empty list vs None
- Condition: timeout > 0 vs timeout >= 0

[generates additional tests]

Re-running mutation testing...
Result: 79% mutation score (19/24 mutants killed)

Above 70% threshold. 5 surviving mutants are equivalent or low-risk.
Ready to proceed.
```

---

## Commit Strategy

### Commit Points
- **On green**: Commit immediately when tests pass
- **After refactor**: Commit structural improvements separately
- **After review**: Commit additional tests from mutation testing

### When Stuck
If repeatedly failing to reach green:
1. Surface the pattern to human
2. Suggest revert to last green commit
3. Wait for human decision
4. Never auto-revert

### Guardrails Summary

**Hard rules (always enforced):**
- Test must exist and fail before implementation
- Tests must pass before commit
- Warning signs trigger stop

**Soft guidance (acknowledge when skipping):**
- Can return to Orient if requirements unclear
- Can add tests during Refactor if gaps discovered
- Can skip Refactor for trivial changes (but acknowledge)

---

## Test Data Principles

Quick reference for test data. For detailed patterns, see [data/](data/).

### Use Factories for Complex Objects
```python
# Good: Factory with sensible defaults
user = UserFactory(role="admin")

# Bad: Inline construction everywhere
user = User(id=1, name="Test", email="test@example.com", role="admin", ...)
```

### Use Faker for Realistic Values
```python
from faker import Faker
fake = Faker()

user = UserFactory(
    name=fake.name(),
    email=fake.email()
)
```

### Explicit Edge Cases
Define boundary values deliberately, don't rely on random generation:
```python
edge_cases = [0, 1, -1, MAX_INT, None, "", "   "]
```

### Reproducibility
Seed random generators for debuggability:
```python
Faker.seed(4321)  # Same data every time
```

---

## Links to Supporting Files

### Patterns
- [patterns/unit-tests.md](patterns/unit-tests.md) - Given/When/Then, boundary values, mocking
- [patterns/integration-tests.md](patterns/integration-tests.md) - Contract testing, state transitions
- [patterns/e2e-tests.md](patterns/e2e-tests.md) - User journeys, visual testing, agentic approaches
- [patterns/property-based.md](patterns/property-based.md) - Invariants, property discovery

### Review
- [review/slop-catalog.md](review/slop-catalog.md) - Full AI slop pattern catalog
- [review/mutation-testing.md](review/mutation-testing.md) - Mutation testing workflow and tools

### Data
- [data/factories.md](data/factories.md) - Object Mother, Test Data Builder patterns
- [data/fixtures.md](data/fixtures.md) - Fixture management, database seeding

### Boundaries
- [boundaries.md](boundaries.md) - When NOT to use AI tests
- [maintenance.md](maintenance.md) - Keeping tests healthy over time

---

## Deep Dive Reference

For comprehensive research and background, see [reference/](reference/):

| Topic | File |
|-------|------|
| TDD Philosophy & History | [tdd-philosophy.md](reference/tdd-philosophy.md) |
| Full Slop Pattern Catalog | [slop-patterns-full.md](reference/slop-patterns-full.md) |
| Prompt Engineering Templates | [prompt-templates.md](reference/prompt-templates.md) |
| Mutation Testing Research | [mutation-testing-research.md](reference/mutation-testing-research.md) |
| Boundary Case Studies | [boundaries-research.md](reference/boundaries-research.md) |
| E2E & Agentic Testing | [e2e-agents.md](reference/e2e-agents.md) |
| Property-Based Testing | [property-testing.md](reference/property-testing.md) |
| Test Data Patterns | [test-data-research.md](reference/test-data-research.md) |
| Maintenance Strategies | [maintenance-research.md](reference/maintenance-research.md) |
| PR Review Workflows | [review-workflow.md](reference/review-workflow.md) |

---

## Key Quotes

> "Those who get the most out of coding agents tend to be those with strong testing practices."
> - Addy Osmani

> "The key to being effective with AI coding assistants is being effective without them."
> - Kent Beck

> "Commit on green, revert on red."
> - Codemanship (Jason Gorman)

---

*Skill version: 1.0.0*
