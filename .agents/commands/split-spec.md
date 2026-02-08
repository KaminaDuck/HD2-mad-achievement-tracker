---
title: "Split Specification"
description: "Split a large spec into incrementally verifiable phases for easier implementation"
type: "command"
tags: ["planning", "specs", "phases", "incremental", "analysis", "organization"]
category: "development"
subcategory: "planning"
version: "1.0"
last_updated: "2025-11-03"
status: "stable"
allowed-tools: Read, Edit, Write, AskUserQuestion
requires_args: true
argument_hint: "[spec-file-path]"
usage_examples:
  - "/split-spec specs/large-feature.md"
  - "/split-spec specs/complex-migration.md"
---

# Split Spec into Phases

Split a large specification into smaller, incrementally verifiable phases. Each phase will be a standalone spec that can be implemented and validated independently before moving to the next phase.

## Instructions

- Read the source spec file provided as `$ARGUMENTS`
- Analyze the spec structure, understanding its Implementation Plan, Step by Step Tasks, and Validation Commands
- Create a subdirectory named after the spec (without .md extension) in the specs/ folder
- Split the spec into logical phases that:
  - Build on each other incrementally
  - Can be validated independently with tests/commands
  - Have clear completion criteria
  - Maintain the original spec's goals but in smaller chunks
- Each phase should be a complete, executable spec following the same format as the original
- Create a phase index file (00-index.md) documenting the phase sequence and dependencies
- Move the original spec into the subdirectory as 00-original.md for reference

## Splitting Strategy

**Identify Natural Breakpoints:**
- Look for the Implementation Plan phases in the original spec
- Examine Step by Step Tasks for logical groupings
- Consider dependencies between tasks (some must come before others)
- Find validation checkpoints where progress can be verified

**Phase Design Principles:**
- Each phase should be completable in a single focused session
- Each phase must have its own validation commands that pass independently
- Early phases should establish foundation for later phases
- Later phases should build on validated earlier work
- Avoid circular dependencies between phases

**Phase Size Guidelines:**
- Aim for 3-7 phases for most specs
- Very large specs (>300 lines) may need 7-10 phases
- Each phase should be roughly 50-150 lines of tasks
- If a phase feels too large, split it further

## Phase Spec Format

Each phase spec should follow this structure:

```md
# Phase N: <Phase Name>

## Phase Description
<Brief description of what this phase accomplishes>

## Phase Dependencies
<List which phases must be completed before this one, or "None - Foundation Phase">

## Phase Goals
<3-5 bullet points of specific goals this phase achieves>

## Relevant Files
<Files that will be created or modified in this phase>

### New Files
<Files that will be created in this phase specifically>

## Step by Step Tasks
<Tasks for THIS phase only, in execution order>

### Task Group 1
- Specific task
- Another specific task

### Task Group 2
- Specific task
- Another specific task

## Validation Commands
Execute every command to validate this phase is complete with zero regressions.

<List commands that verify THIS phase is complete. Should be a subset of the original spec's validation commands, plus any phase-specific checks>

## Success Criteria
<Specific, measurable criteria that indicate this phase is complete and validated>

## Notes
<Any phase-specific notes, gotchas, or considerations>
```

## Index File Format

Create `00-index.md` to document the phase structure:

```md
# <Original Spec Name> - Phase Index

## Overview
<Brief description of what the original spec accomplishes>

## Phase Breakdown

### Phase 1: <Name>
**File:** `01-<name>.md`
**Dependencies:** None
**Goals:** <Brief summary>
**Validation:** <Key validation command>

### Phase 2: <Name>
**File:** `02-<name>.md`
**Dependencies:** Phase 1
**Goals:** <Brief summary>
**Validation:** <Key validation command>

### Phase 3: <Name>
**File:** `03-<name>.md`
**Dependencies:** Phase 2
**Goals:** <Brief summary>
**Validation:** <Key validation command>

<Continue for all phases>

## Execution Order

Execute phases in numerical order:
1. Phase 1: <Name> - Foundation
2. Phase 2: <Name> - Builds on Phase 1
3. Phase 3: <Name> - Integrates Phase 1 and 2
<Continue for all phases>

## Original Spec

The complete original specification is available in `00-original.md` for reference.

## Notes
- Create a git worktree before implementing each phase for isolation
<Any important notes about the phase structure, dependencies, or execution strategy>
```

## Execution Steps

1. **Read and Analyze Source Spec**
   - Read the spec file provided in `$ARGUMENTS`
   - Identify the Implementation Plan phases
   - Map out Step by Step Tasks and group them logically
   - Note all Validation Commands

2. **Create Subdirectory Structure**
   - Extract spec name from filename (remove .md extension)
   - Create `.agents/_specs/<spec-name>/` subdirectory
   - Move original spec to `.agents/_specs/<spec-name>/00-original.md`

3. **Design Phase Breakdown**
   - Determine optimal number of phases based on spec size and complexity
   - Map tasks to phases based on dependencies
   - Ensure each phase has clear validation criteria
   - Verify phases build incrementally

4. **Create Phase Specs**
   - For each phase, create `0N-<phase-name>.md` where N is the phase number
   - Include only the tasks relevant to that phase
   - Add phase-specific validation commands
   - Reference dependencies on previous phases
   - Add success criteria specific to the phase

5. **Create Index File**
   - Create `00-index.md` with phase overview
   - Document phase dependencies clearly
   - Provide execution order guidance
   - Link to original spec for reference

6. **Validate Phase Structure**
   - Verify all original tasks are covered across phases
   - Check that validation commands are distributed appropriately
   - Ensure no circular dependencies exist
   - Confirm each phase can be validated independently

## Example Split

For a spec with these Implementation Plan phases:
- Phase 1: Foundation
- Phase 2: Core Implementation
- Phase 3: Integration

You might split into:

**Phase 1: Foundation Setup (01-foundation-setup.md)**
- Workspace initialization
- Configuration files
- Basic directory structure
- Validation: Structure exists, configs are valid

**Phase 2: Core Package (02-core-package.md)**
- Dependencies: Phase 1
- Create core package with dependencies
- Implement core modules
- Write core tests
- Validation: Core tests pass, package imports work

**Phase 3: API Package (03-api-package.md)**
- Dependencies: Phase 1, Phase 2
- Create API package
- Implement FastAPI app
- Write API tests
- Validation: API tests pass, server starts

**Phase 4: CLI Package (04-cli-package.md)**
- Dependencies: Phase 1, Phase 2
- Create CLI package
- Implement CLI commands
- Write CLI tests
- Validation: CLI tests pass, commands execute

**Phase 5: Integration (05-integration.md)**
- Dependencies: All previous phases
- Docker Compose setup
- Development scripts
- Full workspace validation
- Validation: All validation commands pass

## Output

After splitting, provide a summary:

### Summary
- Original spec: `<path>`
- Phases created: `<number>`
- Subdirectory: `.agents/_specs/<spec-name>/`

### Phase Structure
1. Phase 1: <Name> - <Brief description>
2. Phase 2: <Name> - <Brief description>
3. Phase 3: <Name> - <Brief description>
<Continue for all phases>

### Files Created
- `.agents/_specs/<spec-name>/00-index.md` - Phase index and execution guide
- `.agents/_specs/<spec-name>/00-original.md` - Original complete spec
- `.agents/_specs/<spec-name>/01-<name>.md` - Phase 1
- `.agents/_specs/<spec-name>/02-<name>.md` - Phase 2
<Continue for all phases>

### Next Steps
Execute phases in order starting with Phase 1. Each phase should be fully implemented and validated before proceeding to the next phase.

## Spec File
Read and split this spec: $ARGUMENTS
