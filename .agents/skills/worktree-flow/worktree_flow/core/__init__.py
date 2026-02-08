"""Core state machine and validation logic."""

from worktree_flow.core.config import (
    CONFIG_FILE,
    DEFAULT_VALIDATION_TIMEOUT,
    STATUS_FILE,
    get_config,
    get_validation_config,
    parse_toml_value,
)
from worktree_flow.core.hooks import (
    DEFAULT_HOOK_PATHS,
    HOOK_POINTS,
    PHASE_HOOKS,
    HookPoint,
    get_hook_path,
    get_hook_paths,
    run_lifecycle_hook,
    run_phase_hooks,
)
from worktree_flow.core.state import (
    PHASES,
    PHASES_REQUIRING_APPROVAL,
    VALID_TRANSITIONS,
    can_transition,
    do_transition,
    get_current_phase,
    get_phase_history,
    get_status_file_path,
    run_phase_script,
)
from worktree_flow.core.validation import (
    ValidationResult,
    ValidationSummary,
    run_single_validation,
    run_validations,
)

__all__ = [
    # Config
    "CONFIG_FILE",
    "STATUS_FILE",
    "DEFAULT_VALIDATION_TIMEOUT",
    "get_config",
    "get_validation_config",
    "parse_toml_value",
    # Hooks
    "HOOK_POINTS",
    "DEFAULT_HOOK_PATHS",
    "PHASE_HOOKS",
    "HookPoint",
    "get_hook_paths",
    "get_hook_path",
    "run_lifecycle_hook",
    "run_phase_hooks",
    # State
    "PHASES",
    "PHASES_REQUIRING_APPROVAL",
    "VALID_TRANSITIONS",
    "get_status_file_path",
    "get_current_phase",
    "get_phase_history",
    "can_transition",
    "do_transition",
    "run_phase_script",
    # Validation
    "ValidationResult",
    "ValidationSummary",
    "run_single_validation",
    "run_validations",
]
