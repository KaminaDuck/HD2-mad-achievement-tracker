"""Type definitions for worktree-flow config module."""

from typing import TypedDict


class InstallAnswers(TypedDict, total=False):
    """Typed dictionary for installation wizard answers.

    All fields are optional (total=False) since answers are collected
    incrementally based on project detection.
    """

    # Core settings
    enable_lifecycle: str  # "yes" or "no"
    setup_script_type: str  # "auto-detect", "custom", or "none"
    setup_script_path: str  # Custom path when setup_script_type is "custom"

    # Service settings (when Docker detected)
    enable_services: str  # "yes" or "no"
    docker_prefix: str  # Docker Compose project prefix
    base_server_port: str  # Base port for server services
    base_webui_port: str  # Base port for web UI services
