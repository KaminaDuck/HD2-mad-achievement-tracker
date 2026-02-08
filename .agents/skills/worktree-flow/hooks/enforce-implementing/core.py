"""Core logic for enforce-implementing hook.

Blocks file edits unless the worktree is in the 'implementing' phase.
Self-contained - no external dependencies required.
"""

import re
from dataclasses import dataclass
from pathlib import Path

EDIT_ALLOWED_PHASES = {"implementing"}
WORKTREE_PATTERN = re.compile(r"(.+/\.worktrees/[^/]+)")


@dataclass
class CheckResult:
    """Result of a check operation."""

    allowed: bool
    reason: str | None = None


def get_current_phase(worktree_path: Path) -> str | None:
    """Get current lifecycle phase from worktree status file."""
    status_file = worktree_path / "worktree-status.toml"
    if not status_file.exists():
        return None

    for line in status_file.read_text().splitlines():
        if line.startswith("current_phase"):
            return line.split("=", 1)[1].strip().strip('"') or None
    return None


def get_worktree_from_path(file_path: str) -> str | None:
    """Extract worktree root path from a file path.

    Returns the worktree path if file is inside .worktrees/, None otherwise.
    Only applies worktree-flow logic to files inside .worktrees/ directories.

    Examples:
        /repo/.worktrees/my-feature/src/file.py -> /repo/.worktrees/my-feature
        /repo/src/file.py -> None (not in a worktree)
    """
    match = WORKTREE_PATTERN.match(file_path)
    if match:
        return match.group(1)
    return None


def is_edit_allowed(worktree_path: str) -> CheckResult:
    """Check if file edits are allowed based on lifecycle phase.

    Args:
        worktree_path: Path to the worktree root (containing worktree-status.toml)

    Returns CheckResult with allowed=True/False and phase as reason.
    """
    phase = get_current_phase(Path(worktree_path))
    if phase is None:
        return CheckResult(allowed=True)
    return CheckResult(allowed=(phase in EDIT_ALLOWED_PHASES), reason=phase)


def get_block_message(phase: str) -> str:
    """Generate user-friendly block message."""
    cmd = "uv run -m worktree_flow.cli"
    return (
        f"BLOCKED: File edits not allowed in '{phase}' phase.\n"
        f"\n"
        f"File edits are only permitted during the 'implementing' phase.\n"
        f"Current phase: {phase}\n"
        f"\n"
        f"To continue editing, transition to the implementing phase:\n"
        f"  {cmd} transition implementing"
    )
