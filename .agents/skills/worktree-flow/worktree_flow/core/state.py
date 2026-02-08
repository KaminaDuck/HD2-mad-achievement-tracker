"""
State machine logic for worktree lifecycle phase transitions.
Tracks current phase and enforces valid transitions.
Optionally runs configured scripts on phase transitions.
Runs pre-review validations before human-manual-review phase.
"""

import subprocess
from datetime import UTC, datetime
from pathlib import Path

from worktree_flow.core.config import (
    STATUS_FILE,
    get_config,
    parse_toml_value,
)
from worktree_flow.core.hooks import run_phase_hooks
from worktree_flow.core.validation import ValidationSummary, run_validations
from worktree_flow.lib import output
from worktree_flow.lib.toml_utils import update_toml_fields

# Minimum lengths for validation
MIN_APPROVAL_LENGTH = 10  # Minimum characters for approval message
MIN_COMMIT_MESSAGE_LENGTH = 10  # Minimum characters for commit message

PHASES = [
    "created",
    "initialized",
    "validated",
    "implementing",
    "human-manual-review",
    "merged",
    "cleaned",
]

VALID_TRANSITIONS = {
    None: ["created"],
    "created": ["initialized"],
    "initialized": ["validated"],
    "validated": ["implementing"],
    "implementing": ["human-manual-review"],
    "human-manual-review": ["merged"],
    "merged": ["cleaned"],
}

PHASE_SCRIPTS = {
    "initialized": "setup_script",
    "validated": "validation_command",
    "human-manual-review": "review_script",
    "cleaned": "cleanup_script",
}

PHASES_REQUIRING_APPROVAL = {"human-manual-review"}


def _validate_approval(
    approval: str | None,
    commit_message: str | None,
    phase: str,
) -> tuple[bool, str]:
    """Validate approval and commit message for phases requiring user approval.

    Args:
        approval: User's approval statement
        commit_message: Commit message for the change
        phase: Target phase name

    Returns:
        Tuple of (is_valid, error_message). Error message is empty if valid.
    """
    if not approval:
        return False, (
            f"Phase '{phase}' requires explicit user approval.\n"
            f"Use: transition {phase} --approval \"<user's approval response>\" "
            f"--commit-message \"<message>\"\n"
            f"The approval must contain the user's actual response granting permission."
        )

    if len(approval) < MIN_APPROVAL_LENGTH:
        return False, (
            f"Approval response too short (min {MIN_APPROVAL_LENGTH} chars). "
            "Provide the user's actual approval statement.\n"
            "Example: --approval \"User said: Yes, proceed with the commit\""
        )

    if not commit_message:
        return False, (
            f"Phase '{phase}' requires a commit message.\n"
            f"Use: transition {phase} --approval \"...\" --commit-message \"<message>\""
        )

    if len(commit_message) < MIN_COMMIT_MESSAGE_LENGTH:
        return False, (
            f"Commit message too short (min {MIN_COMMIT_MESSAGE_LENGTH} chars). "
            "Provide a meaningful commit message.\n"
            "Example: --commit-message \"feat(lifecycle): add review approval requirement\""
        )

    return True, ""


def get_status_file_path(worktree_root: Path | None = None) -> Path:
    """Get path to status file."""
    root = worktree_root or Path.cwd()
    return root / STATUS_FILE


def get_current_phase(worktree_root: Path | None = None) -> str | None:
    """Read current phase from status file."""
    status_file = get_status_file_path(worktree_root)
    if not status_file.exists():
        return None
    return parse_toml_value(status_file.read_text(), "current_phase")


def get_phase_history(worktree_root: Path | None = None) -> dict[str, str]:
    """Get all phase timestamps from status file."""
    status_file = get_status_file_path(worktree_root)
    if not status_file.exists():
        return {}

    content = status_file.read_text()
    history = {}
    for phase in PHASES:
        timestamp = parse_toml_value(content, f"{phase}_at")
        if timestamp:
            history[phase] = timestamp

    return history


def can_transition(from_phase: str | None, to_phase: str) -> tuple[bool, str]:
    """Check if transition is valid. Returns (allowed, reason)."""
    if to_phase not in PHASES:
        return False, f"Unknown phase: {to_phase}. Valid phases: {', '.join(PHASES)}"

    valid_next = VALID_TRANSITIONS.get(from_phase, [])
    if to_phase not in valid_next:
        current = from_phase or "none"
        valid = ", ".join(valid_next) or "none"
        return False, f"Cannot transition from '{current}' to '{to_phase}'. Valid: {valid}"

    return True, ""


def run_phase_script(
    phase: str,
    worktree_root: Path | None = None,
    simplified: bool = False,
    linted: bool = False,
    tested: bool = False,
) -> tuple[bool, str]:
    """Run the configured script for a phase. Returns (success, message)."""
    config_key = PHASE_SCRIPTS.get(phase)
    if not config_key:
        return True, ""  # No script for this phase

    config = get_config(worktree_root)
    script = config.get(config_key, "")

    if not script:
        return True, ""  # No script configured

    # Append verification flags for human-manual-review phase
    cmd = script
    if phase == "human-manual-review":
        if simplified:
            cmd += " --simplified"
        if linted:
            cmd += " --linted"
        if tested:
            cmd += " --tested"

    root = worktree_root or Path.cwd()
    output.run(cmd)

    result = subprocess.run(cmd, shell=True, cwd=root)
    if result.returncode != 0:
        return False, f"Script failed with exit code {result.returncode}"
    return True, f"Script completed: {script}"


def _update_validation_status(
    worktree_root: Path | None,
    summary: ValidationSummary,
) -> None:
    """Update status file with validation results."""
    status_file = get_status_file_path(worktree_root)
    if not status_file.exists():
        return

    timestamp = datetime.now(UTC).isoformat()
    update_toml_fields(
        status_file,
        {
            "validation_passed": str(summary.all_passed).lower(),
            "validation_summary": f'"{summary.summary_text}"',
            "last_validation_at": f'"{timestamp}"',
        },
    )


def do_transition(
    to_phase: str,
    worktree_root: Path | None = None,
    approval: str | None = None,
    commit_message: str | None = None,
    simplified: bool = False,
    linted: bool = False,
    tested: bool = False,
    validation_only: bool = False,
) -> tuple[bool, str]:
    """
    Transition to new phase. Updates status file.
    Runs configured script for the phase first.
    For phases requiring approval, both approval and commit_message are required.
    Verification flags (simplified, linted, tested) are passed to the review script.
    For human-manual-review, runs pre-review validations first.
    Returns (success, message).
    """
    current = get_current_phase(worktree_root)

    # For validation_only mode, we need implementing phase for human-manual-review
    if validation_only:
        if to_phase != "human-manual-review":
            return False, "--validation-only only applies to human-manual-review transition"
        if current != "implementing":
            return False, f"--validation-only requires implementing phase, currently: {current}"
        # Run validations and return results without transitioning
        output.blank()
        output.header("Running Pre-Review Validations")
        output.blank()
        summary = run_validations(worktree_root, simplified=simplified)
        if summary.all_passed:
            return True, f"All validations passed: {summary.summary_text}"
        return False, f"Validation failed: {summary.summary_text}"

    allowed, reason = can_transition(current, to_phase)

    if not allowed:
        return False, reason

    # Run pre-review validations before transitioning to human-manual-review
    if to_phase == "human-manual-review":
        output.blank()
        output.header("Running Pre-Review Validations")
        output.blank()
        summary = run_validations(worktree_root, simplified=simplified)
        if not summary.all_passed:
            return False, (
                f"Pre-review validation failed: {summary.summary_text}\n"
                "Fix the issues and try again."
            )
        # Store validation results in status file
        _update_validation_status(worktree_root, summary)
        output.blank()
        output.success(f"All validations passed: {summary.summary_text}")
        output.blank()

    # Check if this phase requires user approval
    if to_phase in PHASES_REQUIRING_APPROVAL:
        valid, error = _validate_approval(approval, commit_message, to_phase)
        if not valid:
            return False, error

    # Run phase script before transitioning (if configured)
    script_ok, script_msg = run_phase_script(
        to_phase,
        worktree_root,
        simplified=simplified,
        linted=linted,
        tested=tested,
    )
    if not script_ok:
        return False, f"Phase script failed: {script_msg}"
    if script_msg:
        output.success(script_msg)

    status_file = get_status_file_path(worktree_root)
    timestamp = datetime.now(UTC).isoformat()
    timestamp_key = f"{to_phase}_at"
    approval_key = f"{to_phase}_approval"

    # Build updates dict with required and optional fields
    updates: dict[str, str] = {
        "current_phase": f'"{to_phase}"',
        timestamp_key: f'"{timestamp}"',
    }
    if approval:
        updates[approval_key] = f'"{approval}"'
    if commit_message:
        updates["commit_message"] = f'"{commit_message}"'

    if not status_file.exists():
        # Create new file with all fields
        lines = [f'{key} = {value}' for key, value in updates.items()]
        status_file.write_text("\n".join(lines) + "\n")
    else:
        update_toml_fields(status_file, updates, insert_first="current_phase")

    # Run lifecycle hooks for this phase (non-blocking)
    hook_results = run_phase_hooks(to_phase, worktree_root)
    if hook_results:
        output.blank()
        output.header("Lifecycle Hooks")
        for hook_point, hook_success, message in hook_results:
            if hook_success:
                output.success(f"{hook_point}: {message}")
            else:
                output.warning(f"{hook_point}: {message}")

    return True, f"Transitioned to '{to_phase}'"
