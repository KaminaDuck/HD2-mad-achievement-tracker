# When NOT to Use AI Tests

## Overview

AI test generation increases coverage but cannot replace human judgment for certain categories of software. This guide provides a decision framework for when hand-written tests are required.

**Core principle**: AI tests document what code *does*. Human tests specify what code *should do*. When these diverge, only human-authored tests catch the bug.

## Quick Decision Matrix

| Scenario | Recommendation | Rationale |
|----------|----------------|-----------|
| Security-critical (auth, crypto, input validation) | Human writes tests | AI lacks threat modeling mindset |
| Regulatory (SOC2, HIPAA, PCI, FDA) | Human writes tests | Audits require traceability |
| Safety-critical (medical, automotive, aerospace) | Human writes tests | Standards require human verification |
| Complex business logic (financial, domain rules) | Human writes core tests | AI cannot infer domain invariants |
| Utility functions with clear contracts | AI-assisted | Low risk, humans review |
| Edge case expansion | AI-assisted | Humans define core, AI expands |

## Risk-Based Decision Flow

1. **Could a failure cause harm to users, data, or systems?** If yes, require human-authored tests.
2. **Are there regulatory or compliance requirements?** If yes, require human-authored tests with traceability.
3. **Does the code involve authentication, authorization, or cryptography?** If yes, require human-authored tests.
4. **Is the business logic domain-specific with real-world consequences?** If yes, require human-authored tests.
5. **Is this utility code with well-defined inputs and outputs?** AI-assisted tests acceptable with human review.

---

## Security-Critical Code

Over **40%** of AI-generated solutions contain security flaws (Endor Labs research).

### Authentication and Authorization

AI-generated tests often omit authentication entirely. Common gaps:
- Broken authentication (CWE-306)
- Broken access control (CWE-284)
- Hard-coded credentials (CWE-798)
- Session fixation vulnerabilities
- Token expiration edge cases

### Cryptographic Code

AI may suggest deprecated algorithms, weak key sizes, or incorrect padding. Testing crypto requires understanding attack vectors, not just functional correctness.

### Input Validation

Missing sanitization is the most common security flaw in AI-generated code. AI tests frequently validate that malicious input is accepted rather than rejected.

### Threat Modeling Mindset

Human testers ask: "How could an attacker exploit this?"
AI testers ask: "What does similar code do?"

**Recommendation**: Human writes all authentication, authorization, and input validation tests. AI may assist with edge case expansion after core security tests exist.

---

## Complex Business Logic

AI cannot infer business rules from code. Financial calculations, physics simulations, and regulatory compliance have invariants that are not obvious from implementation.

### Domain-Specific Calculations

- Financial: interest rates, tax rules, currency conversions, rounding
- Insurance: risk scoring, premium calculations, claims processing
- Scientific: physical constants, unit conversions, numerical stability

None of these can be reliably inferred from implementation.

### Multi-Step Workflows

AI favors linear happy paths. It misses:
- What happens if user abandons mid-flow?
- What if data is partially saved?
- What if steps are executed out of order?
- What if the system responds slowly but doesn't fail?

### The Oracle Problem

For complex functions, the only oracle might be the implementation itself, creating circular validation.

**Recommendation**: Human writes tests based on requirements documents and domain expertise. AI may generate additional test data after human establishes correct behavior.

---

## Regulatory and Compliance

Regulated industries require evidence that testing was intentional, traceable, and performed by accountable humans.

### Audit Trail Requirements

| Regulation | Requirement |
|------------|-------------|
| SOC2/HIPAA | Evidence of intentional control design |
| PCI-DSS | Documented security testing |
| FDA (IEC 62304) | Test procedures with traceability to requirements |
| ISO 26262 | Safety requirements verification |
| DO-178C | Independence of verification activities |

### Traceability Requirements

Regulated software requires:
- Traceability from requirements to test cases to results
- Documentation of who authored tests and why
- Evidence that tests verify specific requirements
- Change control showing test evolution

AI-generated tests lack this context. The AI does not know which requirement a test verifies.

**Recommendation**: Human writes tests with explicit requirement traceability. Document test rationale, not just test code.

---

## Safety-Critical Systems

### Medical Devices (FDA, IEC 62304)

Requires:
- Risk-based test coverage demonstrating hazard mitigation
- Verification that software meets design specifications
- Documentation sufficient for regulatory review

### Automotive (ISO 26262)

Requires:
- Hazard analysis and risk assessment
- Safety requirements specification
- Verification of safety requirements

### Aerospace (DO-178C)

At DAL A (most critical):
- Structural coverage analysis (MC/DC)
- Requirements-based testing with traceability
- Independence of verification activities

**Recommendation**: Human authors all tests with requirement traceability. Use certified tools for assistance. AI may assist with test data generation, not test logic.

---

## Design Feedback Scenarios

One underappreciated cost of AI test generation is the loss of design feedback.

### TDD Benefits Lost

When AI generates tests:
- Developers lose feedback about code testability
- Design problems get papered over with mocks
- Technical debt accumulates invisibly

If a function is hard to test, it's usually poorly designed. AI writes "tests" anyway by mocking away the complexity, hiding the rot.

### Exploratory Testing

AI cannot perform exploratory testing. It strictly follows patterns without:
- Human curiosity about unexpected behavior
- Domain knowledge to recognize anomalies
- Judgment about what "feels wrong"

**Recommendation**: Human writes tests first (TDD) to drive design. Human performs exploratory testing. AI may expand coverage after design is stable.

---

## When AI Assistance IS Appropriate

### Utility Functions with Clear Contracts

Pure functions with well-defined inputs and outputs:
- String formatting
- Date/time calculations (human defines edge cases)
- Collection transformations
- Serialization with defined schemas

Human should still review for missing boundary conditions.

### Edge Case Expansion

After humans write core tests establishing correct behavior:

```
Given these existing tests:
[human-written core tests]

Generate additional edge cases covering:
- Boundary values at limits
- Empty/null inputs
- Large inputs
- Concurrent operations
```

### Test Data Generation

AI assists well with generating realistic test fixtures:
- Synthetic user profiles
- Sample transactions
- Mock API responses
- Valid randomized inputs

See [data/factories.md](data/factories.md) and [data/fixtures.md](data/fixtures.md).

### Boilerplate Reduction

AI handles mechanical aspects:
- Test file scaffolding
- Import statements and setup
- Mock configuration boilerplate
- Assertion syntax conversion between frameworks

Human provides test logic; AI provides formatting.

---

## Summary

| Category | Human Must | AI May |
|----------|------------|--------|
| Security-critical | Write all tests | Expand edge cases (with review) |
| Regulatory | Write tests with traceability | Generate test data |
| Safety-critical | Write and document all tests | Generate test data only |
| Business logic | Define correct behavior | Expand coverage |
| Utility functions | Review all output | Generate initial tests |
| Test data | Define edge cases | Generate realistic values |
