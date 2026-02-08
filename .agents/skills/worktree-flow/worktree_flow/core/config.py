"""Configuration handling for worktree lifecycle management."""

from pathlib import Path

from worktree_flow.lib.toml_utils import (
    parse_key_value_line,
    parse_toml_value,
    update_toml_fields,
)

STATUS_FILE = "worktree-status.toml"
CONFIG_FILE = ".agents/.worktree-config.toml"

DEFAULT_VALIDATION_TIMEOUT = 300  # 5 minutes

# Re-export for backwards compatibility
__all__ = ["parse_toml_value", "parse_key_value_line", "update_toml_fields"]


def get_config(worktree_root: Path | None = None) -> dict[str, str]:
    """Load worktree config from .agents/.worktree-config.toml."""
    root = worktree_root or Path.cwd()
    config_path = root / CONFIG_FILE

    if not config_path.exists():
        return {}

    config: dict[str, str] = {}
    for line in config_path.read_text().splitlines():
        parsed = parse_key_value_line(line)
        if parsed:
            config[parsed[0]] = parsed[1]

    return config


def get_validation_config(worktree_root: Path | None = None) -> dict[str, str]:
    """Load validation config from [validation] section of .worktree-config.toml."""
    root = worktree_root or Path.cwd()
    config_path = root / CONFIG_FILE

    if not config_path.exists():
        return {}

    validation_config: dict[str, str] = {}
    in_validation_section = False

    for line in config_path.read_text().splitlines():
        stripped = line.strip()

        if stripped.startswith("[") and stripped.endswith("]"):
            in_validation_section = stripped == "[validation]"
            continue

        if in_validation_section:
            parsed = parse_key_value_line(line)
            if parsed:
                validation_config[parsed[0]] = parsed[1]

    return validation_config


