"""Tests for configuration auditor."""

import tempfile
from pathlib import Path

from ..optimizer.auditor import AuditIssue, AuditReport, ConfigAuditor


class TestAuditIssue:
    """Test AuditIssue dataclass."""

    def test_basic_issue(self) -> None:
        issue = AuditIssue(
            severity="error",
            category="missing",
            message="Config file not found",
        )
        assert issue.severity == "error"
        assert issue.category == "missing"
        assert issue.message == "Config file not found"
        assert issue.fix_available is False
        assert issue.fix_description == ""

    def test_issue_with_fix(self) -> None:
        issue = AuditIssue(
            severity="warning",
            category="invalid",
            message="Invalid path",
            fix_available=True,
            fix_description="Update the path",
            fix_action="edit config",
        )
        assert issue.fix_available is True
        assert issue.fix_description == "Update the path"
        assert issue.fix_action == "edit config"


class TestAuditReport:
    """Test AuditReport dataclass."""

    def test_empty_report_is_healthy(self) -> None:
        report = AuditReport()
        assert report.is_healthy is True
        assert report.errors == []
        assert report.warnings == []
        assert report.info == []

    def test_add_error_makes_unhealthy(self) -> None:
        report = AuditReport()
        report.add_issue(
            AuditIssue(severity="error", category="missing", message="Error")
        )
        assert report.is_healthy is False
        assert len(report.errors) == 1

    def test_add_warning_keeps_healthy(self) -> None:
        report = AuditReport()
        report.add_issue(
            AuditIssue(severity="warning", category="invalid", message="Warning")
        )
        assert report.is_healthy is True
        assert len(report.warnings) == 1

    def test_add_info_keeps_healthy(self) -> None:
        report = AuditReport()
        report.add_issue(
            AuditIssue(severity="info", category="suggestion", message="Info")
        )
        assert report.is_healthy is True
        assert len(report.info) == 1

    def test_filters_by_severity(self) -> None:
        report = AuditReport()
        report.add_issue(AuditIssue(severity="error", category="m", message="e1"))
        report.add_issue(AuditIssue(severity="warning", category="m", message="w1"))
        report.add_issue(AuditIssue(severity="warning", category="m", message="w2"))
        report.add_issue(AuditIssue(severity="info", category="m", message="i1"))

        assert len(report.errors) == 1
        assert len(report.warnings) == 2
        assert len(report.info) == 1


class TestConfigAuditor:
    """Test ConfigAuditor."""

    def test_missing_agents_directory(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert report.is_healthy is False
            assert len(report.errors) == 1
            assert "Missing .agents/ directory" in report.errors[0].message

    def test_missing_config_file(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            (root / ".agents").mkdir()

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert report.is_healthy is False
            assert any(
                ".worktree-config.toml" in e.message for e in report.errors
            )

    def test_valid_config_is_healthy(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            config_content = """
[validation]
typecheck_command = "make typecheck"
lint_command = "make lint"
test_command = "make test"

[lifecycle.hooks]
post_init = "scripts/post_init.py"

[lifecycle.templates]
review_request = "templates/review.jinja"
"""
            (agents_dir / ".worktree-config.toml").write_text(config_content)

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            # Should have warnings about missing hook files, but no errors
            assert len(report.errors) == 0

    def test_detects_missing_validation_section(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            config_content = """
[lifecycle.hooks]
post_init = "scripts/post_init.py"
"""
            (agents_dir / ".worktree-config.toml").write_text(config_content)

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert any(
                "Missing [validation] section" in w.message for w in report.warnings
            )

    def test_detects_placeholder_commands(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            config_content = """
[validation]
typecheck_command = "echo 'No typecheck configured'"
"""
            (agents_dir / ".worktree-config.toml").write_text(config_content)

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert any(
                "placeholder commands" in w.message for w in report.warnings
            )

    def test_detects_v1_cli_pattern(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            config_content = """
[validation]
test_command = "hooks/worktree-state/cli.py transition"
"""
            (agents_dir / ".worktree-config.toml").write_text(config_content)

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert any("v1 CLI path pattern" in i.message for i in report.info)

    def test_detects_docker_without_services_config(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            (root / "docker-compose.yml").write_text("services:\n  app:\n    build: .")
            (agents_dir / ".worktree-config.toml").write_text(
                "[validation]\ntest = 'test'"
            )

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert any(
                "Docker Compose detected" in i.message for i in report.info
            )

    def test_version_detection_v2(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            config_content = """
[validation]
test = "test"

[lifecycle.hooks]
post_init = "x"

[lifecycle.templates]
review = "y"
"""
            (agents_dir / ".worktree-config.toml").write_text(config_content)

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert report.config_version == "2.0"

    def test_version_detection_v15(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            config_content = "[validation]\ntest = 'test'"
            (agents_dir / ".worktree-config.toml").write_text(config_content)

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert report.config_version == "1.5"

    def test_version_detection_v1(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            config_content = "some_setting = 'value'"
            (agents_dir / ".worktree-config.toml").write_text(config_content)

            auditor = ConfigAuditor(root)
            report = auditor.audit()

            assert report.config_version == "1.0"

    def test_caches_config_content(self) -> None:
        with tempfile.TemporaryDirectory() as tmpdir:
            root = Path(tmpdir)
            agents_dir = root / ".agents"
            agents_dir.mkdir()

            config_content = "[validation]\ntest = 'test'"
            (agents_dir / ".worktree-config.toml").write_text(config_content)

            auditor = ConfigAuditor(root)

            # First call should read and cache
            content1 = auditor._get_config_content()

            # Modify file
            (agents_dir / ".worktree-config.toml").write_text("modified")

            # Second call should return cached content
            content2 = auditor._get_config_content()

            assert content1 == content2
            assert content2 == config_content
