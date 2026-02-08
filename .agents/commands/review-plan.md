---
title: "Review Plan"
description: "Critically review a spec for completeness, risks, and assumptions"
type: "command"
tags: ["review", "quality", "planning", "validation", "risk-assessment"]
category: "development"
subcategory: "quality"
version: "1.0"
last_updated: "2025-12-13"
status: "draft"
allowed-tools: Read, Glob, Grep, AskUserQuestion
requires_args: true
argument_hint: "[spec-file-path]"
usage_examples:
  - "/review-plan specs/auth-feature.md"
  - "/review-plan specs/api-redesign/02-endpoints.md"
  - "/review-plan specs/migration-plan.md"
---

# Review Plan

Critically review a spec before implementation. Your job is to find problems, not confirm the plan is good.

**Core principle:** Counter compliance bias. Be skeptical, not cynical. Find what's missing.

## Instructions

### Phase 1: Read and Understand

1. Read the spec file from `$ARGUMENTS`
2. Understand the overall goal
3. Identify the implementation approach
4. Note the validation commands

### Phase 2: Critical Review

Review the spec through multiple lenses:

#### 2.1 Completeness Check

- [ ] Is the problem clearly stated?
- [ ] Are all requirements explicit?
- [ ] Are acceptance criteria defined?
- [ ] Are edge cases addressed?
- [ ] Is error handling specified?

**Missing Elements:**
- <Missing element 1>
- <Missing element 2>

#### 2.2 Clarity Check

- [ ] Are terms defined consistently?
- [ ] Are instructions unambiguous?
- [ ] Could steps be misinterpreted?
- [ ] Are examples provided where helpful?

**Unclear Areas:**
- <Unclear area 1>
- <Unclear area 2>

#### 2.3 Assumptions Audit

Identify assumptions that are:
- Unstated but relied upon
- Potentially incorrect
- Context-dependent

**Unstated Assumptions:**
- <Assumption 1> - Risk: <low/medium/high>
- <Assumption 2> - Risk: <low/medium/high>

#### 2.4 Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| <Risk 1> | Low/Med/High | Low/Med/High | <Suggestion> |
| <Risk 2> | ... | ... | ... |

#### 2.5 Architectural Review

- Does this fit existing patterns?
- Are there architectural concerns?
- Will this create technical debt?
- Are dependencies appropriate?

**Architectural Concerns:**
- <Concern 1>
- <Concern 2>

#### 2.6 Validation Review

- Are validation commands sufficient?
- Do they cover all success criteria?
- Can failures be detected reliably?

**Validation Gaps:**
- <Gap 1>
- <Gap 2>

### Phase 3: Recommendations

Provide prioritized recommendations:

**Critical (Must Fix Before Implementation):**
1. <Issue> - <Recommendation>

**Important (Should Fix):**
1. <Issue> - <Recommendation>

**Minor (Could Improve):**
1. <Issue> - <Recommendation>

### Phase 4: Summary

**Review Summary**

Spec: <spec-path>
Status: <Ready | Needs Work | Major Concerns>

**Key Findings:**
- <Finding 1>
- <Finding 2>

**Recommendation:**
<Overall recommendation - proceed, revise, or reconsider>

### Phase 5: Optional Update

Ask the user:
- "Would you like me to update the spec with these findings?"
- "Should I add the missing elements?"

## Review Mindset

- **Be skeptical, not cynical**: Look for real problems, not nitpicks
- **Find what's missing**: Absence of information is often the bug
- **Prioritize by impact**: Focus on issues that would cause real problems
- **Provide solutions**: Don't just criticize, suggest fixes
- **Respect intent**: The goal is to improve the plan, not reject it

## Anti-Pattern: Compliance Bias

Watch for these signs in yourself:
- Agreeing with everything because it sounds reasonable
- Not pushing back on vague requirements
- Accepting "we'll figure it out" as a plan
- Confirming without understanding

Your job is to find problems **before** they become expensive.

## Ruthless Succinctness

- If you can't scan the review in 2 minutes, it's too long
- Bullet points over paragraphs
- Specific over general ("line 45 is unclear" vs "some parts are unclear")
- Recommendations over observations

## Permission Granted

You have explicit permission to:
- Point out fundamental flaws in the approach
- Question whether the problem itself is correct
- Recommend scrapping and restarting if warranted
- Push back on "ship it" pressure

This is quality assurance, not rubber-stamping.

## Arguments

$ARGUMENTS
