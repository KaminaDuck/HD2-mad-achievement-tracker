#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

"""
Cline entrypoint for git worktree enforcement.
Event: PreToolUse (toolName: "write_to_file", "apply_diff")

Input format:
{
    "clineVersion": "...",
    "hookName": "PreToolUse",
    "timestamp": "...",
    "taskId": "...",
    "workspaceRoots": ["/path/to/project"],
    "preToolUse": {
        "toolName": "write_to_file",
        "parameters": {"path": "...", ...}
    }
}

Output: JSON with cancel field
{"cancel": true, "errorMessage": "..."} or {"cancel": false}
"""

import json
import os
import sys
from pathlib import Path

# Import core logic and shared utilities
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent.parent))
from cline_shared import persist_abort_context
from core import check_worktree_access

BLOCKED_TOOLS = {"write_to_file", "apply_diff"}


def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        # Extract task ID for abort persistence
        task_id = input_data.get("taskId", "")

        # Extract from Cline's nested structure
        pre_tool_use = input_data.get("preToolUse", {})
        tool_name = pre_tool_use.get("toolName", "")
        parameters = pre_tool_use.get("parameters", {})

        # Get workspace root as cwd
        workspace_roots = input_data.get("workspaceRoots", [])
        cwd = workspace_roots[0] if workspace_roots else os.getcwd()

        # Only process file writing tools
        if tool_name not in BLOCKED_TOOLS:
            print(json.dumps({"cancel": False}))
            sys.exit(0)

        # Extract file path (Cline uses "path" for file operations)
        file_path = parameters.get("path", "") or parameters.get("file_path", "")

        # Check worktree access
        allowed, reason = check_worktree_access(file_path, cwd)

        if not allowed:
            context = (
                "WORKSPACE_RULE: File edits outside git worktrees are not allowed "
                "in this project. "
                f"The file '{file_path}' cannot be edited directly on the main branch. "
                "REQUIRED: Create a git worktree first using "
                "'git worktree add .worktrees/<name> -b <branch>', "
                "then work from within that directory. This ensures safe isolation of "
                "changes. Please create a worktree and retry your file edit from there."
            )

            # Persist context for TaskResume to inject
            if task_id:
                persist_abort_context(task_id, context, reason)

            print(json.dumps({
                "cancel": True,
                "errorMessage": reason
            }))
            sys.exit(0)

        print(json.dumps({"cancel": False}))
        sys.exit(0)

    except json.JSONDecodeError:
        print(json.dumps({"cancel": False}))
        sys.exit(0)
    except Exception:
        print(json.dumps({"cancel": False}))
        sys.exit(0)


if __name__ == "__main__":
    main()
