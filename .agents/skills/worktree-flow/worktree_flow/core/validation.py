"""Validation logic for worktree lifecycle transitions."""

import subprocess
import time
from dataclasses import dataclass
from pathlib import Path

from worktree_flow.core.config import DEFAULT_VALIDATION_TIMEOUT, get_validation_config


@dataclass
class ValidationResult:
    """Result of a single validation check."""

    name: str
    passed: bool
    message: str
    duration_seconds: float


@dataclass
class ValidationSummary:
    """Summary of all validation checks."""

    all_passed: bool
    results: list[ValidationResult]
    summary_text: str


def _format_validation_message(
    result: subprocess.CompletedProcess[str],
    duration: float,
) -> str:
    """Format validation result message based on exit code."""
    if result.returncode == 0:
        return f"passed in {duration:.1f}s"
    error_output = result.stderr.strip() or result.stdout.strip()
    first_line = error_output.split("\n")[0][:100] if error_output else ""
    return f"failed (exit {result.returncode}): {first_line}"


def run_single_validation(
    name: str,
    command: str,
    worktree_root: Path | None = None,
    timeout: int = DEFAULT_VALIDATION_TIMEOUT,
) -> ValidationResult:
    """Run a single validation command with timeout. Returns ValidationResult."""
    root = worktree_root or Path.cwd()
    start_time = time.monotonic()

    print(f"[VALIDATE] Running {name}: {command}")

    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=root,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        duration = time.monotonic() - start_time
        return ValidationResult(
            name=name,
            passed=result.returncode == 0,
            message=_format_validation_message(result, duration),
            duration_seconds=duration,
        )
    except subprocess.TimeoutExpired:
        duration = time.monotonic() - start_time
        return ValidationResult(
            name=name,
            passed=False,
            message=f"timed out after {timeout}s",
            duration_seconds=duration,
        )
    except Exception as e:
        duration = time.monotonic() - start_time
        return ValidationResult(
            name=name,
            passed=False,
            message=f"error: {e}",
            duration_seconds=duration,
        )


def run_validations(
    worktree_root: Path | None = None,
    simplified: bool = False,
) -> ValidationSummary:
    """
    Run all configured validation commands.

    Args:
        worktree_root: Path to worktree (defaults to cwd)
        simplified: Whether --simplified flag was passed (required if require_simplified=true)

    Returns:
        ValidationSummary with all results
    """
    config = get_validation_config(worktree_root)
    results: list[ValidationResult] = []

    # Get timeout from config or use default
    timeout = int(config.get("timeout", str(DEFAULT_VALIDATION_TIMEOUT)))

    # Check if simplified flag is required
    require_simplified = config.get("require_simplified", "false").lower() == "true"
    if require_simplified:
        passed = simplified
        message = (
            "--simplified flag provided"
            if passed
            else "--simplified flag required (run code-simplifier first)"
        )
        results.append(
            ValidationResult(
                name="code-simplifier",
                passed=passed,
                message=message,
                duration_seconds=0,
            )
        )
        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status} code-simplifier: {message}")

    # Run validation commands in order
    validation_commands = [
        ("typecheck", config.get("typecheck_command", "")),
        ("lint", config.get("lint_command", "")),
        ("test", config.get("test_command", "")),
    ]

    for name, command in validation_commands:
        if not command:
            continue  # Skip unconfigured validations

        result = run_single_validation(name, command, worktree_root, timeout)
        results.append(result)

        # Print result immediately
        status = "[PASS]" if result.passed else "[FAIL]"
        print(f"{status} {name}: {result.message}")

    # Build summary
    all_passed = all(r.passed for r in results)
    summary_parts = [f"{r.name}: {'pass' if r.passed else 'FAIL'}" for r in results]
    summary_text = ", ".join(summary_parts)

    return ValidationSummary(
        all_passed=all_passed,
        results=results,
        summary_text=summary_text,
    )
