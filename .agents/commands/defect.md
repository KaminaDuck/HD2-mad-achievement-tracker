---
title: "Defect Planning"
description: "Create a detailed plan to resolve a defect with root cause analysis and fix strategy"
type: "command"
tags: ["planning", "defect", "bug", "fix", "debugging", "specs"]
category: "development"
subcategory: "planning"
version: "1.0"
last_updated: "2025-11-03"
status: "stable"
allowed-tools: Read, Write, Glob, Grep, Task, AskUserQuestion
requires_args: true
argument_hint: "[defect-description]"
usage_examples:
  - "/defect API returns 500 error on user login"
  - "/defect Search results not highlighting keywords"
  - "/defect Memory leak in background worker"
---

# Defect Planning

Create a new plan in specs/*.md to resolve the `defect` using the exact specified markdown `Plan Format`. Follow the `Instructions` to create the plan use the `Relevant Files` to focus on the right files.

## Instructions

- You're writing a plan to resolve a defect, it should be thorough and precise so we fix the root cause and prevent regressions.
- Create the plan in the `.agents/_specs/*.md` file. Name it appropriately based on the `defect`.
- Use the plan format below to create the plan. 
- Research the codebase to understand the defect, reproduce it, and put together a plan to fix it.
- IMPORTANT: Replace every <placeholder> in the `Plan Format` with the requested value. Add as much detail as needed to fix the defect.
- Use your reasoning model: THINK HARD about the defect, its root cause, and the steps to fix it properly.
- IMPORTANT: Be surgical with your defect fix, solve the defect at hand and don't fall off track.
- IMPORTANT: We want the minimal number of changes that will fix and address the defect.
- Don't use decorators. Keep it simple.
- If you need a new library, use `uv add` and be sure to report it in the `Notes` section of the `Plan Format`.
- Respect requested files in the `Relevant Files` section.
- Start your research by reading the `README.md` file.

## Relevant Files

Focus on the following files:
- `README.md` - Contains the project overview and instructions.
- `app/**` - Contains the codebase client/server.
- `scripts/**` - Contains the scripts to start and stop the server + client.

Ignore all other files in the codebase.

## Plan Format

```md
# defect: <defect name>

## defect Description
<describe the defect in detail, including symptoms and expected vs actual behavior>

## Problem Statement
<clearly define the specific problem that needs to be solved>

## Solution Statement
<describe the proposed solution approach to fix the defect>

## Steps to Reproduce
<list exact steps to reproduce the defect>

## Root Cause Analysis
<analyze and explain the root cause of the defect>

## Relevant Files
Use these files to fix the defect:

<find and list the files that are relevant to the defect describe why they are relevant in bullet points. If there are new files that need to be created to fix the defect, list them in an h3 'New Files' section.>

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

<list step by step tasks as h3 headers plus bullet points. use as many h3 headers as needed to fix the defect. Order matters, start with the foundational shared changes required to fix the defect then move on to the specific changes required to fix the defect. Include tests that will validate the defect is fixed with zero regressions. Your last step should be running the `Validation Commands` to validate the defect is fixed with zero regressions.>

## Validation Commands
Execute every command to validate the defect is fixed with zero regressions.

<list commands you'll use to validate with 100% confidence the defect is fixed with zero regressions. every command must execute without errors so be specific about what you want to run to validate the defect is fixed with zero regressions. Include commands to reproduce the defect before and after the fix.>
- `cd app/server && uv run pytest` - Run server tests to validate the defect is fixed with zero regressions

## Notes
- Create a git worktree for isolated implementation
<optionally list any additional notes or context that are relevant to the defect that will be helpful to the developer>
```

## defect
$ARGUMENTS