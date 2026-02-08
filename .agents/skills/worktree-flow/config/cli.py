#!/usr/bin/env python3
"""CLI for worktree-flow install and optimize commands."""

from __future__ import annotations

import argparse
import json
import sys
import tomllib
from pathlib import Path


def get_version() -> str:
    """Read version from pyproject.toml (canonical source)."""
    pyproject = Path(__file__).parent.parent / "pyproject.toml"
    with open(pyproject, "rb") as f:
        data = tomllib.load(f)
    version: str = data["project"]["version"]
    return version

# Support both module and script execution
if __name__ == "__main__" and __package__ is None:
    # Running as script - add parent to path
    import os
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from config.detectors import ProjectDetectionResults, run_all_detectors
    from config.display import (
        print_audit_report,
        print_config_preview,
        print_detection_summary,
        print_header,
        print_next_steps,
        print_suggestions,
    )
    from config.generators import generate_all_configs
    from config.optimizer import ConfigAuditor, ConfigMigrator
    from config.typing_defs import InstallAnswers
else:
    from .detectors import ProjectDetectionResults, run_all_detectors
    from .display import (
        print_audit_report,
        print_config_preview,
        print_detection_summary,
        print_header,
        print_next_steps,
        print_suggestions,
    )
    from .generators import generate_all_configs
    from .optimizer import ConfigAuditor, ConfigMigrator
    from .typing_defs import InstallAnswers


def generate_default_answers(results: ProjectDetectionResults) -> InstallAnswers:
    """Generate default answers based on detection results."""
    answers: InstallAnswers = {
        "enable_lifecycle": "yes",
        "setup_script_type": "auto-detect",
    }

    if results.has_docker():
        answers["enable_services"] = "yes"
        answers["docker_prefix"] = "myproject"
        answers["base_server_port"] = "19091"
        answers["base_webui_port"] = "19071"
    else:
        answers["enable_services"] = "no"

    return answers


def write_configs(
    configs: dict[str, str],
    project_root: Path,
) -> None:
    """Write configuration files to disk."""
    for path, content in configs.items():
        full_path = project_root / path
        full_path.parent.mkdir(parents=True, exist_ok=True)
        full_path.write_text(content)
        print(f"  Created: {path}")


def cmd_install(args: argparse.Namespace) -> int:
    """Run interactive installation."""
    project_root = Path(args.project_root or ".").resolve()

    print_header(f"Worktree-Flow Installation (v{get_version()})")
    print(f"Project: {project_root}\n")

    # Phase 1: Detection
    print("Analyzing project structure...")
    detection_results = run_all_detectors(project_root)
    print_detection_summary(detection_results)
    print_suggestions(detection_results)

    # Phase 2: Generate answers (auto mode for CLI)
    answers = generate_default_answers(detection_results)

    # Phase 3: Generate configs
    if args.dry_run:
        print_header("DRY RUN - Would generate:")
        configs = generate_all_configs(answers, detection_results, project_root)
        print_config_preview(configs)
        return 0

    print("Generating configuration files...")
    configs = generate_all_configs(answers, detection_results, project_root)
    write_configs(configs, project_root)

    print_header("Installation Complete")
    print_next_steps()
    return 0


def cmd_optimize(args: argparse.Namespace) -> int:
    """Run configuration optimization/audit."""
    project_root = Path(args.project_root or ".").resolve()

    print_header(f"Worktree-Flow Configuration Audit (v{get_version()})")
    print(f"Project: {project_root}\n")

    auditor = ConfigAuditor(project_root)
    report = auditor.audit()

    print_audit_report(report)

    if args.fix:
        migrator = ConfigMigrator(project_root)

        if args.dry_run:
            print_header("DRY RUN - Would apply fixes:")
            actions = migrator.migrate(report, dry_run=True)
            for action in actions:
                print(f"  - {action}")
        else:
            print("Applying fixes...")
            actions = migrator.migrate(report)
            for action in actions:
                print(f"  - {action}")

            # Create services config if suggested
            for issue in report.info:
                if "service orchestration" in issue.message.lower():
                    result = migrator.create_services_config()
                    print(f"  - {result}")

            print("\nFixes applied. Re-run audit to verify.")

    if args.json:
        output = {
            "version": report.config_version,
            "healthy": report.is_healthy,
            "errors": [
                {"message": i.message, "fix": i.fix_description}
                for i in report.errors
            ],
            "warnings": [
                {"message": i.message, "fix": i.fix_description}
                for i in report.warnings
            ],
            "info": [
                {"message": i.message, "fix": i.fix_description}
                for i in report.info
            ],
        }
        print(json.dumps(output, indent=2))

    return 0 if report.is_healthy else 1


def main() -> int:
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        description="Worktree-flow installation and configuration helper"
    )
    parser.add_argument(
        "--version", "-V", action="version", version=f"worktree-flow {get_version()}"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # Install command
    install_parser = subparsers.add_parser(
        "install", help="Auto-detect and generate configuration"
    )
    install_parser.add_argument("--project-root", "-p", help="Project root directory")
    install_parser.add_argument(
        "--dry-run", "-n", action="store_true", help="Preview without writing files"
    )

    # Optimize command
    optimize_parser = subparsers.add_parser(
        "optimize", help="Audit and fix configuration"
    )
    optimize_parser.add_argument("--project-root", "-p", help="Project root directory")
    optimize_parser.add_argument(
        "--fix", "-f", action="store_true", help="Auto-fix detected issues"
    )
    optimize_parser.add_argument(
        "--dry-run", "-n", action="store_true", help="Preview fixes without applying"
    )
    optimize_parser.add_argument(
        "--json", "-j", action="store_true", help="Output as JSON"
    )

    args = parser.parse_args()

    if args.command == "install":
        return cmd_install(args)
    elif args.command == "optimize":
        return cmd_optimize(args)

    return 1


if __name__ == "__main__":
    sys.exit(main())
