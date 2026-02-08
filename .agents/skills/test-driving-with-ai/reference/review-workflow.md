# Reviewing AI-Generated Tests: Workflow and Process Guide

## Overview

This document covers the **process** of reviewing AI-generated tests: team workflows, pre-review automation, time management, approval criteria, and organizational practices.

For specific **patterns to detect** (mock abuse, tautological assertions, coverage theater), see [ai-slop-tests.md](ai-slop-tests.md).

---

## The Review Burden Problem

AI shifts work from writing to reviewing. This creates an asymmetry that catches teams off guard.

### The Inversion

Per IT Revolution's analysis of AI code generation bottlenecks, when generative AI tools accelerate code creation, the code review process becomes a chokepoint. The validation pipeline designed for human-paced output cannot handle AI-generated volume.

The pattern:
- AI generates tests fast
- Review queue grows faster
- Reviewers skim instead of scrutinize
- Quality slips through

### Review Time Often Exceeds Write Time

From RAOGY's 2026 code review guide: "Management loves that juniors are shipping code faster. There's pressure to approve PRs quickly. 'Why are you spending 2 hours reviewing 200 lines of code? It has tests!'"

The response: finding AI hallucinations takes time. You need to think through scenarios, trace execution paths mentally, and imagine edge cases. This cannot be rushed.

### Reviewer Fatigue

When AI generates 1,000 tests and a significant portion are subtle garbage, reviewers succumb to fatigue. After spotting 50 bad tests, they start skimming. The AI's polished output makes this worse: everything looks plausible, so skepticism fades.

---

## Pre-Review Automation

Before human eyes see the code, automated systems should catch low-hanging issues.

### CI Gates

Block or flag PRs that fail automated quality checks:

| Gate | Purpose | Tool Examples |
|------|---------|---------------|
| Mutation score threshold | Verify tests catch bugs | mutmut, Stryker, pitest |
| Mock ratio limit | Flag excessive mocking | Custom linter rules |
| Minimum assertions | Prevent empty tests | pytest plugins, ESLint |
| Static analysis | Catch code smells | SonarQube, ESLint, Pylint |
| Dependency CVE check | Security vulnerabilities | Snyk, Dependabot |

Per CodeAnt AI's adoption guide, these checks should run automatically on every PR. The goal: filter out obvious failures before a human reviewer invests time.

### Linting for Test Quality

Standard linters catch syntax and style issues. Test-specific linting catches:

- Tests with no assertions
- Assertions that compare identical values
- Mocked return values that appear verbatim in assertions
- Pure functions being mocked unnecessarily

Custom rules can enforce team standards. Example: flag any test where the mock count exceeds the assertion count.

### Automated PR Summaries

AI-generated PR summaries help reviewers get context quickly without reading full diffs. Tools like GitHub Copilot and CodeAnt AI generate these automatically. Use them as triage aids, not replacements for reading the code.

---

## The Human Review Process

### Triage: Quick Rejection Criteria

Not every PR deserves deep review. Fast rejection saves time for everyone.

Reject immediately if:
- Tests fail on CI
- Coverage decreased without explanation
- Mutation score below threshold
- Obvious copy-paste duplication
- Tests that don't exercise the code path they claim to test

Reject with explanation if:
- Tests mock the subject under test
- All assertions are existence checks (`assert "key" in result`)
- Happy path only, no edge cases
- Comments describe what code does, not why tests matter

### Deep Review: When to Invest Time

Deep review is warranted when:
- Tests cover security-critical code (auth, payments, crypto)
- Tests cover complex business logic with edge cases
- Tests were generated for code with known bugs
- Reviewer intuition says "something is off"

For these categories, consider whether AI-generated tests are appropriate at all. See [when-not-to-use-ai-tests.md](when-not-to-use-ai-tests.md) for decision criteria.

Per RAOGY's guide, develop "paranoid reading mode" for AI code. Look for:
- Code that handles the happy path perfectly but has no edge case handling
- Functions that look suspiciously similar to textbook examples
- Comments that are too generic ("This function processes the data")
- Error handling that catches everything but does nothing specific

### Checklist Application

Use the detection checklist from [ai-slop-tests.md](ai-slop-tests.md#code-review-checklist):

1. Does this test validate behavior or implementation?
2. Does it cover negative and edge cases?
3. Can the assertion be satisfied by wrong code?
4. Is mock usage justified?
5. Is this test worth maintaining?

For each AI-generated test, run through these questions. If multiple answers are "no" or "unclear," request changes.

### Time Boxing

Set explicit time limits per test or per PR:

- **Quick scan**: 30 seconds per test file for obvious issues
- **Standard review**: 2-3 minutes per test function for logic verification
- **Deep review**: 10+ minutes per test for security-critical code

When to give up on a PR:
- You've spent more time reviewing than rewriting would take
- The test logic is so convoluted you cannot explain it
- Multiple rounds of feedback have not improved quality

At that point, reject the PR and ask for a rewrite or pair on the implementation.

---

## Team Workflows

### Responsibility Split

| Task | Author Responsibility | Reviewer Responsibility |
|------|----------------------|------------------------|
| Test correctness | Write tests that pass for right reasons | Verify tests fail when code breaks |
| Coverage | Cover stated requirements | Check for missing edge cases |
| Mock rationale | Explain why mocks are necessary | Question mock proliferation |
| Documentation | Annotate AI-generated sections | Verify annotations are honest |
| Fix requests | Address all feedback | Provide actionable feedback |

Per Bright Security's best practices: treat AI-generated code as untrusted by default. The burden of proof shifts to the author to demonstrate the code works, not to the reviewer to prove it doesn't.

### AI-Assisted Code Ownership

Every piece of AI-generated code should have a clear human owner. Someone who can:
- Explain what it does
- Explain why it exists
- Fix it when something breaks

Code without ownership becomes tech debt instantly. AI accelerates this problem because it lowers the friction to creating complexity.

### The Explanation Test

When reviewing AI-generated tests, ask the author to explain them. Not just what they do, but HOW and WHY.

"Walk me through how this test verifies the error handling path."

If they cannot explain it, they do not understand it, and it should not be merged.

### The Modification Challenge

Ask the author to make a small change: "Can you add a test for the null input case?"

If they modify confidently, they understand the code. If they regenerate the whole thing with AI, they do not.

---

## Training Reviewers

### Common Mistakes Reviewers Make

1. **Trusting polished appearance** - AI output looks clean; this invites skimming
2. **Assuming tests verify what they claim** - Test names lie; read the assertions
3. **Approving to clear the queue** - Pressure to merge creates quality gaps
4. **Ignoring intuition** - "This feels wrong but I can't articulate why" is valid
5. **Not running the tests locally** - Pass on CI does not mean correct behavior

### Skills to Develop

From RAOGY's 2026 guide:

**Paranoid Reading**: Look for code that is TOO confident. What to watch for:
- Happy path handling but missing edge case logic
- Functions that look like textbook examples
- Generic comments ("This handles the data")
- Error handling that catches everything but does nothing specific

**Context Archaeology**: AI does not understand your specific context. Verify the code works in YOUR world:
- Does this work with OUR database schema?
- Does this respect OUR rate limits?
- Does this follow OUR authentication flow?

**Boundary Test Mindset**: AI is bad at boundaries. Always ask:
- What if the input is empty?
- What if null vs undefined?
- What if the number is zero? Negative? Infinity?
- What if the array has one item? Zero items?

**The "Why" Interrogation**: For every line, you should be able to answer "why?" If the answer is "because the AI wrote it that way," dig deeper.

### Exercises for Reviewers

1. **Mutation hunting**: Take a passing test suite, manually mutate the code, verify tests catch it
2. **Mock audit**: Review a test file and justify each mock; remove unjustified ones
3. **Assertion upgrade**: Replace weak assertions (`assert result`) with strong ones (`assert result == expected`)
4. **Negative case addition**: For each test file, add at least one edge case or error path test

---

## Approval Criteria

### When to Approve

Approve when:
- All automated checks pass
- Tests fail when the code is broken (verified via mutation or manual test)
- Assertions verify behavior, not implementation
- Mock usage is minimal and justified
- Author can explain every test
- Edge cases are covered
- The code category is appropriate for AI testing (see [when-not-to-use-ai-tests.md](when-not-to-use-ai-tests.md))

### When to Request Changes

Request changes when:
- Tests pass but are not testing real behavior
- Mock proliferation obscures what is being tested
- Missing negative test cases
- Author cannot explain the test logic
- Assertions are too weak (existence checks, type checks only)

Provide specific, actionable feedback:
- "Add a test for the case where user_id is null"
- "Remove the mock on `format_date` - it's a pure function"
- "Replace `assert result` with an assertion on the expected value"

### When to Reject Entirely

Reject (do not request changes, reject outright) when:
- Tests mock the subject under test
- Tests are tautological (assert what was mocked)
- Tests add maintenance burden without verification value
- Multiple review rounds have not fixed fundamental issues
- The test logic is incomprehensible

Rejecting is not failure. It is quality control.

---

## Documentation and Metrics

Documentation practices for AI-generated tests (annotation conventions, PR disclosure requirements) and metrics for tracking test quality (mutation scores, defect escape rates, metrics to avoid) have been consolidated into [test-maintenance-ai.md](test-maintenance-ai.md).

Key topics covered there:
- Marking AI-generated tests with structured annotations
- PR disclosure requirements for AI-generated code
- Metrics that matter: mutation score, flaky rate, churn rate, fix time
- Metrics that create perverse incentives (coverage alone, test count, pass rate)

---

## Sources

### Primary Sources

1. **RAOGY Guide** - "Code Review in 2026: Reviewing the AI, Not the Human"
   https://raogy.guide/blog/ai-code-review-2026
   *2026 guide to AI code review with detailed skills, red flags, and policy templates*

2. **Bright Security** - "5 Best Practices for Reviewing and Approving AI-Generated Code"
   https://brightsec.com/blog/5-best-practices-for-reviewing-and-approving-ai-generated-code/
   *Security-focused review practices with emphasis on treating AI code as untrusted*

3. **IT Revolution** - "Unclogging the Value Stream: How to Make AI Code Generation Actually Deliver Business Value"
   https://itrevolution.com/articles/unclogging-the-value-stream-how-to-make-ai-code-generation-actually-deliver-business-value/
   *Enterprise perspective on PR-to-production bottlenecks from AI code generation*

4. **CodeAnt AI** - "How Development Teams Can Adopt AI-Assisted Code Review Workflows"
   https://www.codeant.ai/blogs/how-development-teams-can-adopt-ai-assisted-code-review-workflows
   *Practical adoption guide with responsibility split and measurement approaches*

5. **Addy Osmani** - "My LLM coding workflow going into 2026"
   https://medium.com/@addyosmani/my-llm-coding-workflow-going-into-2026-52fe1681325e
   *Practitioner workflow from Google Chrome developer experience lead*

### Supporting Sources

6. **MIT Sloan Management Review** - "The Hidden Costs of Coding With Generative AI"
   https://sloanreview.mit.edu/article/the-hidden-costs-of-coding-with-generative-ai/
   *Research on technical debt accumulation from AI code generation*

7. **Thoughtbot Blog** - "How to review AI generated PRs" (Justin Toniazzo)
   https://thoughtbot.com/blog/how-to-review-ai-generated-prs
   *Practical code review guidance from experienced consultancy*

---

## Related Documents

- [ai-slop-tests.md](ai-slop-tests.md) - Detection patterns, code examples, prevention strategies
- [tdd-research.md](tdd-research.md) - TDD with AI agents

---

## Summary

Reviewing AI-generated tests requires different workflows than reviewing human-written code:

1. **Automate first**: Let CI gates filter obvious failures before human review
2. **Triage ruthlessly**: Not every PR deserves deep review
3. **Time box**: Set explicit limits; reject when review exceeds rewrite time
4. **Verify understanding**: Authors must explain their tests
5. **Document origin**: Mark AI-generated code for future maintainers
6. **Track quality**: Mutation scores over coverage percentages

The goal is not to reject AI assistance. It is to ensure AI-generated tests provide actual value: catching bugs before production.
