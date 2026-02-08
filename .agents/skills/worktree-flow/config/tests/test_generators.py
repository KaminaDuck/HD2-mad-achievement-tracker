"""Tests for configuration generators."""

from pathlib import Path

from ..detectors.base import DetectionResult, ProjectDetectionResults
from ..generators import generate_all_configs
from ..generators.services_config import _format_service_name, _parse_port
from ..generators.worktree_config import (
    DEFAULT_HOOKS,
    DEFAULT_TEMPLATES,
    _detect_validation_commands,
    generate_worktree_config,
)
from ..typing_defs import InstallAnswers


class TestParsePort:
    """Test port parsing and validation."""

    def test_valid_port(self) -> None:
        assert _parse_port("8080", 3000) == 8080

    def test_invalid_port_returns_default(self) -> None:
        assert _parse_port("not-a-number", 3000) == 3000

    def test_port_out_of_range_low(self) -> None:
        assert _parse_port("0", 3000) == 3000

    def test_port_out_of_range_high(self) -> None:
        assert _parse_port("70000", 3000) == 3000

    def test_port_boundary_low(self) -> None:
        assert _parse_port("1", 3000) == 1

    def test_port_boundary_high(self) -> None:
        assert _parse_port("65535", 3000) == 65535


class TestFormatServiceName:
    """Test service name formatting."""

    def test_snake_case(self) -> None:
        assert _format_service_name("web_ui") == "Web Ui"

    def test_kebab_case(self) -> None:
        assert _format_service_name("my-api") == "My Api"

    def test_mixed_case(self) -> None:
        assert _format_service_name("web_api-service") == "Web Api Service"

    def test_simple_name(self) -> None:
        assert _format_service_name("server") == "Server"


class TestGenerateWorktreeConfig:
    """Test worktree config generation."""

    def test_generates_basic_config(self) -> None:
        answers: InstallAnswers = {
            "enable_lifecycle": "yes",
            "setup_script_type": "auto-detect",
        }
        detection = ProjectDetectionResults()

        config = generate_worktree_config(answers, detection, Path("."))

        assert "# Worktree Lifecycle Configuration" in config
        assert "[lifecycle.hooks]" in config
        assert "[lifecycle.templates]" in config
        assert "[validation]" in config

    def test_includes_setup_script_when_auto_detect(self) -> None:
        answers: InstallAnswers = {
            "setup_script_type": "auto-detect",
        }
        detection = ProjectDetectionResults()

        config = generate_worktree_config(answers, detection, Path("."))

        assert 'setup_script = "scripts/worktree-setup.sh"' in config

    def test_includes_custom_setup_script(self) -> None:
        answers: InstallAnswers = {
            "setup_script_type": "custom",
            "setup_script_path": "my/custom/setup.sh",
        }
        detection = ProjectDetectionResults()

        config = generate_worktree_config(answers, detection, Path("."))

        assert 'setup_script = "my/custom/setup.sh"' in config

    def test_default_hooks_are_included(self) -> None:
        answers: InstallAnswers = {}
        detection = ProjectDetectionResults()

        config = generate_worktree_config(answers, detection, Path("."))

        for hook_name, hook_path in DEFAULT_HOOKS.items():
            assert f'{hook_name} = "{hook_path}"' in config

    def test_default_templates_are_included(self) -> None:
        answers: InstallAnswers = {}
        detection = ProjectDetectionResults()

        config = generate_worktree_config(answers, detection, Path("."))

        for template_name, template_path in DEFAULT_TEMPLATES.items():
            assert f'{template_name} = "{template_path}"' in config


class TestDetectValidationCommands:
    """Test validation command detection."""

    def test_typescript_with_make(self) -> None:
        detection = ProjectDetectionResults()
        detection.add_result(
            "infrastructure",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={"typescript": "tsconfig.json"},
            ),
        )
        detection.add_result(
            "build_tools",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={
                    "make": "Makefile",
                    "makefile_targets": "ts-typecheck,ts-lint,ts-test",
                },
            ),
        )

        validation = _detect_validation_commands(detection)

        assert validation.typecheck == "make ts-typecheck"
        assert validation.lint == "make ts-lint"
        assert validation.test == "make ts-test"
        assert validation.require_simplified == "true"

    def test_typescript_with_turbo(self) -> None:
        detection = ProjectDetectionResults()
        detection.add_result(
            "infrastructure",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={"typescript": "tsconfig.json"},
            ),
        )
        detection.add_result(
            "build_tools",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={"turbo": "turbo.json"},
            ),
        )

        validation = _detect_validation_commands(detection)

        assert validation.typecheck == "turbo run typecheck"
        assert validation.lint == "turbo run lint"
        assert validation.test == "turbo run test"

    def test_python_project(self) -> None:
        detection = ProjectDetectionResults()
        detection.add_result(
            "infrastructure",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={"python": "pyproject.toml"},
            ),
        )

        validation = _detect_validation_commands(detection)

        assert "mypy" in validation.typecheck
        assert "ruff" in validation.lint
        assert "pytest" in validation.test

    def test_default_commands(self) -> None:
        detection = ProjectDetectionResults()

        validation = _detect_validation_commands(detection)

        assert "No typecheck" in validation.typecheck
        assert "No lint" in validation.lint
        assert validation.test == "npm test"


class TestGenerateAllConfigs:
    """Test generate_all_configs integration."""

    def test_always_generates_worktree_config(self) -> None:
        answers: InstallAnswers = {}
        detection = ProjectDetectionResults()

        configs = generate_all_configs(answers, detection, Path("."))

        assert ".agents/.worktree-config.toml" in configs

    def test_generates_services_config_when_docker_enabled(self) -> None:
        answers: InstallAnswers = {
            "enable_services": "yes",
        }
        detection = ProjectDetectionResults()
        detection.add_result(
            "infrastructure",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={"docker": "docker-compose.yml"},
            ),
        )

        configs = generate_all_configs(answers, detection, Path("."))

        assert ".agents/.worktree-services.toml" in configs

    def test_generates_setup_script_when_auto_detect(self) -> None:
        answers: InstallAnswers = {
            "setup_script_type": "auto-detect",
        }
        detection = ProjectDetectionResults()
        detection.add_result(
            "package_managers",
            DetectionResult(
                detected=True,
                confidence=0.9,
                details={"npm": "package-lock.json"},
            ),
        )

        configs = generate_all_configs(answers, detection, Path("."))

        assert "scripts/worktree-setup.sh" in configs
        assert "npm install" in configs["scripts/worktree-setup.sh"]
