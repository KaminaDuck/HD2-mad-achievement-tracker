---
title: "Task Planning"
description: "Create a detailed plan to accomplish a general task with thorough steps and validation"
type: "command"
tags: ["planning", "task", "chore", "specs", "implementation"]
category: "development"
subcategory: "planning"
version: "1.0"
last_updated: "2025-11-03"
status: "stable"
allowed-tools: Read, Write, Glob, Grep, Task, AskUserQuestion
requires_args: true
argument_hint: "[task-description]"
usage_examples:
  - "/task Upgrade dependencies to latest versions"
  - "/task Add logging to all API endpoints"
  - "/task Refactor database connection pooling"
---

# Task Planning

Create a new plan in specs/*.md to resolve the `task` using the exact specified markdown `Plan Format`. Follow the `Instructions` to create the plan use the `Relevant Files` to focus on the right files.

## Instructions

- You're writing a plan to resolve a task, it should be simple but we need to be thorough and precise so we don't miss anything or waste time with any second round of changes.
- Create the plan in the `.agents/_specs/*.md` file. Name it appropriately based on the `task`.
- Use the plan format below to create the plan. 
- Research the codebase and put together a plan to accomplish the task.
- IMPORTANT: Replace every <placeholder> in the `Plan Format` with the requested value. Add as much detail as needed to accomplish the task.
- Use your reasoning model: THINK HARD about the plan and the steps to accomplish the task.
- Respect requested files in the `Relevant Files` section.
- Start your research by reading the `README.md` file.
- Do not utilize emojis or try to plan timelines in your specs.
- Check project documentation (`docs/`, `references/`, etc.) for any relevant context files to help you draft the plan.

## Relevant Files

Focus on the following files:
- `README.md` - Contains the project overview and instructions.
- `app/**` - Contains the codebase client/server.
- `scripts/**` - Contains the scripts to start and stop the server + client.

Ignore all other files in the codebase.

## Plan Format

```md
# task: <task name>

## task Description
<describe the task in detail>

## Relevant Files
Use these files to resolve the task:

<find and list the files that are relevant to the task describe why they are relevant in bullet points. If there are new files that need to be created to accomplish the task, list them in an h3 'New Files' section.>

## Step by Step Tasks
IMPORTANT: Execute every step in order, top to bottom.

<list step by step tasks as h3 headers plus bullet points. use as many h3 headers as needed to accomplish the task. Order matters, start with the foundational shared changes required to fix the task then move on to the specific changes required to fix the task. Your last step should be running the `Validation Commands` to validate the task is complete with zero regressions.>

## Validation Commands
Execute every command to validate the task is complete with zero regressions.

<list commands you'll use to validate with 100% confidence the task is complete with zero regressions. every command must execute without errors so be specific about what you want to run to validate the task is complete with zero regressions. Don't validate with curl commands.>
- `cd app/server && uv run pytest` - Run server tests to validate the task is complete with zero regressions

## Notes
- Create a git worktree for isolated implementation
<optionally list any additional notes or context that are relevant to the task that will be helpful to the developer>
```

## task
$ARGUMENTS