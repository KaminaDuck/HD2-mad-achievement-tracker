"""Display utilities for worktree-flow CLI output."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .detectors import ProjectDetectionResults
    from .optimizer import AuditReport


def print_header(text: str) -> None:
    """Print a formatted header."""
    print(f"\n{'=' * 50}")
    print(f"  {text}")
    print(f"{'=' * 50}\n")


def print_detection_summary(results: ProjectDetectionResults) -> None:
    """Print summary of detected patterns."""
    print("Detected patterns:")

    # Package managers
    pkg = results.get("package_managers")
    if pkg and pkg.detected:
        managers = ", ".join(pkg.details.keys())
        print(f"  Package managers: {managers}")

    # Build tools
    build = results.get("build_tools")
    if build and build.detected:
        tools = [k for k in build.details.keys() if not k.startswith("makefile_")]
        if tools:
            print(f"  Build tools: {', '.join(tools)}")
        if "makefile_targets" in build.details:
            targets = build.details["makefile_targets"].split(",")[:5]
            print(f"  Makefile targets: {', '.join(targets)}...")

    # Infrastructure
    infra = results.get("infrastructure")
    if infra and infra.detected:
        items = []
        if "docker" in infra.details:
            items.append("Docker")
        if "typescript" in infra.details:
            items.append("TypeScript")
        if "python" in infra.details:
            items.append("Python")
        for key in infra.details:
            if key.startswith("dev_server_"):
                items.append(key.replace("dev_server_", "").title())
        if items:
            print(f"  Infrastructure: {', '.join(items)}")

    print()


def print_suggestions(results: ProjectDetectionResults) -> None:
    """Print configuration suggestions."""
    suggestions = results.all_suggestions()
    if suggestions:
        print("Suggested configuration:")
        for suggestion in suggestions[:10]:
            print(f"  - {suggestion}")
        print()


def print_next_steps() -> None:
    """Print next steps after installation."""
    print("\nNext steps:")
    print("  1. Review generated configuration files")
    print("  2. Customize validation commands if needed")
    print("  3. Create a worktree: git worktree add .worktrees/my-feature -b feature/my-feature")
    print("  4. Progress through lifecycle: uv run -m worktree_flow.cli transition <phase>")
    print()


def print_audit_report(report: AuditReport) -> None:
    """Print audit report."""
    print(f"Configuration version: {report.config_version}")
    print(f"Health status: {'OK' if report.is_healthy else 'ISSUES FOUND'}\n")

    if report.errors:
        print("Errors:")
        for issue in report.errors:
            print(f"  [ERROR] {issue.message}")
            if issue.fix_description:
                print(f"          Fix: {issue.fix_description}")
        print()

    if report.warnings:
        print("Warnings:")
        for issue in report.warnings:
            print(f"  [WARN] {issue.message}")
            if issue.fix_description:
                print(f"         Fix: {issue.fix_description}")
        print()

    if report.info:
        print("Suggestions:")
        for issue in report.info:
            print(f"  [INFO] {issue.message}")
            if issue.fix_description:
                print(f"         {issue.fix_description}")
        print()


def print_config_preview(configs: dict[str, str]) -> None:
    """Preview generated configurations."""
    for path, content in configs.items():
        print(f"--- {path} ---")
        # Show first 30 lines
        lines = content.split("\n")
        for line in lines[:30]:
            print(f"  {line}")
        if len(lines) > 30:
            print(f"  ... ({len(lines) - 30} more lines)")
        print()
