#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["jinja2", "worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../../" }
# ///
"""
Standalone review request script for lifecycle phase transitions.

Stages all changes and generates a formatted review request summary.
Used by the worktree state machine when transitioning to 'human-manual-review' phase.

Exit codes:
  0 - Review generated successfully
  1 - Error generating review
"""

import argparse
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from core import generate_review_request


def stage_all_changes(cwd: str) -> None:
    """Stage all changes for review."""
    subprocess.run(["git", "add", "-A"], cwd=cwd, capture_output=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate review request")
    parser.add_argument("--simplified", action="store_true",
                        help="Code simplifier has been run")
    parser.add_argument("--linted", action="store_true",
                        help="Lint has passed")
    parser.add_argument("--tested", action="store_true",
                        help="Tests have passed")
    args = parser.parse_args()

    try:
        cwd = str(Path.cwd())
        stage_all_changes(cwd)

        review = generate_review_request(
            cwd,
            simplified=args.simplified,
            linted=args.linted,
            tested=args.tested,
        )
        print(review)
        return 0
    except Exception as e:
        print(f"[ERROR] Failed to generate review: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
