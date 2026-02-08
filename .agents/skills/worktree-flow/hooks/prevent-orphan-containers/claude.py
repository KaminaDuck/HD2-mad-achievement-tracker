#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../../" }
# ///
"""Claude Code PreToolUse hook for preventing orphaned containers."""

import json
import sys
from pathlib import Path

# Import from the hook's core module (same directory)
sys.path.insert(0, str(Path(__file__).parent))
from core import check_worktree_removal


def main() -> None:
    """Process hook input and check for orphan container risk."""
    try:
        data = json.load(sys.stdin)
    except json.JSONDecodeError:
        sys.exit(0)  # Invalid input, allow operation

    tool_name = data.get("tool_name", "")
    tool_input = data.get("tool_input", {})
    cwd = data.get("cwd", "")

    # Only check Bash commands
    if tool_name != "Bash":
        sys.exit(0)

    command = tool_input.get("command", "")

    # Check if this is a worktree remove command
    if "git" not in command or "worktree" not in command or "remove" not in command:
        sys.exit(0)

    result = check_worktree_removal(command, cwd)

    if result.allowed:
        sys.exit(0)
    else:
        print(result.reason, file=sys.stderr)
        sys.exit(2)  # Exit 2 blocks the operation


if __name__ == "__main__":
    main()
