"""
Core logic for protecting worktree-status.toml from manual edits.
Forces use of worktree-state CLI for state transitions.
"""

from pathlib import Path

STATUS_FILE_NAME = "worktree-status.toml"


def is_status_file_edit(file_path: str) -> bool:
    """Check if the file path targets the worktree status file."""
    if not file_path:
        return False

    path = Path(file_path)
    return path.name == STATUS_FILE_NAME


def get_block_message() -> str:
    """Get the message to display when blocking manual edits."""
    return f"""BLOCKED: Direct edits to {STATUS_FILE_NAME} are not allowed.

The worktree status file is managed by the lifecycle state machine.
Use the worktree-state CLI to transition between phases:

  uv run skills/worktree-flow/hooks/worktree-state/cli.py show
  uv run skills/worktree-flow/hooks/worktree-state/cli.py transition <phase>
  uv run skills/worktree-flow/hooks/worktree-state/cli.py phases

This ensures proper phase transitions and maintains lifecycle integrity."""
