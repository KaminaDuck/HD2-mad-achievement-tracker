# Worktree Lifecycle Specification

Standardized system for managing git worktree initialization, validation, and cleanup.

## Overview

```
CREATED -> INITIALIZED -> VALIDATED -> IMPLEMENTING -> HUMAN-MANUAL-REVIEW -> MERGED -> CLEANED
```

Each phase has PRE and POST hook boundaries for runtime integration.

## Phases

### Created
`git worktree add <path> -b <branch>` - Creates isolated workspace.

### Initialized
Runs `setup_script` from config. Auto-detects if no config:

| File | Command |
|------|---------|
| `package.json` | `npm install` / `bun install` |
| `Cargo.toml` | `cargo build` |
| `pyproject.toml` | `uv sync` / `poetry install` |
| `go.mod` | `go mod download` |

### Validated
Runs `validation_command`. Records `validation_passed` in status file.
On failure: report to user, ask how to proceed.

### Implementing
Active development phase. File edits are allowed only in this phase.
Generates `worktree-status.toml` with timestamps and state.

### Human-Manual-Review
User reviews changes before commit. Generates formatted review request displaying:
- Branch and base branch
- Diff stats and file list
- Proposed commit message
- Action options (approve, show diff, modify)

Commits are only allowed in this phase (requires explicit approval).

### Merged
Integrates changes to target branch. **Requires explicit user approval.**

### Cleaned
`git worktree remove` + `git branch -d`. Runs optional `cleanup_script`. Terminal state.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `WORKTREE_PATH` | Absolute path to worktree |
| `WORKTREE_BRANCH` | Branch name |
| `REPO_ROOT` | Main repository root |
| `BASE_BRANCH` | Branch worktree created from |
| `VALIDATION_PASSED` | `true`/`false` (after validate) |
| `MERGE_TARGET` | Target branch (during merge) |

## Configuration

### .agents/.worktree-config.toml

```toml
setup_script = "scripts/worktree-setup.sh"
validation_command = "make test"
cleanup_script = ""
env_file = ""
status_file_path = "worktree-status.toml"
```

### worktree-status.toml (generated)

```toml
branch = "feature/my-feature"
base_branch = "main"
repo_root = "/path/to/repo"
worktree_path = "/path/to/repo/.worktrees/my-feature"

created_at = "2025-01-10T14:30:00Z"
initialized_at = "2025-01-10T14:31:00Z"
validated_at = "2025-01-10T14:32:00Z"
merged_at = ""
cleaned_at = ""

validation_passed = true
validation_summary = "47 tests passed"

server_port = 19091
webui_port = 19071
```

## Without Configuration

When `.agents/.worktree-config.toml` is absent:
- Init/Validate: Auto-detect from project files
- Other phases: Normal behavior with user approval

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Setup script fails | Record failure, ask user how to proceed |
| Validation fails | Set `validation_passed = false`, ask user |
| Script missing | Warn, skip phase, continue |

## Valid Transitions

Phases must progress in order. No skipping allowed.

| From | To |
|------|-----|
| (none) | created |
| created | initialized |
| initialized | validated |
| validated | implementing |
| implementing | human-manual-review |
| human-manual-review | merged |
| merged | cleaned |

## CLI Usage

All state changes go through the `worktree-state` CLI:

```bash
uv run skills/worktree-flow/hooks/worktree-state/cli.py show              # Current phase
uv run skills/worktree-flow/hooks/worktree-state/cli.py transition <phase> # Advance phase
uv run skills/worktree-flow/hooks/worktree-state/cli.py phases            # List all phases
```

## Protection Hook

The `protect-status-file` hook blocks manual edits to `worktree-status.toml`.

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/skills/worktree-flow/hooks/protect-status-file/claude.py"
      }]
    }]
  }
}
```
