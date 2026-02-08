#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../" }
# ///
"""Pre-cleanup hook: Stop services and remove generated files."""

from worktree_flow.lib.common import get_worktree_root
from worktree_flow.lib.services import (
    count_running_containers,
    docker_compose_down,
    get_docker_compose_status,
)


def main() -> None:
    root = get_worktree_root()

    print("\n=== Cleanup ===\n")

    # Check for running containers
    docker_status = get_docker_compose_status(root)
    running = count_running_containers(docker_status)

    if running > 0:
        print(f"Stopping {running} Docker containers...")
        if docker_compose_down(root):
            print("[OK] Containers stopped")
        else:
            print("[!] Failed to stop containers - you may need to stop them manually")
    else:
        print("[OK] No Docker containers running")

    # Remove generated files
    files_to_remove = [
        ".worktree-ports",
        ".worktree-ports.mk",
        ".worktree-startup-performance.log",
    ]

    for filename in files_to_remove:
        file_path = root / filename
        if file_path.exists():
            file_path.unlink()
            print(f"[OK] Removed {filename}")

    # Note: worktree-status.toml is removed by the CLI after transition

    print("\nCleanup complete. Worktree can now be removed:")
    print(f"  git worktree remove {root}")
    print()


if __name__ == "__main__":
    main()
