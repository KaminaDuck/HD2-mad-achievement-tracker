"""Worktree status dashboard - Python implementation.

Replaces scripts/worktree-status.sh with consistent behavior
and service health indicators.
"""

import json
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

from worktree_flow.lib.common import read_ports, read_status
from worktree_flow.lib.output import (
    BLUE,
    CYAN,
    GREEN,
    RED,
    RESET,
    get_phase_color,
)
from worktree_flow.lib.services import check_all_services, load_services


@dataclass
class WorktreeInfo:
    """Information about a single worktree."""

    path: str
    branch: str
    phase: str
    server_port: str
    webui_port: str
    behind_main: str
    orphaned: bool
    timestamps: dict[str, str]
    services_healthy: dict[str, bool] | None = None


def get_main_repo_root() -> Path | None:
    """Get the main repository root."""
    try:
        result = subprocess.run(
            ["git", "worktree", "list", "--porcelain"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            for line in result.stdout.splitlines():
                if line.startswith("worktree "):
                    return Path(line[9:])
    except (FileNotFoundError, subprocess.SubprocessError):
        pass
    return None


def get_worktrees() -> list[WorktreeInfo]:
    """Get information about all worktrees in .worktrees/ directory."""
    main_root = get_main_repo_root()
    if not main_root:
        return []

    worktrees_dir = main_root / ".worktrees"
    if not worktrees_dir.exists():
        return []

    worktrees = []
    registered: set[str] = set()

    # Parse git worktree list --porcelain
    try:
        result = subprocess.run(
            ["git", "worktree", "list", "--porcelain"],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0:
            current_wt = ""
            current_branch = ""

            for line in result.stdout.splitlines() + [""]:
                if line.startswith("worktree "):
                    current_wt = line[9:]
                    current_branch = ""
                elif line.startswith("branch refs/heads/"):
                    current_branch = line[18:]
                elif line == "" and current_wt:
                    if current_wt.startswith(str(worktrees_dir)):
                        registered.add(current_wt)
                        wt_info = _parse_worktree(
                            current_wt,
                            current_branch or "(detached)",
                            main_root,
                            orphaned=False,
                        )
                        worktrees.append(wt_info)
                    current_wt = ""
                    current_branch = ""
    except (FileNotFoundError, subprocess.SubprocessError):
        pass

    # Scan for orphaned directories
    try:
        for entry in worktrees_dir.iterdir():
            if entry.is_dir() and not entry.name.startswith("."):
                if str(entry) not in registered:
                    wt_info = _parse_worktree(
                        str(entry),
                        "(orphaned)",
                        main_root,
                        orphaned=True,
                    )
                    worktrees.append(wt_info)
    except (FileNotFoundError, PermissionError):
        pass

    return worktrees


def _parse_worktree(
    wt_path: str,
    branch: str,
    main_root: Path,
    orphaned: bool,
) -> WorktreeInfo:
    """Parse worktree information from status file."""
    wt_root = Path(wt_path)
    status = read_status(wt_root)
    ports = read_ports(wt_root)

    # Get phase
    phase = status.get("current_phase", "unknown")

    # Get ports
    server_port = str(ports.get("SERVER_PORT", status.get("server_port", "?")))
    webui_port = str(ports.get("WEBUI_PORT", status.get("webui_port", "?")))

    # Calculate staleness
    behind = "?"
    if not orphaned:
        try:
            result = subprocess.run(
                ["git", "-C", wt_path, "rev-list", "--count", "HEAD..origin/main"],
                capture_output=True,
                text=True,
                timeout=5,
            )
            if result.returncode == 0:
                behind = result.stdout.strip()
        except (FileNotFoundError, subprocess.SubprocessError, subprocess.TimeoutExpired):
            pass

    # Get timestamps
    timestamps = {}
    for key in [
        "created_at",
        "initialized_at",
        "validated_at",
        "implementing_at",
        "human-manual-review_at",
        "merged_at",
        "cleaned_at",
    ]:
        if key in status:
            timestamps[key] = status[key]

    # Check service health (if configured)
    services_healthy = None
    config = load_services(wt_root)
    if config and ports:
        services_healthy = check_all_services(config, ports)

    return WorktreeInfo(
        path=str(wt_root.relative_to(main_root)),
        branch=branch,
        phase=phase,
        server_port=server_port,
        webui_port=webui_port,
        behind_main=behind,
        orphaned=orphaned,
        timestamps=timestamps,
        services_healthy=services_healthy,
    )


def truncate(s: str, max_len: int) -> str:
    """Truncate string with ellipsis if too long."""
    if len(s) > max_len:
        return s[: max_len - 3] + "..."
    return s


def print_table(worktrees: list[WorktreeInfo], quiet: bool = False) -> None:
    """Print worktree status as formatted table."""
    if not quiet:
        print(f"{BLUE}========================================{RESET}")
        print(f"{BLUE}  Worktree Status Dashboard{RESET}")
        print(f"{BLUE}========================================{RESET}")
        print()

    # Column widths
    col_wt = 35
    col_branch = 30
    col_phase = 20
    col_ports = 12
    col_behind = 6

    # Header
    print(
        f"{'WORKTREE':<{col_wt}} {'BRANCH':<{col_branch}} "
        f"{'PHASE':<{col_phase}} {'PORTS':<{col_ports}} {'BEHIND':>{col_behind}}"
    )
    print(
        "-" * col_wt,
        "-" * col_branch,
        "-" * col_phase,
        "-" * col_ports,
        "-" * col_behind,
    )

    if not worktrees:
        print(f"{CYAN}No worktrees found in .worktrees/{RESET}")
    else:
        for wt in worktrees:
            path_display = truncate(wt.path, col_wt)
            branch_display = truncate(wt.branch, col_branch)
            phase_text = "orphaned" if wt.orphaned else truncate(wt.phase, col_phase)
            phase_color = RED if wt.orphaned else get_phase_color(wt.phase)
            ports = f"{wt.server_port}:{wt.webui_port}"

            # Add service health indicator if available
            if wt.services_healthy:
                all_healthy = all(wt.services_healthy.values())
                health_indicator = f" {GREEN}●{RESET}" if all_healthy else f" {RED}●{RESET}"
            else:
                health_indicator = ""

            print(
                f"{path_display:<{col_wt}} {branch_display:<{col_branch}} "
                f"{phase_color}{phase_text:<{col_phase}}{RESET} "
                f"{ports:<{col_ports}}{health_indicator} {wt.behind_main:>{col_behind}}"
            )

    if not quiet:
        print()


def print_json(worktrees: list[WorktreeInfo]) -> None:
    """Print worktree status as JSON."""
    data = {
        "worktrees": [
            {
                "path": wt.path,
                "branch": wt.branch,
                "phase": wt.phase,
                "server_port": wt.server_port,
                "webui_port": wt.webui_port,
                "behind_main": wt.behind_main,
                "orphaned": wt.orphaned,
                "timestamps": wt.timestamps,
                "services_healthy": wt.services_healthy,
            }
            for wt in worktrees
        ]
    }
    print(json.dumps(data, indent=2))


def main(args: list[str] | None = None) -> int:
    """Main entry point for status command."""
    import argparse

    parser = argparse.ArgumentParser(description="Worktree status dashboard")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--quiet", "-q", action="store_true", help="Suppress headers")

    parsed = parser.parse_args(args)

    worktrees = get_worktrees()

    if parsed.json:
        print_json(worktrees)
    else:
        print_table(worktrees, quiet=parsed.quiet)

    return 0


if __name__ == "__main__":
    sys.exit(main())
