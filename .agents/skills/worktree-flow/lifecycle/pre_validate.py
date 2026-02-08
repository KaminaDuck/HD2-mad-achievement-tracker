#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../" }
# ///
"""Pre-validation hook: Check services and auto-start if needed."""

import subprocess
import sys
from pathlib import Path

from worktree_flow.lib.common import get_worktree_root, read_ports
from worktree_flow.lib.container_runtime import get_runtime
from worktree_flow.lib.services import (
    check_all_services,
    count_running_containers,
    get_container_status,
    load_services,
)


def _try_start_services(root: Path) -> int:
    """Attempt to start services and return running container count."""
    try:
        result = subprocess.run(
            ["make", "worktree-dev"],
            cwd=root,
            capture_output=True,
            text=True,
            timeout=120,
        )
    except subprocess.TimeoutExpired:
        print("[pre_validate] Warning: Service startup timed out")
        return 0
    except FileNotFoundError:
        print("[pre_validate] Warning: 'make' not found - cannot auto-start services")
        return 0

    if result.returncode != 0:
        print("[pre_validate] Warning: Failed to start services")
        err = result.stderr[:200] if result.stderr else "No error output"
        print(f"[pre_validate] {err}")
        return 0

    print("[pre_validate] Services started successfully")
    container_status = get_container_status(root)
    return count_running_containers(container_status) if container_status else 0


def main() -> None:
    root = get_worktree_root()

    # Load services config (optional)
    config = load_services(root)

    # No service config = repo doesn't use containers, skip entirely
    if not config:
        print("[pre_validate] No service configuration - skipping")
        return

    ports = read_ports(root)
    if not ports:
        print("[pre_validate] ERROR: No port configuration found")
        print("[pre_validate] Run 'make worktree-setup' first")
        sys.exit(1)

    # Check container runtime availability
    container_status = get_container_status(root)
    if container_status is None:
        print("[pre_validate] Container runtime not available - skipping container checks")
        return

    running = count_running_containers(container_status)

    if running == 0:
        print("[pre_validate] No containers running - auto-starting...")
        running = _try_start_services(root)

    # Check service health
    health = check_all_services(config, ports)
    all_healthy = all(health.values()) if health else False

    print(f"\n[pre_validate] Service Health ({running} containers running):")
    for name, healthy in health.items():
        status = "UP" if healthy else "DOWN"
        print(f"[pre_validate]   {name}: [{status}]")

    if not all_healthy:
        runtime = get_runtime()
        logs_cmd = runtime.get_logs_command() if runtime else "docker compose logs"
        print("\n[pre_validate] Some services are not responding.")
        print(f"[pre_validate] Check logs with: {logs_cmd}")


if __name__ == "__main__":
    main()
