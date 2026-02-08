---
title: "Structure"
description: "Convert unstructured notes into organized requirements"
type: "command"
tags: ["planning", "requirements", "organization", "brainstorm", "extraction"]
category: "development"
subcategory: "planning"
version: "1.0"
last_updated: "2025-12-13"
status: "draft"
allowed-tools: Read, Write, AskUserQuestion
requires_args: true
argument_hint: "[raw-text or file-path]"
usage_examples:
  - "/structure @notes/brainstorm.txt"
  - "/structure Need to add user auth, maybe OAuth, also password reset..."
  - "/structure @meeting-notes.md"
---

# Structure

Convert unstructured input into organized requirements. Speak your thoughts, let AI extract structure.

**Core principle:** Voice-to-structure pipeline. Lower the barrier to starting work by accepting messy input.

## Instructions

### Phase 1: Receive Input

1. Check if `$ARGUMENTS` is a file path (starts with @ or ends in common extensions)
   - If file: Read the file content
   - If text: Use the text directly
2. Scan for key themes and topics

### Phase 2: Initial Extraction

Extract from the raw input:

**Topics Identified:**
- <Topic 1>
- <Topic 2>
- <Topic 3>

**Potential Requirements:**
- <Requirement 1>
- <Requirement 2>

**Constraints Mentioned:**
- <Constraint 1>
- <Constraint 2>

**Open Questions:**
- <Question 1>
- <Question 2>

### Phase 3: Clarifying Questions

Use AskUserQuestion to fill gaps:

- "I identified X, Y, Z as main topics. Is anything missing?"
- "You mentioned <thing> - could you clarify what you mean?"
- "What's the priority order for these requirements?"
- "Are there any constraints I should know about?"

Don't assume - ask.

### Phase 4: Generate Structured Output

Based on input and clarifications, generate:

```markdown
# <Project/Feature Name>

## Overview
<Summary of what this is about>

## Requirements

### Must Have
- [ ] <Requirement 1>
- [ ] <Requirement 2>

### Should Have
- [ ] <Requirement 1>
- [ ] <Requirement 2>

### Nice to Have
- [ ] <Requirement 1>

## Constraints
- <Constraint 1>
- <Constraint 2>

## Technical Considerations
- <Consideration 1>
- <Consideration 2>

## Open Questions
- <Question needing resolution>

## Next Steps
1. <Suggested next step>
2. <Suggested next step>
```

### Phase 5: Output Options

Ask the user:
- "Save this to a file? (suggest: `docs/<name>-requirements.md`)"
- "Feed this into `/feature` to create an implementation spec?"
- "Feed this into `/task` for a simpler task plan?"

### Phase 6: Handoff

If user chooses to continue:
- Save the structured document
- Suggest the appropriate next command
- Provide the structured output as context

## Extraction Guidelines

- **Preserve intent**: Capture what they meant, not just what they said
- **Ask about ambiguity**: Don't assume the easy interpretation
- **Prioritize by emphasis**: Repeated topics are likely important
- **Separate must/should/nice**: Not everything is a requirement
- **Identify implicit constraints**: What's assumed but not stated?

## Semantic Zoom

Adjust detail level based on what's needed:
- **Zoomed out**: High-level themes and goals
- **Zoomed in**: Specific requirements and acceptance criteria

Ask: "Would you like more detail on any section?"

## Input Types Supported

- **Brain dump text**: Stream of consciousness notes
- **Meeting notes**: Bullet points from discussions
- **Chat transcripts**: Copy-pasted conversations
- **Voice transcripts**: Dictated thoughts
- **Existing docs**: Messy requirements docs that need cleanup

## Permission Granted

You have explicit permission to:
- Ask many clarifying questions (it's better than assuming)
- Push back on contradictions in the input
- Suggest the input might be trying to solve the wrong problem
- Propose structure different from what user might expect

## Anti-Pattern: Premature Structure

Don't impose structure too early:
- First understand what they're trying to accomplish
- Then organize around that goal
- Let the content drive the structure, not vice versa

## Arguments

$ARGUMENTS
