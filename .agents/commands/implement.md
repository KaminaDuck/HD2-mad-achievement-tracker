---
title: "Implement Plan"
description: "Execute a specification plan and implement the described functionality with validation"
type: "command"
tags: ["implementation", "execution", "specs", "coding", "validation"]
category: "development"
subcategory: "implementation"
version: "1.0"
last_updated: "2025-11-03"
status: "stable"
allowed-tools: Read, Write, Edit, Bash, Glob, Grep, Task
requires_args: true
argument_hint: "[spec-file-path]"
usage_examples:
  - "/implement specs/feature-name.md"
  - "/implement specs/defect-fix.md"
---

# Implement the following plan
Follow the `Instructions` to implement the `Plan` then `Report` the completed work.

## Instructions
- Create a git worktree for isolated implementation before starting work
- Read the plan, think hard about the plan and implement the plan.
- Run validation commands to validate the work is complete with zero regressions.

## Plan
$ARGUMENTS

## Report
- Summarize the work you've just done in a concise bullet point list.
- Add resolution details for each step in the plan to the spec and note any major redirections or changes from the original plan.
- Report the files and total lines changed with `git diff --stat`
- If you complete all aspects of the spec and the user approves the work then you should move it to the archive within the spec folder or subfolder. 
