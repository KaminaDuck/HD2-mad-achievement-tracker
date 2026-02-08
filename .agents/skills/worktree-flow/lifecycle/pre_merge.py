#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../" }
# ///
"""Pre-merge hook: Verify merge readiness."""

from worktree_flow.lib.common import get_worktree_root, read_ports, run_git
from worktree_flow.lib.services import (
    check_all_services,
    load_services,
)


def main() -> None:
    root = get_worktree_root()

    print("\n=== Merge Readiness Check ===\n")

    # Check for uncommitted changes
    status = run_git(["status", "--porcelain"], root)
    if status:
        print("[!] Uncommitted changes detected:")
        for line in status.splitlines()[:5]:
            print(f"    {line}")
        if len(status.splitlines()) > 5:
            print(f"    ... and {len(status.splitlines()) - 5} more")
        print()
    else:
        print("[OK] No uncommitted changes")

    # Check services (if configured)
    config = load_services(root)
    if config:
        ports = read_ports(root)
        if ports:
            health = check_all_services(config, ports)
            all_healthy = all(health.values())
            if all_healthy:
                print("[OK] All services healthy")
            else:
                unhealthy = [n for n, h in health.items() if not h]
                print(f"[!] Unhealthy services: {', '.join(unhealthy)}")
        else:
            print("[?] No port configuration - skipping service check")
    else:
        print("[?] No service configuration - skipping service check")

    # Check branch is up to date
    behind = run_git(["rev-list", "--count", "HEAD..origin/main"], root)
    if behind and behind.isdigit() and int(behind) > 0:
        print(f"[!] Branch is {behind} commits behind main")
    else:
        print("[OK] Branch is up to date with main")

    print("\nReady for merge. Next steps:")
    print("  1. Create PR: gh pr create")
    print("  2. After merge: uv run -m worktree_flow.cli transition merged")
    print()


if __name__ == "__main__":
    main()
