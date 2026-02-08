#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# ///

"""
Claude Code entrypoint for git worktree enforcement.
Event: PreToolUse (matcher: "Edit", "Write", "MultiEdit", "NotebookEdit")

Input format:
{
    "tool_name": "Edit",
    "tool_input": {"file_path": "...", ...},
    "cwd": "/path/to/project"
}

Output: stderr message + exit code 2 to block
"""

import json
import os
import sys
from pathlib import Path

# Import core logic (relative import workaround for uv run)
sys.path.insert(0, str(Path(__file__).parent))
from core import check_worktree_access

BLOCKED_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}


def get_file_path(tool_input: dict) -> str:
    """Extract file path from tool input."""
    return (
        tool_input.get("file_path")
        or tool_input.get("notebook_path")
        or (
            tool_input.get("files", [{}])[0].get("file_path")
            if tool_input.get("files")
            else ""
        )
        or ""
    )


def main():
    try:
        # Read JSON input from stdin
        input_data = json.load(sys.stdin)

        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        cwd = input_data.get("cwd", os.getcwd())

        # Only process file editing tools
        if tool_name not in BLOCKED_TOOLS:
            sys.exit(0)

        file_path = get_file_path(tool_input)

        # Check worktree access
        allowed, reason = check_worktree_access(file_path, cwd)

        if not allowed:
            print(reason, file=sys.stderr)
            sys.exit(2)  # Exit code 2 blocks tool call

        sys.exit(0)

    except json.JSONDecodeError:
        # Gracefully handle JSON decode errors
        sys.exit(0)
    except Exception:
        # Handle any other errors gracefully
        sys.exit(0)


if __name__ == "__main__":
    main()
