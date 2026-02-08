#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../" }
# ///
"""Post-initialization hook: Display completion message and service endpoints."""

from worktree_flow.lib.common import get_worktree_root, read_ports
from worktree_flow.lib.services import load_services, print_endpoints


def main() -> None:
    root = get_worktree_root()
    print("\n=== Worktree Initialized ===")
    print(f"Location: {root}")

    # Load services config (optional)
    config = load_services(root)
    ports = read_ports(root)

    if config and ports:
        print_endpoints(config, ports)
    else:
        print("\nNo service configuration found.")
        print("To enable service features, create .agents/.worktree-services.toml")

    print("\nNext step: Run validation")
    print("  uv run -m worktree_flow.cli transition validated")
    print()


if __name__ == "__main__":
    main()
