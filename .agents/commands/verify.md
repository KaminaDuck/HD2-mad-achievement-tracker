---
title: "Verify"
description: "Show understanding of a task before implementing to catch misalignment"
type: "command"
tags: ["workflow", "alignment", "verification", "planning", "quality"]
category: "development"
subcategory: "workflow"
version: "1.0"
last_updated: "2025-12-13"
status: "draft"
allowed-tools: Read, Glob, Grep, AskUserQuestion
requires_args: true
argument_hint: "[task-description or spec-file]"
usage_examples:
  - "/verify specs/auth-feature.md"
  - "/verify Add pagination to the user list API"
  - "/verify Refactor the payment module to use the new schema"
---

# Verify

Show your understanding of a task before implementing. This catches misalignment early and prevents wasted effort.

**Core principle:** Silent misalignment is the enemy. Make your mental model visible before writing code.

## Instructions

### Phase 1: Parse Input

1. Check if `$ARGUMENTS` is a file path (ends in .md or exists as file)
   - If file: Read the spec file
   - If text: Treat as task description
2. Gather context by reading related files if referenced

### Phase 2: State Understanding

Present your understanding in this structured format:

**What I'm About To Do:**
<1-3 sentences describing the core task>

**Expected Outcome:**
<What success looks like - specific, measurable>

**Key Constraints:**
- <Constraint 1>
- <Constraint 2>
- <Constraint 3>

**Files I'll Modify:**
- `path/to/file1` - <what changes>
- `path/to/file2` - <what changes>

**Files I'll Create:**
- `path/to/new-file` - <purpose>

### Phase 3: Surface Concerns

Proactively identify issues - this is where you add value:

**Questions I Have:**
- <Genuine question about requirements>
- <Question about approach>

**Assumptions I'm Making:**
- <Assumption 1>
- <Assumption 2>

**Potential Risks:**
- <Risk 1>
- <Risk 2>

**Alternative Approaches Considered:**
- <Alternative 1> - <why not chosen or worth discussing>

### Phase 4: Request Confirmation

Ask the user directly:
- "Does this match your intent?"
- "Should I proceed with implementation?"
- "Any corrections or additions?"

Use AskUserQuestion tool if you need to clarify specific points.

### Phase 5: Next Steps

If user confirms:
- Offer to proceed with implementation
- Suggest running `/implement <spec-file>` if a spec exists
- Or begin implementation directly if simple enough

If user corrects:
- Update understanding based on feedback
- Re-verify with corrected understanding
- Loop until alignment is confirmed

## Verification Checklist

Before presenting understanding, verify you've addressed:
- [ ] Core task is clearly stated
- [ ] Success criteria are measurable
- [ ] All constraints are identified
- [ ] File changes are specific
- [ ] Questions are genuine (not rhetorical)
- [ ] Assumptions are explicit
- [ ] Risks are realistic

## Permission Granted

You have explicit permission to:
- **Push back** on unclear requirements
- **Ask clarifying questions** before proceeding
- **Flag contradictions** in the spec or request
- **Suggest alternatives** if you see a better approach
- **Refuse to proceed** until you understand the task

This is not compliance - this is partnership. Silent agreement when confused is a failure mode.

## Anti-Pattern: Silent Misalignment

Watch for these signs that you might be misaligned:
- You're making many assumptions to fill gaps
- The request could be interpreted multiple ways
- You're unsure what "done" looks like
- You haven't seen the code you'll modify

When in doubt, ask. It's cheaper than rewriting.

## Arguments

$ARGUMENTS
