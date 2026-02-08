"""
CLI for managing worktree lifecycle state transitions.

Usage:
  worktree-state show              Show current phase and history
  worktree-state transition PHASE  Transition to a new phase
  worktree-state phases            List all valid phases
"""

import argparse
import sys

from worktree_flow.core import (
    PHASES,
    PHASES_REQUIRING_APPROVAL,
    VALID_TRANSITIONS,
    do_transition,
    get_current_phase,
    get_phase_history,
)


def cmd_show(_args: argparse.Namespace) -> int:
    """Show current phase and history."""
    current = get_current_phase()
    history = get_phase_history()

    print("\n=== Worktree Lifecycle State ===")
    print(f"Current phase: {current or 'none'}")

    if current:
        valid_next = VALID_TRANSITIONS.get(current, [])
        print(f"Valid next phases: {', '.join(valid_next) or 'none (end of lifecycle)'}")

    if history:
        print("\nPhase history:")
        for phase in PHASES:
            if phase in history:
                print(f"  {phase}: {history[phase]}")

    print()
    return 0


def cmd_transition(args: argparse.Namespace) -> int:
    """Transition to a new phase."""
    success, message = do_transition(
        args.phase,
        approval=args.approval,
        commit_message=args.commit_message,
        simplified=args.simplified,
        linted=args.linted,
        tested=args.tested,
        validation_only=args.validation_only,
    )

    if success:
        print(f"[OK] {message}")
        return 0

    print(f"[ERROR] {message}", file=sys.stderr)
    return 1


def cmd_phases(_args: argparse.Namespace) -> int:
    """List all valid phases."""
    print("\n=== Lifecycle Phases ===")
    print("Phases (in order):")
    for i, phase in enumerate(PHASES, 1):
        print(f"  {i}. {phase}")

    print("\nValid transitions:")
    for from_phase, to_phases in VALID_TRANSITIONS.items():
        from_str = from_phase or "none"
        print(f"  {from_str} -> {', '.join(to_phases)}")

    print()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Manage worktree lifecycle state transitions",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    subparsers.add_parser("show", help="Show current phase and history")
    subparsers.add_parser("phases", help="List all valid phases")

    status_parser = subparsers.add_parser("status", help="Show all worktrees status")
    status_parser.add_argument("--json", action="store_true", help="Output as JSON")
    status_parser.add_argument(
        "--quiet", "-q", action="store_true", help="Suppress headers"
    )

    trans_parser = subparsers.add_parser("transition", help="Transition to a new phase")
    trans_parser.add_argument("phase", choices=PHASES, help="Target phase")
    trans_parser.add_argument(
        "--approval",
        type=str,
        help=(
            f"Required for phases: {', '.join(PHASES_REQUIRING_APPROVAL)}. "
            "Must contain the user's explicit approval response."
        ),
    )
    trans_parser.add_argument(
        "--commit-message",
        type=str,
        dest="commit_message",
        help=(
            f"Required for phases: {', '.join(PHASES_REQUIRING_APPROVAL)}. "
            "The commit message to use for the changes."
        ),
    )
    trans_parser.add_argument(
        "--simplified",
        action="store_true",
        help="Code simplifier has been run",
    )
    trans_parser.add_argument(
        "--linted",
        action="store_true",
        help="Lint has passed",
    )
    trans_parser.add_argument(
        "--tested",
        action="store_true",
        help="Tests have passed",
    )
    trans_parser.add_argument(
        "--validation-only",
        action="store_true",
        dest="validation_only",
        help="Run validations without transitioning (for human-manual-review)",
    )

    args = parser.parse_args()

    # Handle status command separately (uses its own arg parser)
    if args.command == "status":
        from worktree_flow.cli.status import main as status_main

        status_args = []
        if args.json:
            status_args.append("--json")
        if args.quiet:
            status_args.append("--quiet")
        return status_main(status_args)

    commands = {"show": cmd_show, "transition": cmd_transition, "phases": cmd_phases}
    return commands[args.command](args)


if __name__ == "__main__":
    sys.exit(main())
