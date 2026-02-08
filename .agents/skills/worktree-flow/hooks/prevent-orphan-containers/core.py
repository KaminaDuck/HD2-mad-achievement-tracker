"""Core logic for preventing orphaned containers during worktree removal."""

import re
from pathlib import Path

from worktree_flow.lib.common import CheckResult
from worktree_flow.lib.container_runtime import get_runtime
from worktree_flow.lib.services import load_services


def extract_worktree_path(command: str, cwd: str) -> str | None:
    """Extract worktree path from git worktree remove command."""
    # Match: git worktree remove [--force] <path>
    match = re.search(r"git\s+worktree\s+remove\s+(?:--force\s+)?([^\s]+)", command)
    if not match:
        return None

    path = match.group(1).strip().strip('"').strip("'")
    if not path.startswith("/"):
        path = str(Path(cwd) / path)
    return path


def get_compose_project_name(worktree_path: str) -> str:
    """Derive COMPOSE_PROJECT_NAME from worktree path.

    Uses configurable prefix from worktree-services.toml if available,
    otherwise falls back to "worktree" prefix.
    """
    prefix = _get_config_prefix(worktree_path)
    basename = Path(worktree_path).name
    # Docker Compose normalizes names: lowercase, underscores for hyphens
    normalized = basename.lower().replace("-", "_")
    return f"{prefix}_{normalized}"


def _get_config_prefix(worktree_path: str) -> str:
    """Get prefix from config or return default."""
    try:
        config = load_services(Path(worktree_path))
        return config.prefix if config else "worktree"
    except Exception:
        return "worktree"


def get_running_containers(project_name: str) -> list[str]:
    """Get list of running containers for a compose project."""
    runtime = get_runtime()
    if runtime is None:
        return []
    return runtime.ps_filter(project_name)


def check_worktree_removal(command: str, cwd: str) -> CheckResult:
    """Check if worktree removal should be allowed.

    Returns:
        CheckResult with allowed=True if removal is permitted,
        or allowed=False with reason if blocked due to running containers.
    """
    worktree_path = extract_worktree_path(command, cwd)
    if not worktree_path:
        return CheckResult(allowed=True)  # Not a worktree remove command

    # Check if path exists and is a worktree
    if not Path(worktree_path).exists():
        return CheckResult(allowed=True)  # Path doesn't exist, git will handle error

    project_name = get_compose_project_name(worktree_path)
    containers = get_running_containers(project_name)

    if not containers:
        return CheckResult(allowed=True)  # No containers to clean up

    container_list = "\n  - ".join(containers)

    # Get detected runtime for dynamic command suggestions
    runtime = get_runtime()
    down_cmd = runtime.get_down_command() if runtime else "docker compose down"

    reason = f"""BLOCKED: Cannot remove worktree with running containers.

Running containers ({len(containers)}):
  - {container_list}

To cleanup, run one of:
  1. cd {worktree_path} && {down_cmd}
  2. uv run -m worktree_flow.cli transition cleaned
  3. make worktree-cleanup WT={worktree_path}

After cleanup, retry the worktree removal."""
    return CheckResult(allowed=False, reason=reason)
