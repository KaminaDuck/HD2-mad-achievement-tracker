#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["jinja2", "worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../../" }
# ///

"""
Claude Code hook for review request before git commit.
Event: PreToolUse (matcher: "Bash")

Intercepts git commit commands and displays a formatted review request
using a Jinja template before allowing the commit to proceed.

Input format:
{
    "tool_name": "Bash",
    "tool_input": {"command": "git commit ..."},
    "cwd": "/path/to/project"
}

Output: stderr message with review request, exit 0 to allow after showing info
"""

import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from core import COMMIT_ALLOWED_PHASES, generate_review_request, is_commit_allowed


def is_git_commit(command: str) -> bool:
    """Check if command is a git commit."""
    # Match git commit with various flags
    return bool(re.search(r'\bgit\s+commit\b', command))


def extract_effective_cwd(command: str, base_cwd: str) -> str:
    """Extract effective cwd if command starts with 'cd path &&'."""
    # Match: cd <path> && <rest of command>
    match = re.match(r'^cd\s+([^\s&]+)\s*&&', command)
    if match:
        cd_path = match.group(1)
        # Resolve relative to base_cwd
        target = Path(base_cwd) / cd_path
        if target.exists():
            return str(target.resolve())
    return base_cwd


def main() -> None:
    try:
        input_data = json.load(sys.stdin)

        tool_name = input_data.get("tool_name", "")
        tool_input = input_data.get("tool_input", {})
        cwd = input_data.get("cwd", os.getcwd())

        # Only process Bash tool
        if tool_name != "Bash":
            sys.exit(0)

        command = tool_input.get("command", "")

        # Only intercept git commit commands
        if not is_git_commit(command):
            sys.exit(0)

        # Extract effective cwd if command has 'cd' prefix
        effective_cwd = extract_effective_cwd(command, cwd)

        # Check lifecycle phase
        result = is_commit_allowed(effective_cwd)

        if not result.allowed:
            allowed_phases = ", ".join(sorted(COMMIT_ALLOWED_PHASES))
            message = (
                f"BLOCKED: Cannot commit in '{result.reason}' phase.\n\n"
                f"Commits are only allowed in phases: {allowed_phases}\n\n"
                "To proceed, transition to the 'human-manual-review' phase first:\n"
                "  uv run skills/worktree-flow/hooks/"
                "worktree-state/cli.py transition human-manual-review"
            )
            print(message, file=sys.stderr)
            sys.exit(2)

        # Generate and display review request
        review = generate_review_request(effective_cwd)
        print(review, file=sys.stderr)

        # Exit 0 to allow commit
        sys.exit(0)

    except json.JSONDecodeError:
        sys.exit(0)
    except Exception as e:
        # Log error but don't block
        print(f"[request-review] Error: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
