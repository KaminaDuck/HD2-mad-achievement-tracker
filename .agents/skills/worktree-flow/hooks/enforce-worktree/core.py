"""
Core validation logic for git worktree enforcement.
Shared across all runtime entrypoints (Claude Code, Cursor, Cline).
"""

import os
import subprocess

# User config directories that are always allowed (expanded from ~)
ALLOWED_USER_DIRS = [
    os.path.expanduser("~/.claude"),
    os.path.expanduser("~/.cursor"),
    os.path.expanduser("~/.cline"),
]


def is_file_in_allowed_dir(file_path: str, cwd: str) -> bool:
    """Check if file is in an allowed user config directory."""
    if not file_path:
        return False

    if not os.path.isabs(file_path):
        file_path = os.path.abspath(os.path.join(cwd, file_path))
    else:
        file_path = os.path.abspath(file_path)

    for allowed_dir in ALLOWED_USER_DIRS:
        allowed_dir = os.path.abspath(allowed_dir)
        try:
            if os.path.commonpath([file_path, allowed_dir]) == allowed_dir:
                return True
        except ValueError:
            continue

    return False


def run_git(args: list[str], cwd: str) -> tuple[bool, str]:
    """Run git command, return (success, stdout)."""
    try:
        result = subprocess.run(
            ["git", *args],
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=5,
        )
        return result.returncode == 0, result.stdout.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return False, ""


def is_inside_worktree(cwd: str) -> tuple[bool | None, str | None]:
    """
    Check if cwd is inside a git worktree (not the main repo).

    Returns:
        (is_worktree, worktree_root)
        - (None, None) if not in a git repo (allow by default)
        - (False, None) if in main repo (should block)
        - (True, root) if in a worktree (allow if file is under root)
    """
    # Check if in a git repo
    ok, is_wt = run_git(["rev-parse", "--is-inside-work-tree"], cwd)
    if not ok or is_wt != "true":
        return None, None  # Not in git repo - allow

    # Get git-dir and git-common-dir
    ok1, git_dir = run_git(["rev-parse", "--git-dir"], cwd)
    ok2, common_dir = run_git(["rev-parse", "--git-common-dir"], cwd)

    if not ok1 or not ok2:
        return None, None  # Fail open

    # Normalize paths
    git_dir_abs = os.path.abspath(os.path.join(cwd, git_dir))
    common_dir_abs = os.path.abspath(os.path.join(cwd, common_dir))

    # If same, we're in main repo; if different, we're in worktree
    if git_dir_abs == common_dir_abs:
        return False, None

    # Get worktree root
    ok, root = run_git(["rev-parse", "--show-toplevel"], cwd)
    return True, root if ok else None


def is_file_under_root(file_path: str, root: str, cwd: str) -> bool:
    """Check if file is under the worktree root."""
    if not os.path.isabs(file_path):
        file_path = os.path.abspath(os.path.join(cwd, file_path))
    else:
        file_path = os.path.abspath(file_path)

    root = os.path.abspath(root)

    try:
        return os.path.commonpath([file_path, root]) == root
    except ValueError:
        return False


def is_file_in_worktree_dir(file_path: str, cwd: str) -> tuple[bool, str | None]:
    """
    Check if file path is inside a .worktrees/ or worktrees/ directory.

    Returns (is_in_worktree, worktree_root) where worktree_root is the
    specific worktree directory containing the file.
    """
    if not os.path.isabs(file_path):
        file_path = os.path.abspath(os.path.join(cwd, file_path))
    else:
        file_path = os.path.abspath(file_path)

    # Check for .worktrees/ or worktrees/ in the path
    path_parts = file_path.split(os.sep)
    for i, part in enumerate(path_parts):
        if part in (".worktrees", "worktrees"):
            # Found worktree directory marker
            # The worktree root is the next directory after .worktrees/
            if i + 1 < len(path_parts):
                worktree_root = os.sep.join(path_parts[: i + 2])
                # Verify it's actually a git worktree
                if os.path.isdir(worktree_root):
                    git_file = os.path.join(worktree_root, ".git")
                    if os.path.isfile(git_file):
                        # .git is a file in worktrees, pointing to main repo
                        return True, worktree_root
            break

    return False, None


def check_worktree_access(file_path: str, cwd: str) -> tuple[bool, str | None]:
    """
    Check if file access should be allowed based on worktree rules.

    Returns:
        (allowed: bool, reason: str or None)
        - (True, None) if access is allowed
        - (False, reason) if access should be blocked
    """
    # Allow writes to user config directories
    if is_file_in_allowed_dir(file_path, cwd):
        return True, None

    is_wt, root = is_inside_worktree(cwd)

    # Not in git repo - allow
    if is_wt is None:
        return True, None

    # In main repo - check if target file is in worktree directory
    if is_wt is False:
        if file_path:
            # Check if target file is inside a .worktrees/ or worktrees/ directory
            file_in_wt, _wt_root = is_file_in_worktree_dir(file_path, cwd)
            if file_in_wt:
                # Target file is in a worktree - allow the edit
                return True, None

        # Block - not in worktree and target not in worktree dir
        reason = (
            "BLOCKED: File edits outside git worktrees are not allowed.\n\n"
            "To make changes:\n"
            "1. Create a worktree: git worktree add .worktrees/<name> -b <branch>\n"
            "2. Work from within that directory\n"
            "3. Use /worktree-flow skill for guided setup\n\n"
            f"Current directory: {cwd}"
        )
        if file_path:
            reason += f"\nTarget file: {file_path}"
        return False, reason

    # In worktree - validate file is under worktree root
    if file_path and root and not is_file_under_root(file_path, root, cwd):
        resolved = (
            os.path.abspath(os.path.join(cwd, file_path))
            if not os.path.isabs(file_path)
            else file_path
        )
        reason = (
            "BLOCKED: Cannot edit files outside the current worktree.\n\n"
            f"Worktree root: {root}\n"
            f"Target file: {resolved}"
        )
        return False, reason

    return True, None
