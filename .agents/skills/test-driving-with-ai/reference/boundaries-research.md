# When Not to Use AI Tests

## Overview

AI test generation increases coverage but cannot replace human judgment for certain categories of software. This document provides a decision framework for when hand-written tests are preferable to AI-generated ones.

Core principle: AI tests document what code does. Human tests specify what code should do. When these diverge, only human-authored tests catch the bug.

Per Enhops research on AI-driven testing, "AI fundamentally operates on patterns and probabilities. It does not understand business intent, user expectations, or risk impact." This gap becomes visible when teams move from "can it be tested" to "should it be trusted."

---

## Quick Decision Framework

| Scenario | Recommendation | Rationale |
|----------|----------------|-----------|
| Security-critical code (auth, crypto, input validation) | Human-written | AI lacks threat modeling mindset, may introduce vulnerabilities |
| Complex business logic (finance, insurance, regulatory) | Human-written | AI cannot infer domain invariants from code alone |
| Regulatory compliance (SOC2, HIPAA, FDA, DO-178C) | Human-written | Audits require evidence of intentional test design and traceability |
| Safety-critical systems (medical, automotive, aerospace) | Human-written | Standards require human verification, documentation, accountability |
| Design feedback needed (TDD, exploratory) | Human-written | AI documents existing behavior, humans drive design intent |
| Utility functions with clear contracts | AI-assisted | Low risk, clear inputs/outputs, humans review |
| Edge case expansion after core tests exist | AI-assisted | Humans define critical paths, AI expands coverage |
| Test data generation | AI-assisted | See [test-data-generation.md](test-data-generation.md) |

### Risk-Based Decision Flow

1. **Could a failure cause harm to users, data, or systems?** If yes, require human-authored tests.
2. **Are there regulatory or compliance requirements?** If yes, require human-authored tests with traceability.
3. **Does the code involve authentication, authorization, or cryptography?** If yes, require human-authored tests.
4. **Is the business logic domain-specific or involves calculations with real-world consequences?** If yes, require human-authored tests.
5. **Is this utility code with well-defined inputs and outputs?** AI-assisted tests acceptable with human review.

---

## Security-Critical Code

AI-generated tests for security-sensitive code create risk because the AI lacks adversarial thinking. Per Endor Labs research on AI-generated code vulnerabilities, over 40% of AI-generated solutions contain security flaws.

### Where AI Falls Short

**Authentication and authorization.** AI-generated tests often omit authentication entirely. A prompt like "connect to database and display user scores" frequently produces code that bypasses auth mechanisms. Endor Labs research documents recurring instances of broken authentication (CWE-306), broken access control (CWE-284), and hard-coded credentials (CWE-798).

Cryptographic code poses different risks. AI may suggest deprecated algorithms, weak key sizes, or incorrect padding schemes. Testing crypto requires understanding attack vectors, not just functional correctness.

For input validation at trust boundaries, missing sanitization is the most common security flaw in AI-generated code across languages and models. AI tests frequently validate that malicious input is accepted rather than rejected.

**Session management** presents similar gaps. AI tests typically cover happy paths but rarely test token expiration, session fixation, or concurrent session limits.

### Threat Modeling Mindset

The OWASP AI Testing Guide notes that AI systems "fail for reasons that go far beyond security," including:

- Adversarial manipulation (prompt injection, jailbreaks, model evasion)
- Sensitive information leakage
- Excessive or unsafe agency
- Misalignment with organizational policies

Human testers bring a threat modeling mindset: "How could an attacker exploit this?" AI brings pattern matching: "What does similar code do?"

### Recommendation

For security-critical code:
- Human writes all authentication, authorization, and input validation tests
- Human writes tests for cryptographic boundaries
- AI may assist with expanding edge cases after core security tests exist
- All AI-generated security tests require deep review (see [reviewing-ai-tests.md](reviewing-ai-tests.md))

---

## Complex Business Logic

AI cannot infer business rules from code. Financial calculations, physics simulations, and regulatory compliance have invariants that are not obvious from implementation, and getting them wrong matters.

### Domain-Specific Calculations

**Financial calculations** involve interest rates, tax rules, currency conversions, and fee structures with regulatory requirements and edge cases (leap years, negative amounts, rounding) that AI does not understand contextually.

Insurance and actuarial logic presents the same challenge. Risk scoring, premium calculations, and claims processing follow business rules encoded in policy documents, not code.

Scientific and engineering simulations require physical constants, unit conversions, and numerical stability. None of these can be inferred from implementation.

### Multi-Step Workflows

AI-generated tests favor linear happy paths. Per White-Test Lab research, AI testing "frequently falls behind in crucial elements such as creative thinking, subtle understanding, and contextual knowledge."

Complex workflows require testing:
- What happens if the user abandons mid-flow?
- What if data is partially saved?
- What if the system responds slowly but does not fail?
- What if steps are executed out of order?

These scenarios come from domain understanding and user empathy, not training datasets.

### Oracle Problem

Property-based testing with AI faces what the research calls the "oracle problem": properties need a way to know if output is correct. For complex functions, the only oracle might be the implementation itself, creating circular validation.

Per [property-based-testing-ai.md](property-based-testing-ai.md):
> "LLMs do not understand your business rules. Financial calculations, physics simulations, and regulatory compliance have invariants that are not obvious from code alone."

### Recommendation

For complex business logic:
- Human writes tests based on requirements documents and domain expertise
- Human defines expected outcomes for regulatory calculations
- AI may generate additional test data after human establishes correct behavior
- Consider property-based testing with human-defined invariants

---

## Regulatory and Compliance

Regulated industries require evidence that testing was intentional, traceable, and performed by accountable humans. AI-generated tests create audit problems.

### Audit Trail Requirements

**SOC2 and HIPAA** audits examine whether controls are designed and operating effectively. "An AI wrote tests that passed" does not demonstrate intentional control design.

PCI-DSS requires documented evidence of security testing. Auditors ask: "Who verified this? How do you know it works?"

For FDA-regulated medical devices, IEC 62304 requires software lifecycle documentation including test procedures, expected results, and pass/fail criteria with traceability to requirements.

### Traceability Requirements

Per the World Economic Forum analysis, AI governance in finance "hinges on testability and quality assurance." Regulated software requires:

- Traceability from requirements to test cases to results
- Documentation of who authored tests and why
- Evidence that tests were designed to verify specific requirements
- Change control showing test evolution alongside code changes

AI-generated tests lack this context. The AI does not know which requirement a test verifies or why a particular assertion matters.

### Documentation for Compliance Audits

Auditors examining AI-generated tests will ask:
- How do you know these tests verify requirements?
- Who is accountable for test correctness?
- How do you detect if AI-generated tests miss a requirement?
- What is your review process for AI-generated code?

Without satisfactory answers, AI-generated tests may be rejected as evidence of compliance.

### Recommendation

For regulated software:
- Human writes tests with explicit requirement traceability
- Document test rationale, not just test code
- If AI assists with test generation, document human review process
- Maintain audit trail showing human accountability

---

## Safety-Critical Systems

Safety-critical software development requires verification and validation at every step of the development lifecycle. AI-generated tests cannot meet these standards.

### Medical Devices (FDA, IEC 62304)

Per FDA guidance on AI in medical devices, the agency examines how AI systems are developed, validated, and maintained. Medical device software requires:

- Risk-based test coverage demonstrating hazard mitigation
- Verification that software meets design specifications
- Validation that software meets user needs and intended uses
- Documentation sufficient to allow regulatory review

AI-generated tests do not provide the intentional design evidence FDA requires.

### Automotive (ISO 26262)

ISO 26262 defines functional safety requirements including:

- Hazard analysis and risk assessment
- Safety requirements specification
- Verification of safety requirements
- Validation of safety goals

Per LDRA research, "For the foreseeable future, AI/ML components will operate inside conventionally developed software and rely on having humans in the loop."

The standard ISO/PAS 8800 (Road Vehicles - Safety and artificial intelligence) is being developed to define safety-related properties and risk factors for AI, but it assumes human oversight of AI components.

### Aerospace (DO-178C)

DO-178C is a formal process standard covering the complete software lifecycle. Development Assurance Levels (DAL) A through E define increasing rigor for safety-critical functions.

At DAL A (most critical), requirements include:
- Structural coverage analysis (MC/DC)
- Requirements-based testing with traceability
- Independence of verification activities

AI-generated tests cannot demonstrate the independence or intentionality required at high assurance levels.

### Industrial Control (IEC 62443)

Industrial control systems require security testing with documented coverage of threat scenarios. AI-generated tests may not cover the specific attack vectors relevant to operational technology environments.

### Recommendation

For safety-critical systems:
- Human authors all tests with requirement traceability
- Use certified tools for test generation assistance (TUV SUD, etc.)
- Maintain documentation demonstrating intentional test design
- AI may assist with test data generation, not test logic

---

## Design Feedback Scenarios

One underappreciated cost of AI test generation is the loss of design feedback. Manual test writing forces developers to confront code design; if a function is hard to test, it is usually poorly designed.

### TDD Benefits Lost

Per Cortex's 2026 benchmark report, teams relying heavily on AI generation report architectural quality degradation. The code becomes "untestable," but AI writes "tests" anyway by mocking away the complexity, hiding the rot.

When AI generates tests:
- Developers lose feedback about code testability
- Design problems get papered over with mocks
- Technical debt accumulates invisibly

See [test-maintenance-ai.md](test-maintenance-ai.md) for the maintenance burden this creates.

### Exploratory Testing

AI cannot perform exploratory testing. Per White-Test Lab:
> "Unlike humans, who can complete tasks with the presence of moral judgment, AI strictly follows logic, without any deviations."

Exploratory testing requires:
- Human curiosity about unexpected behavior
- Domain knowledge to recognize anomalies
- Judgment about what "feels wrong"
- Creativity to devise novel test scenarios

### Acceptance Criteria Validation

When validating that software meets user needs, human testers verify intent. AI testers verify implementation. A dev.to postmortem on tautological tests describes this gap:

> "The AI had patterned tests after the code it saw, producing assertions that mirrored internal transformations. That tautology made the suite look comprehensive when it was actually blind to the real failure mode."

### Recommendation

For design-sensitive work:
- Human writes tests first (TDD) to drive design
- Human performs exploratory testing for edge cases
- Human validates acceptance criteria with stakeholders
- AI may expand coverage after design is stable

---

## When AI Assistance IS Appropriate

AI-generated tests work well when risk is low, contracts are clear, and humans provide oversight.

### Utility Functions with Clear Contracts

Pure functions with well-defined inputs and outputs are suitable for AI test generation:

- String formatting
- Date/time calculations (human defines edge cases for leap years, timezones)
- Collection transformations (map, filter, reduce)
- Serialization with well-defined schemas

Human should still review generated tests for:
- Missing boundary conditions
- Incorrect expected values
- Over-mocking of dependencies

### Edge Case Expansion

After humans write core tests establishing correct behavior, AI can expand coverage:

```
Given these existing tests:
[human-written core tests]

Generate additional edge cases covering:
- Boundary values at limits
- Empty/null inputs
- Large inputs
- Concurrent operations
```

This pattern keeps humans in control of what "correct" means while leveraging AI for coverage breadth.

### Test Data Generation

AI assists well with generating realistic test fixtures:

- Synthetic user profiles with realistic demographics
- Sample transactions
- Mock API responses matching production schemas
- Valid randomized inputs

See [test-data-generation.md](test-data-generation.md) for patterns and limitations.

### Regression Suite Maintenance

After human review, AI can help maintain tests when code changes:

- Update tests after refactoring (human verifies correctness)
- Find tests affected by interface changes
- Propose test modifications for new behavior

See [test-maintenance-ai.md](test-maintenance-ai.md) for maintenance workflows.

### Boilerplate Reduction

AI handles mechanical aspects of test writing:

- Test file scaffolding
- Import statements and setup
- Mock configuration boilerplate
- Assertion syntax conversion between frameworks

Human provides test logic; AI provides formatting.

---

## Sources

### Primary Sources (High Quality)

1. **Enhops** - "AI-Driven Testing Still Needs Human Judgment"
   https://enhops.com/blog/ai-driven-testing-human-judgment
   *January 2026 analysis with real enterprise examples of where human judgment remains essential*

2. **OWASP AI Testing Guide** - v1.0 (November 2025)
   https://owasp.org/www-project-ai-testing-guide/
   *First open standard for trustworthiness testing of AI systems, explains why AI testing is unique*

3. **Endor Labs** - "The Most Common Security Vulnerabilities in AI-Generated Code"
   https://www.endorlabs.com/learn/the-most-common-security-vulnerabilities-in-ai-generated-code
   *August 2025 research showing 40%+ of AI solutions contain security flaws*

4. **Avenga** - "Limitations of AI in Quality Assurance"
   https://www.avenga.com/magazine/limitations-of-ai-in-quality-assurance-test-your-software-with-ai-test-your/
   *July 2025 analysis of AI QA limitations: complexity, training data dependency, opacity*

5. **White-Test Lab** - "The Limitations of AI: Where AI Testing Fails"
   https://white-test.com/for-qa/useful-articles-for-qa/limitations-of-ai/
   *May 2025 real-world scenarios: contextual errors, visual/UX misses, ethical blind spots*

### Safety-Critical and Regulatory

6. **Parasoft** - "Software Development Process for Safety-Critical Systems"
   https://www.parasoft.com/blog/safety-critical-software/
   *Overview of ISO 26262, IEC 62304, DO-178C requirements and best practices*

7. **LDRA** - "How AI Impacts the Qualification of Safety-Critical Automotive Software"
   https://ldra.com/how-ai-impacts-the-qualification-of-safety-critical-automotive-software/
   *Analysis of ISO/PAS 8800 and freedom from interference concepts for AI in automotive*

8. **FDA** - "Artificial Intelligence in Software as a Medical Device"
   https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-software-medical-device
   *FDA guidance on AI/ML in medical devices*

### Case Studies

9. **dev.to** - "When AI-generated tests pass but miss the bug: a postmortem"
   https://dev.to/jamesdev4123/when-ai-generated-tests-pass-but-miss-the-bug-a-postmortem-on-tautological-unit-tests-2ajp
   *Real-world postmortem on tautological AI tests that documented bugs as expected behavior*

10. **QA Financial** - "World Economic Forum Warns AI Governance Hinges on Testability"
    https://qa-financial.com/world-economic-forum-warns-ai-governance-in-finance-hinges-on-testability-and-qa/
    *WEF analysis of AI governance requirements for financial systems*

---

## Internal References

- [ai-slop-tests.md](ai-slop-tests.md) - Detection of problems AI tests create
- [reviewing-ai-tests.md](reviewing-ai-tests.md) - Review workflows when AI tests are used
- [property-based-testing-ai.md](property-based-testing-ai.md) - Limitations with complex domains
- [test-maintenance-ai.md](test-maintenance-ai.md) - Why TDD keeps humans in the loop
- [test-data-generation.md](test-data-generation.md) - Where AI data generation is appropriate
- [prompt-engineering-tests.md](prompt-engineering-tests.md) - Prompt patterns that reduce AI test problems

---

*Research compiled: January 2026*
