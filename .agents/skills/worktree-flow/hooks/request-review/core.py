"""Core logic for request-review hook."""

from pathlib import Path

from jinja2 import BaseLoader, Environment

from worktree_flow.lib.common import (
    CheckResult,
    get_branch_info,
    get_current_phase,
    get_diff_stats,
    get_staged_files,
)

COMMIT_ALLOWED_PHASES = {"human-manual-review", "merged"}


def is_commit_allowed(cwd: str) -> CheckResult:
    """Check if commits are allowed based on lifecycle phase.

    Returns CheckResult with allowed=True/False and phase as reason.
    """
    phase = get_current_phase(Path(cwd))
    if phase is None:
        return CheckResult(allowed=True)
    return CheckResult(allowed=(phase in COMMIT_ALLOWED_PHASES), reason=phase or "")


REVIEW_TEMPLATE = """
[REVIEW REQUIRED]

Branch: {{ branch }} -> {{ base_branch }}

Verification:
  [{{ 'x' if simplified else ' ' }}] Code simplified (@agent-code-simplifier)
  [{{ 'x' if linted else ' ' }}] Lint passed
  [{{ 'x' if tested else ' ' }}] Tests passed
{% if not simplified %}

SUGGESTION: Run @agent-code-simplifier:code-simplifier before proceeding.
{% endif %}
{% if diff_stats %}

Changes:
{{ diff_stats }}
{% else %}

No staged changes found.
{% endif %}
{% if files %}

Files:
{% for file in files %}
  [{{ file.status }}] {{ file.path }}
{% endfor %}
{% endif %}

---
ACTION REQUIRED: Present these changes to the user with your proposed commit message.
Ask: "May I commit these changes with message: <your message>?"
"""


def generate_review_request(
    cwd: str,
    simplified: bool = False,
    linted: bool = False,
    tested: bool = False,
) -> str:
    """Generate the review request from template."""
    env = Environment(loader=BaseLoader(), trim_blocks=True, lstrip_blocks=True)
    template = env.from_string(REVIEW_TEMPLATE)

    worktree_root = Path(cwd)
    branch_info = get_branch_info(worktree_root)

    return template.render(
        branch=branch_info["branch"],
        base_branch=branch_info["base_branch"],
        diff_stats=get_diff_stats(worktree_root),
        files=get_staged_files(worktree_root),
        simplified=simplified,
        linted=linted,
        tested=tested,
    )
