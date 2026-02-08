#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""
Claude Code entrypoint for enforce-implementing hook.
Event: PreToolUse (matcher: "Edit", "Write", "MultiEdit", "NotebookEdit")

Blocks file editing operations unless the worktree is in the 'implementing' phase.

Input format:
{
    "tool_name": "Edit",
    "tool_input": {"file_path": "...", ...},
    "cwd": "/path/to/cwd"
}

Output: stderr message + exit code 2 to block
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from core import get_block_message, get_worktree_from_path, is_edit_allowed

BLOCKED_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}


def main():
    try:
        input_data = json.load(sys.stdin)

        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        file_path = tool_input.get("file_path", "")

        if tool_name not in BLOCKED_TOOLS:
            sys.exit(0)

        if not file_path:
            sys.exit(0)

        worktree_path = get_worktree_from_path(file_path)
        if worktree_path is None:
            sys.exit(0)

        result = is_edit_allowed(worktree_path)

        if not result.allowed and result.reason:
            print(get_block_message(result.reason), file=sys.stderr)
            sys.exit(2)

        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception:
        sys.exit(0)


if __name__ == "__main__":
    main()
