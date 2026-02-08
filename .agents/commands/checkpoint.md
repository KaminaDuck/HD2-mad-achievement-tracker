---
title: "Checkpoint"
description: "Save planning work to a checkpoint file and commit for easy recovery"
type: "command"
tags: ["workflow", "planning", "git", "recovery", "knowledge-management"]
category: "development"
subcategory: "workflow"
version: "1.0"
last_updated: "2025-12-13"
status: "draft"
allowed-tools: Read, Write, Bash(git:*), AskUserQuestion
requires_args: true
argument_hint: "[checkpoint-name]"
usage_examples:
  - "/checkpoint auth-feature-planning"
  - "/checkpoint before-refactor"
  - "/checkpoint user-story-complete"
---

# Checkpoint

Save the current planning state to a checkpoint file and commit it to git. This protects your planning work and enables cheap implementation retries.

**Core principle:** Planning is expensive, implementation is cheap. Protect your planning work before attempting implementation.

## Instructions

### Phase 1: Gather Checkpoint Context

1. Read the checkpoint name from `$ARGUMENTS`
2. If no name provided, ask the user for a descriptive checkpoint name
3. Scan recent conversation for planning artifacts:
   - Spec files created or modified
   - Design decisions made
   - Requirements gathered
   - Architecture notes
   - Key insights discovered

### Phase 2: Create Checkpoint File

1. Create directory if needed: `checkpoints/`
2. Generate checkpoint file at `checkpoints/$ARGUMENTS.md`
3. **Force succinctness**: The checkpoint should be scannable in 30 seconds
4. Include in the checkpoint:
   - Timestamp
   - Summary of planning state (3-5 sentences max)
   - Key decisions made (bullet points)
   - Files created/modified (paths only)
   - Next steps identified (numbered list)
   - Open questions (if any)

### Phase 3: Commit Checkpoint

1. Stage the checkpoint file: `git add checkpoints/$ARGUMENTS.md`
2. Stage any related spec files mentioned in conversation
3. Commit with message: `checkpoint: $ARGUMENTS`
4. Record the commit hash for restore instructions

### Phase 4: Report

Provide a brief report:

```
Checkpoint saved: checkpoints/<name>.md
Commit: <hash>

To restore if implementation fails:
  git reset --hard <hash>

To view checkpoint:
  cat checkpoints/<name>.md
```

## Checkpoint File Format

```markdown
# Checkpoint: <name>

**Created:** <timestamp>
**Commit:** <hash>

## Planning Summary
<3-5 sentences describing what was planned - be succinct>

## Key Decisions
- <Decision 1>
- <Decision 2>
- <Decision 3>

## Files
- `path/to/file1.md`
- `path/to/file2.md`

## Next Steps
1. <Next step 1>
2. <Next step 2>

## Open Questions
- <Question if any>

## Restore
git reset --hard <commit-hash>
```

## Guidelines

- **Succinct over comprehensive**: If you can't scan it in 30 seconds, it's too long
- **Decisions over discussions**: Record what was decided, not how you got there
- **Paths over content**: Reference files, don't duplicate their content
- **Rapid retry support**: The goal is fast restore when implementation fails

## Permission Granted

You have explicit permission to:
- Push back if the user hasn't done enough planning to checkpoint
- Suggest what should be captured if the user's description is vague
- Ask clarifying questions about what's important to preserve

## Arguments

$ARGUMENTS
