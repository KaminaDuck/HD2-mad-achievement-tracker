#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["jinja2", "worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../" }
# ///
"""Pre-review hook: Generate review request preview."""

from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from worktree_flow.lib.common import (
    get_branch_info,
    get_diff_stats,
    get_staged_files,
    get_worktree_root,
    read_status,
)


def get_template_path() -> Path | None:
    """Find the review request template."""
    # Check relative to this script
    script_dir = Path(__file__).parent.parent
    template_path = script_dir / "templates" / "review_request.jinja"
    if template_path.exists():
        return template_path
    return None


def render_review_request() -> str:
    """Render the review request using Jinja template."""
    root = get_worktree_root()

    # Gather data
    branch_info = get_branch_info(root)
    diff_stats = get_diff_stats(root)
    staged_files = get_staged_files(root)
    status = read_status(root)

    context = {
        "branch": branch_info["branch"],
        "base_branch": branch_info["base_branch"],
        "diff_stats": diff_stats or "No staged changes",
        "files": staged_files,
        "simplified": status.get("simplified", "").lower() == "true",
        "linted": status.get("linted", "").lower() == "true",
        "tested": status.get("tested", "").lower() == "true",
    }

    template_path = get_template_path()
    if template_path:
        env = Environment(
            loader=FileSystemLoader(template_path.parent),
            autoescape=select_autoescape(),
        )
        template = env.get_template(template_path.name)
        return template.render(**context)

    # Fallback to inline template
    return _inline_template(context)


def _inline_template(ctx: dict) -> str:
    """Fallback inline template if Jinja template not found."""
    lines = [
        "=" * 80,
        "REVIEW REQUEST".center(80),
        "=" * 80,
        "",
        f"Branch: {ctx['branch']} -> {ctx['base_branch']}",
        "",
        "Verification Status:",
        f"  [{'x' if ctx['simplified'] else ' '}] Code simplified",
        f"  [{'x' if ctx['linted'] else ' '}] Lint passed",
        f"  [{'x' if ctx['tested'] else ' '}] Tests passed",
        "",
        "Changes:",
        ctx["diff_stats"],
        "",
        "Files:",
    ]
    for f in ctx["files"]:
        lines.append(f"  {f['status']:>8} {f['path']}")
    lines.extend(["", "-" * 80, ""])
    return "\n".join(lines)


def main() -> None:
    print(render_review_request())


if __name__ == "__main__":
    main()
