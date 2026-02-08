"""Lifecycle hook execution engine.

Hooks are optional - if a hook script doesn't exist, it's skipped silently.
Hook failures log warnings but don't block transitions.
"""

import os
import subprocess
import sys
from pathlib import Path
from typing import Literal

from worktree_flow.core.config import get_config

# Valid hook points
HOOK_POINTS = [
    "post_init",  # After transitioning to initialized
    "pre_validate",  # Before transitioning to validated
    "pre_review",  # Before transitioning to human-manual-review
    "pre_merge",  # Before transitioning to merged
    "pre_cleanup",  # Before transitioning to cleaned
]

HookPoint = Literal["post_init", "pre_validate", "pre_review", "pre_merge", "pre_cleanup"]

# Default hook paths (relative to project root)
DEFAULT_HOOK_PATHS = {
    "post_init": "skills/worktree-flow/lifecycle/post_init.py",
    "pre_validate": "skills/worktree-flow/lifecycle/pre_validate.py",
    "pre_review": "skills/worktree-flow/lifecycle/pre_review.py",
    "pre_merge": "skills/worktree-flow/lifecycle/pre_merge.py",
    "pre_cleanup": "skills/worktree-flow/lifecycle/pre_cleanup.py",
}

# Map phases to their hooks
PHASE_HOOKS: dict[str, list[HookPoint]] = {
    "initialized": ["post_init"],
    "validated": ["pre_validate"],
    "human-manual-review": ["pre_review"],
    "merged": ["pre_merge"],
    "cleaned": ["pre_cleanup"],
}


def _get_repo_root() -> Path:
    """Get the git repository root, falling back to cwd."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            return Path(result.stdout.strip())
    except (FileNotFoundError, subprocess.SubprocessError):
        pass
    return Path.cwd()


def get_hook_paths() -> dict[str, str]:
    """Get hook paths from config, with defaults.

    Looks for [lifecycle.hooks] section in .worktree-config.toml.
    Falls back to DEFAULT_HOOK_PATHS for missing entries.

    Note: get_config() returns flat keys (e.g., "post_init" not
    "lifecycle.hooks.post_init") since it parses key=value lines
    without tracking section context.
    """
    config = get_config()
    hook_paths = dict(DEFAULT_HOOK_PATHS)

    # Override with config values if present
    for hook_point in HOOK_POINTS:
        if hook_point in config:
            hook_paths[hook_point] = config[hook_point]

    return hook_paths


def get_hook_path(hook_point: HookPoint) -> Path | None:
    """Get the path to a hook script, or None if it doesn't exist.

    Resolves path relative to git repo root.
    """
    hook_paths = get_hook_paths()
    relative_path = hook_paths.get(hook_point)

    if not relative_path:
        return None

    repo_root = _get_repo_root()

    hook_path = repo_root / relative_path

    if hook_path.exists():
        return hook_path
    return None


def run_lifecycle_hook(
    hook_point: HookPoint,
    worktree_root: Path | None = None,
    timeout: int = 60,
) -> tuple[bool, str]:
    """Execute a lifecycle hook if it exists.

    Args:
        hook_point: Which hook to run
        worktree_root: Working directory for hook execution
        timeout: Max seconds to wait for hook

    Returns:
        (success, message) - success is True if hook ran or was skipped,
        False only if hook failed. Message describes what happened.
    """
    hook_path = get_hook_path(hook_point)

    if hook_path is None:
        return True, f"Hook {hook_point} skipped (script not found)"

    cwd = worktree_root or Path.cwd()

    try:
        # Run hook with uv
        result = subprocess.run(
            ["uv", "run", str(hook_path)],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "WORKTREE_PATH": str(cwd)},
        )

        if result.returncode == 0:
            # Print hook output to stdout
            if result.stdout:
                print(result.stdout, end="")
            return True, f"Hook {hook_point} completed"
        else:
            # Hook failed - warn but don't block
            stderr = result.stderr.strip()[:200] if result.stderr else "No error output"
            return True, f"Hook {hook_point} failed (non-blocking): {stderr}"

    except subprocess.TimeoutExpired:
        return True, f"Hook {hook_point} timed out after {timeout}s (non-blocking)"
    except FileNotFoundError:
        return True, f"Hook {hook_point} skipped (uv not found)"
    except Exception as e:
        return True, f"Hook {hook_point} error (non-blocking): {e}"


def run_phase_hooks(
    phase: str,
    worktree_root: Path | None = None,
) -> list[tuple[str, bool, str]]:
    """Run all hooks for a phase transition.

    Returns list of (hook_point, success, message) tuples.
    """
    hook_points = PHASE_HOOKS.get(phase, [])
    results = []

    for hook_point in hook_points:
        success, message = run_lifecycle_hook(hook_point, worktree_root)
        results.append((hook_point, success, message))
        print(f"  [{hook_point}] {message}", file=sys.stderr)

    return results
