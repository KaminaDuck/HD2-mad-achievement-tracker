"""Configuration file generators for worktree-flow."""

from pathlib import Path

from ..detectors.base import ProjectDetectionResults
from ..typing_defs import InstallAnswers
from .services_config import generate_services_config
from .setup_script import generate_setup_script
from .worktree_config import generate_worktree_config


def generate_all_configs(
    answers: InstallAnswers,
    detection_results: ProjectDetectionResults,
    project_root: Path,
) -> dict[str, str]:
    """Generate all configuration files based on answers and detection."""
    configs: dict[str, str] = {}

    # Always generate worktree config
    configs[".agents/.worktree-config.toml"] = generate_worktree_config(
        answers, detection_results, project_root
    )

    # Generate services config if Docker detected and enabled
    if detection_results.has("infrastructure") and answers.get("enable_services") == "yes":
        infra = detection_results.get("infrastructure")
        if infra and "docker" in infra.details:
            configs[".agents/.worktree-services.toml"] = generate_services_config(
                answers, detection_results
            )

    # Generate setup script if requested
    if answers.get("setup_script_type") == "auto-detect":
        setup_script = generate_setup_script(answers, detection_results)
        if setup_script:
            configs["scripts/worktree-setup.sh"] = setup_script

    return configs


__all__ = [
    "generate_all_configs",
    "generate_worktree_config",
    "generate_services_config",
    "generate_setup_script",
]
