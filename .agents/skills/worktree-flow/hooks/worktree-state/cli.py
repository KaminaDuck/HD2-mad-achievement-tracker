#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../../" }
# ///
"""Backward compatibility wrapper - use worktree_flow.cli instead."""

import sys

from worktree_flow.cli import main

if __name__ == "__main__":
    sys.exit(main())
