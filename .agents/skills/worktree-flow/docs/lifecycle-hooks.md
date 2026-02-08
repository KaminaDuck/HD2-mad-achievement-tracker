# Lifecycle Hooks

## Overview

Worktree-flow supports configurable lifecycle hooks that execute during phase transitions. Hooks are **optional** - if a hook script doesn't exist, the transition proceeds without it.

## Hook Points

| Hook | Phase | Purpose |
|------|-------|---------|
| `post_init` | After `initialized` | Display endpoints, show next steps |
| `pre_validate` | Before `validated` | Auto-start services, check health |
| `pre_review` | Before `human-manual-review` | Generate review preview |
| `pre_merge` | Before `merged` | Verify merge readiness |
| `pre_cleanup` | Before `cleaned` | Stop services, cleanup files |

## Configuration

Configure hook paths in `.agents/.worktree-config.toml`:

```toml
[lifecycle.hooks]
post_init = "skills/worktree-flow/lifecycle/post_init.py"
pre_validate = "skills/worktree-flow/lifecycle/pre_validate.py"
pre_review = "skills/worktree-flow/lifecycle/pre_review.py"
pre_merge = "skills/worktree-flow/lifecycle/pre_merge.py"
pre_cleanup = "skills/worktree-flow/lifecycle/pre_cleanup.py"

[lifecycle.templates]
review_request = "skills/worktree-flow/templates/review_request.jinja"
```

## Hook Behavior

### Optional by Default

If a hook script doesn't exist at the configured path, the hook is **skipped silently**. This allows:
- Using only the hooks you need
- Gradual adoption of new hooks
- Project-specific hook selection

### Non-Blocking Failures

Hook failures **warn but don't block** transitions. This ensures:
- Phase transitions always complete
- Hook errors don't break workflows
- Users can fix hook issues without being stuck

### Environment Variables

Hooks receive these environment variables:
- `WORKTREE_PATH` - Path to the worktree root

## Writing Custom Hooks

### Hook Script Template

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = ["worktree-flow"]
#
# [tool.uv.sources]
# worktree-flow = { path = "../" }
# ///
"""Description of what this hook does."""
from pathlib import Path

from worktree_flow.lib.common import get_worktree_root


def main() -> None:
    root = get_worktree_root()

    # Your hook logic here
    print(f"Hook running in: {root}")


if __name__ == "__main__":
    main()
```

### Using the Library

Hooks can import from the worktree_flow library:

```python
from worktree_flow.lib.common import (
    get_worktree_root,
    read_ports,
    read_status,
    run_git,
    get_branch_info,
)
from worktree_flow.lib.services import (
    load_services,
    check_all_services,
    print_endpoints,
    get_docker_compose_status,
    count_running_containers,
)
```

### Exit Codes

- `0` - Success (or warning)
- Non-zero - Logged as warning, doesn't block transition

## Default Hooks

### post_init

Runs after transitioning to `initialized`:
- Prints worktree location
- Displays service endpoints (if configured)
- Shows next step instructions

### pre_validate

Runs before transitioning to `validated`:
- Checks if services are configured (skips if not)
- Verifies port configuration exists (exits with error if missing)
- Auto-starts services via `make worktree-dev` if not running
- Handles Docker unavailability gracefully
- Reports service health status

### pre_review

Runs before transitioning to `human-manual-review`:
- Renders review request template
- Shows staged changes summary
- Displays verification status

### pre_merge

Runs before transitioning to `merged`:
- Checks for uncommitted changes
- Verifies service health
- Reports branch staleness

### pre_cleanup

Runs before transitioning to `cleaned`:
- Stops Docker Compose services
- Removes generated port files
- Prepares worktree for removal

## Customization Examples

### Adding a Custom Check

Create a pre-validate hook that checks for required environment variables:

```python
#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.11"
# dependencies = []
# ///
"""Check required environment variables before validation."""
import os
import sys

REQUIRED_VARS = ["API_KEY", "DATABASE_URL"]


def main() -> None:
    missing = [v for v in REQUIRED_VARS if not os.environ.get(v)]

    if missing:
        print(f"Warning: Missing environment variables: {', '.join(missing)}")
        print("Some features may not work correctly.")
    else:
        print("All required environment variables set.")


if __name__ == "__main__":
    main()
```

### Skipping Service Checks

To skip service checks entirely, simply delete or rename the `pre_validate.py` hook.

## Performance Logging

Hooks can use the timing utilities for performance instrumentation:

```python
from worktree_flow.lib.timing import Timer, write_performance_log

with Timer("my_operation") as t:
    do_something()

print(f"Operation took {t['duration']:.2f}s")
```

Enable performance logging with `WORKTREE_PERF_LOG=1`.
