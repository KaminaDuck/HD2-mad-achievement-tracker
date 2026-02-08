"""Audit existing worktree-flow configuration for issues."""

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class AuditIssue:
    """A single configuration issue."""

    severity: str  # "error", "warning", "info"
    category: str  # "missing", "invalid", "outdated", "suggestion"
    message: str
    fix_available: bool = False
    fix_description: str = ""
    fix_action: str = ""  # Command or action to fix


@dataclass
class AuditReport:
    """Complete audit report."""

    issues: list[AuditIssue] = field(default_factory=list)
    config_version: str = "unknown"
    is_healthy: bool = True

    @property
    def errors(self) -> list[AuditIssue]:
        return [i for i in self.issues if i.severity == "error"]

    @property
    def warnings(self) -> list[AuditIssue]:
        return [i for i in self.issues if i.severity == "warning"]

    @property
    def info(self) -> list[AuditIssue]:
        return [i for i in self.issues if i.severity == "info"]

    def add_issue(self, issue: AuditIssue) -> None:
        self.issues.append(issue)
        if issue.severity == "error":
            self.is_healthy = False


class ConfigAuditor:
    """Audit worktree-flow configuration."""

    def __init__(self, project_root: Path):
        self.root = project_root
        self.config_path = project_root / ".agents" / ".worktree-config.toml"
        self.services_path = project_root / ".agents" / ".worktree-services.toml"
        self._config_content: str | None = None

    def _get_config_content(self) -> str | None:
        """Get config file content, caching on first read."""
        if self._config_content is None and self.config_path.exists():
            self._config_content = self.config_path.read_text()
        return self._config_content

    def audit(self) -> AuditReport:
        """Run full configuration audit."""
        report = AuditReport()

        # Check .agents directory exists
        agents_dir = self.root / ".agents"
        if not agents_dir.exists():
            report.add_issue(AuditIssue(
                severity="error",
                category="missing",
                message="Missing .agents/ directory",
                fix_available=True,
                fix_description="Create .agents/ directory",
                fix_action="mkdir -p .agents",
            ))
            return report

        # Check main config exists
        if not self.config_path.exists():
            report.add_issue(AuditIssue(
                severity="error",
                category="missing",
                message="Missing .agents/.worktree-config.toml",
                fix_available=True,
                fix_description="Run /worktree-flow install to create",
                fix_action="install",
            ))
        else:
            self._audit_config(report)

        # Check hook paths
        self._audit_hooks(report)

        # Check scripts
        self._audit_scripts(report)

        # Check for v1 patterns
        self._check_v1_patterns(report)

        # Set version
        report.config_version = self._detect_version()

        return report

    def _audit_config(self, report: AuditReport) -> None:
        """Check config file for issues."""
        content = self._get_config_content()
        if not content:
            return

        # Check for required sections
        if "[validation]" not in content:
            report.add_issue(AuditIssue(
                severity="warning",
                category="missing",
                message="Missing [validation] section - pre-review checks won't run",
                fix_available=True,
                fix_description="Add validation commands for typecheck, lint, test",
            ))

        if "[lifecycle.hooks]" not in content:
            report.add_issue(AuditIssue(
                severity="info",
                category="suggestion",
                message="No [lifecycle.hooks] section - lifecycle hooks disabled",
                fix_available=True,
                fix_description="Add hooks for post_init, pre_validate, etc.",
            ))

        if "[lifecycle.templates]" not in content:
            report.add_issue(AuditIssue(
                severity="info",
                category="suggestion",
                message="No [lifecycle.templates] section",
                fix_available=True,
                fix_description="Add review_request template path",
            ))

        # Check for empty or placeholder values
        if 'echo "No' in content or "echo 'No" in content:
            report.add_issue(AuditIssue(
                severity="warning",
                category="invalid",
                message="Configuration contains placeholder commands",
                fix_available=False,
                fix_description="Replace placeholder commands with actual validation commands",
            ))

    def _audit_hooks(self, report: AuditReport) -> None:
        """Check that configured hook paths exist."""
        content = self._get_config_content()
        if not content:
            return

        # Parse hook paths from config
        hook_names = ["post_init", "pre_validate", "pre_review", "pre_merge", "pre_cleanup"]
        for hook in hook_names:
            # Simple pattern matching for hook paths
            pattern = rf'{hook}\s*=\s*"([^"]+)"'
            match = re.search(pattern, content)
            if match:
                hook_path = match.group(1)
                full_path = self.root / hook_path
                if not full_path.exists():
                    report.add_issue(AuditIssue(
                        severity="warning",
                        category="invalid",
                        message=f"Hook script not found: {hook_path}",
                        fix_available=False,
                        fix_description=f"Create {hook_path} or update path in config",
                    ))

    def _audit_scripts(self, report: AuditReport) -> None:
        """Check that setup/cleanup scripts exist."""
        content = self._get_config_content()
        if not content:
            return

        # Check setup_script
        setup_match = re.search(r'setup_script\s*=\s*"([^"]+)"', content)
        if setup_match:
            setup_path = setup_match.group(1)
            if setup_path and not (self.root / setup_path).exists():
                report.add_issue(AuditIssue(
                    severity="warning",
                    category="invalid",
                    message=f"Setup script not found: {setup_path}",
                    fix_available=True,
                    fix_description="Create setup script or update path",
                ))

        # Check cleanup_script
        cleanup_match = re.search(r'cleanup_script\s*=\s*"([^"]+)"', content)
        if cleanup_match:
            cleanup_path = cleanup_match.group(1)
            if cleanup_path and not (self.root / cleanup_path).exists():
                report.add_issue(AuditIssue(
                    severity="info",
                    category="invalid",
                    message=f"Cleanup script not found: {cleanup_path}",
                    fix_available=False,
                    fix_description="Create cleanup script or remove from config",
                ))

    def _check_v1_patterns(self, report: AuditReport) -> None:
        """Detect v1 patterns that should be upgraded."""
        content = self._get_config_content()
        if not content:
            return

        # Check for old CLI path patterns
        if "hooks/worktree-state/cli.py" in content:
            report.add_issue(AuditIssue(
                severity="info",
                category="outdated",
                message="Using v1 CLI path pattern",
                fix_available=True,
                fix_description="Update to v2 CLI: uv run -m worktree_flow.cli",
            ))

        # Check for missing service config when Docker is present
        if not self.services_path.exists():
            compose_files = [
                "docker-compose.yml", "docker-compose.yaml",
                "compose.yml", "compose.yaml",
            ]
            for compose in compose_files:
                if (self.root / compose).exists():
                    report.add_issue(AuditIssue(
                        severity="info",
                        category="suggestion",
                        message="Docker Compose detected but no .worktree-services.toml",
                        fix_available=True,
                        fix_description="Run /worktree-flow install for service orchestration",
                    ))
                    break

    def _detect_version(self) -> str:
        """Detect config version.

        Version detection logic:
        - 2.0: Has all three sections (lifecycle.hooks, validation, lifecycle.templates)
        - 1.5: Has validation OR (lifecycle.hooks OR lifecycle.templates) but not all three
        - 1.0: Basic config without these sections
        - none: No config file exists
        """
        content = self._get_config_content()
        if not content:
            return "none"

        # v2 indicators
        has_lifecycle_hooks = "[lifecycle.hooks]" in content
        has_validation = "[validation]" in content
        has_templates = "[lifecycle.templates]" in content

        if has_lifecycle_hooks and has_validation and has_templates:
            return "2.0"
        elif has_validation or has_lifecycle_hooks or has_templates:
            return "1.5"

        return "1.0"
