#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Claude Code hook to protect worktree-status.toml from manual edits.
Event: PreToolUse (matcher: "Edit", "Write", "MultiEdit")

Blocks direct edits to the status file, directing users to use the
worktree-state CLI for proper state transitions.

Input format:
{
    "tool_name": "Edit",
    "tool_input": {"file_path": "...", ...},
    "cwd": "/path/to/project"
}

Output: stderr message + exit code 2 to block
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from core import get_block_message, is_status_file_edit

BLOCKED_TOOLS = {"Edit", "Write", "MultiEdit"}


def get_file_path(tool_input: dict) -> str:
    """Extract file path from tool input."""
    if file_path := tool_input.get("file_path"):
        return file_path

    files = tool_input.get("files", [])
    if files and (first_file := files[0].get("file_path")):
        return first_file

    return ""


def main():
    try:
        input_data = json.load(sys.stdin)

        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})

        # Only check file editing tools
        if tool_name not in BLOCKED_TOOLS:
            sys.exit(0)

        file_path = get_file_path(tool_input)

        if is_status_file_edit(file_path):
            print(get_block_message(), file=sys.stderr)
            sys.exit(2)  # Exit 2 blocks the tool call

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == "__main__":
    main()
