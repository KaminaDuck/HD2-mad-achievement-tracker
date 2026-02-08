"""Generate .agents/.worktree-config.toml from detection results."""

from dataclasses import dataclass, field
from pathlib import Path

from ..detectors.base import ProjectDetectionResults
from ..typing_defs import InstallAnswers

# Default lifecycle hook paths
DEFAULT_HOOKS = {
    "post_init": "skills/worktree-flow/lifecycle/post_init.py",
    "pre_validate": "skills/worktree-flow/lifecycle/pre_validate.py",
    "pre_review": "skills/worktree-flow/lifecycle/pre_review.py",
    "pre_merge": "skills/worktree-flow/lifecycle/pre_merge.py",
    "pre_cleanup": "skills/worktree-flow/lifecycle/pre_cleanup.py",
}

# Default template paths
DEFAULT_TEMPLATES = {
    "review_request": "skills/worktree-flow/templates/review_request.jinja",
}

# Default review script path
DEFAULT_REVIEW_SCRIPT = "uv run skills/worktree-flow/hooks/request-review/request_review.py"


@dataclass
class ValidationConfig:
    """Validation command configuration."""

    typecheck: str
    lint: str
    test: str
    require_simplified: str
    timeout: str


@dataclass
class ConfigContext:
    """Context for rendering worktree config."""

    setup_script: str
    validation_command: str
    review_script: str
    cleanup_script: str
    env_file: str
    hooks: dict[str, str] = field(default_factory=dict)
    templates: dict[str, str] = field(default_factory=dict)
    validation: ValidationConfig = field(
        default_factory=lambda: ValidationConfig(
            typecheck="", lint="", test="", require_simplified="false", timeout="300"
        )
    )


def generate_worktree_config(
    answers: InstallAnswers,
    detection_results: ProjectDetectionResults,
    _project_root: Path,  # Reserved for future project-specific customization
) -> str:
    """Generate worktree config content from answers and detection."""
    context = _build_context(answers, detection_results)
    return _render_config(context)


def _build_context(
    answers: InstallAnswers,
    detection: ProjectDetectionResults,
) -> ConfigContext:
    """Build template context from answers and detection results."""
    validation = _detect_validation_commands(detection)

    # Determine setup script path
    setup_script = ""
    if answers.get("setup_script_type") == "auto-detect":
        setup_script = "scripts/worktree-setup.sh"
    elif answers.get("setup_script_type") == "custom":
        setup_script = answers.get("setup_script_path", "")

    return ConfigContext(
        setup_script=setup_script,
        validation_command=validation.test,
        review_script=DEFAULT_REVIEW_SCRIPT,
        cleanup_script="",
        env_file="",
        hooks=DEFAULT_HOOKS.copy(),
        templates=DEFAULT_TEMPLATES.copy(),
        validation=validation,
    )


def _detect_validation_commands(detection: ProjectDetectionResults) -> ValidationConfig:
    """Detect appropriate validation commands based on project type."""
    # Use accessor methods for cleaner code
    has_make = detection.has_make()
    has_turbo = detection.has_turbo()
    has_typescript = detection.has_typescript()
    has_python = detection.has_python()

    pkg_mgr = detection.get("package_managers")
    has_bun = pkg_mgr and "bun" in pkg_mgr.details

    # Get Makefile targets using accessor
    makefile_targets = detection.get_makefile_targets()

    # TypeScript/JavaScript project with Make
    if has_typescript and has_make:
        default_typecheck = "make ts-typecheck"
        default_lint = "make ts-lint"
        default_test = "make ts-test"
        return ValidationConfig(
            typecheck=_pick_make_target(
                makefile_targets, ["ts-typecheck", "typecheck"], default_typecheck
            ),
            lint=_pick_make_target(makefile_targets, ["ts-lint", "lint"], default_lint),
            test=_pick_make_target(makefile_targets, ["ts-test", "test"], default_test),
            require_simplified="true",
            timeout="300",
        )

    # TypeScript/JavaScript project with Turbo
    if has_typescript and has_turbo:
        return ValidationConfig(
            typecheck="turbo run typecheck",
            lint="turbo run lint",
            test="turbo run test",
            require_simplified="true",
            timeout="300",
        )

    # TypeScript/JavaScript project with Bun
    if has_typescript and has_bun:
        return ValidationConfig(
            typecheck="bun run typecheck" if not has_make else "make ts-typecheck",
            lint="bun run lint" if not has_make else "make ts-lint",
            test="bun test" if not has_make else "make ts-test",
            require_simplified="true",
            timeout="300",
        )

    # Python project
    if has_python:
        return ValidationConfig(
            typecheck="uv run mypy ." if not has_make else "make typecheck",
            lint="uv run ruff check ." if not has_make else "make lint",
            test="uv run pytest" if not has_make else "make test",
            require_simplified="true",
            timeout="300",
        )

    # Default - try make targets or generic commands
    if has_make:
        no_typecheck = "echo 'No typecheck configured'"
        no_lint = "echo 'No lint configured'"
        return ValidationConfig(
            typecheck=_pick_make_target(makefile_targets, ["typecheck"], no_typecheck),
            lint=_pick_make_target(makefile_targets, ["lint"], no_lint),
            test=_pick_make_target(makefile_targets, ["test"], "make test"),
            require_simplified="false",
            timeout="300",
        )

    return ValidationConfig(
        typecheck="echo 'No typecheck configured'",
        lint="echo 'No lint configured'",
        test="npm test",
        require_simplified="false",
        timeout="300",
    )


def _pick_make_target(available: list[str], preferred: list[str], default: str) -> str:
    """Pick the first available make target from preferred list."""
    for target in preferred:
        if target in available:
            return f"make {target}"
    return default


def _render_config(context: ConfigContext) -> str:
    """Render the configuration file."""
    lines = [
        "# Worktree Lifecycle Configuration",
        "# Generated by worktree-flow install",
        "# See: skills/worktree-flow/docs/lifecycle-spec.md",
        "",
    ]

    # Core settings
    if context.setup_script:
        lines.append(f'setup_script = "{context.setup_script}"')
    lines.append(f'validation_command = "{context.validation_command}"')
    if context.review_script:
        lines.append(f'review_script = "{context.review_script}"')
    if context.cleanup_script:
        lines.append(f'cleanup_script = "{context.cleanup_script}"')
    if context.env_file:
        lines.append(f'env_file = "{context.env_file}"')
    lines.append('status_file_path = "worktree-status.toml"')
    lines.append("")

    # Lifecycle hooks
    lines.append("[lifecycle.hooks]")
    for hook_name, hook_path in context.hooks.items():
        lines.append(f'{hook_name} = "{hook_path}"')
    lines.append("")

    # Templates
    lines.append("[lifecycle.templates]")
    for template_name, template_path in context.templates.items():
        lines.append(f'{template_name} = "{template_path}"')
    lines.append("")

    # Validation
    lines.append("[validation]")
    lines.append(f'typecheck_command = "{context.validation.typecheck}"')
    lines.append(f'lint_command = "{context.validation.lint}"')
    lines.append(f'test_command = "{context.validation.test}"')
    lines.append(f'require_simplified = {context.validation.require_simplified}')
    lines.append(f'timeout = {context.validation.timeout}')

    return "\n".join(lines) + "\n"
