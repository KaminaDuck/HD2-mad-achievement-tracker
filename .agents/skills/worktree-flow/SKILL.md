---
name: worktree-flow
version: "2.1.0"
description: Advanced worktree lifecycle management with 7-phase state machine, lifecycle hooks, service orchestration, validation gates, and interactive installation helper
---

# Worktree Flow

## Overview

Worktree-Flow is a structured workflow system that transforms basic git worktree operations into a managed, phase-gated development lifecycle.

**Prerequisites:** Familiarity with [using-git-worktrees](/using-git-worktrees) for basic worktree operations.

**Announce at start:** "I'm using the worktree-flow skill to manage this development lifecycle."

## New in v2.1

- **Installation Helper**: Auto-detect project patterns and generate configuration
- **Configuration Optimizer**: Audit and fix existing configurations
- **v1 to v2 Migration**: Automatic upgrade of old configuration patterns
- **Agent Interaction Guidelines**: Explicit prompts for user input during setup

> **Version Note:** The canonical version is defined in `skills/worktree-flow/pyproject.toml`. The CLI reads this dynamically via `get_version()`.

## New in v2.0

- **Python Package**: Import with `from worktree_flow import ...`
- **Lifecycle Hooks**: Customizable pre/post scripts for each phase
- **Service Orchestration**: Optional Docker Compose integration
- **Port Allocation**: Hash-based unique ports per worktree
- **Orphan Prevention**: Blocks removal with running containers
- **Python Status**: `uv run -m worktree_flow.cli status`

## Why Worktree-Flow?

| Feature | Basic Worktrees | Worktree-Flow |
|---------|-----------------|---------------|
| Isolation | Yes | Yes |
| Phase tracking | No | 7-phase lifecycle |
| Edit guards | No | Blocked outside `implementing` |
| Commit gates | No | Requires user approval |
| Validation gates | No | Typecheck, lint, test before review |
| Audit trail | No | Timestamped status file |

## Lifecycle Diagram

```
                                    WORKTREE LIFECYCLE
    ┌──────────────────────────────────────────────────────────────────────────┐
    │                                                                          │
    │   ┌──────────┐    ┌─────────────┐    ┌───────────┐    ┌──────────────┐  │
    │   │  CREATED ├───►│ INITIALIZED ├───►│ VALIDATED ├───►│ IMPLEMENTING │  │
    │   └──────────┘    └─────────────┘    └───────────┘    └──────┬───────┘  │
    │        │                │                  │                  │          │
    │   git worktree     setup script       validation          file edits    │
    │      add              runs             passes              allowed      │
    │                                                                │          │
    │                                                                ▼          │
    │   ┌──────────┐    ┌─────────────┐    ┌────────────────────────────────┐  │
    │   │ CLEANED  │◄───┤   MERGED    │◄───┤    HUMAN-MANUAL-REVIEW         │  │
    │   └──────────┘    └─────────────┘    └────────────────────────────────┘  │
    │        │                │                           │                    │
    │   worktree          changes                   commits allowed            │
    │   removed           merged                   (requires approval)         │
    │                                                                          │
    └──────────────────────────────────────────────────────────────────────────┘
```

## Phase Definitions

| Phase | Meaning | Allowed Operations |
|-------|---------|-------------------|
| `created` | Worktree exists | Run setup script |
| `initialized` | Dependencies installed | Run validation |
| `validated` | Tests passing | Begin implementation |
| `implementing` | Active development | **File edits allowed** |
| `human-manual-review` | User reviewing | **Commits allowed** |
| `merged` | Changes integrated | Cleanup |
| `cleaned` | Worktree removed | (Terminal) |

## CLI Commands

All state changes go through the CLI:

```bash
# Show current phase
uv run -m worktree_flow.cli show

# Transition to next phase
uv run -m worktree_flow.cli transition <phase>

# List all phases
uv run -m worktree_flow.cli phases

# Show all worktrees status
uv run -m worktree_flow.cli status
uv run -m worktree_flow.cli status --json

# Run pre-review validations only (without transitioning)
uv run -m worktree_flow.cli transition human-manual-review --validation-only --simplified

# Transition to review (requires approval)
uv run -m worktree_flow.cli transition human-manual-review \
  --simplified \
  --approval "Implemented feature X as requested" \
  --commit-message "feat(x): add feature X"
```

## Installation Helper

Use `/worktree-flow install` or `/worktree-flow optimize-configuration` to set up or audit your configuration.

## Agent Interaction Guidelines

When analyzing a project for worktree-flow setup or migration, **ask the user questions** before generating configuration. Use `AskUserQuestion` to gather input rather than making assumptions.

### Scope Questions
- Which worktrees should be affected (all, new only, selective)?
- Are there in-progress worktrees that should be left unchanged?

### Feature Questions
- Which lifecycle features should be enabled (hooks, services, validation gates)?
- What level of enforcement is desired (strict vs permissive)?

### Understanding Questions
- What is the primary development workflow (solo, team, CI/CD)?
- Are there existing patterns or conventions to preserve?

**Do not assume** - ask first, then generate configuration based on answers.

### `/worktree-flow install`

Auto-detect project patterns and generate configuration:

```bash
# Auto-detect and generate config
uv run skills/worktree-flow/config/cli.py install

# Preview without writing files
uv run skills/worktree-flow/config/cli.py install --dry-run
```

**What it detects:**
- Package managers: bun, pnpm, npm, yarn, uv, pip, cargo
- Build tools: Make, turbo, nx, gradle
- Docker: Compose files and services
- Dev servers: Vite, webpack, Next.js
- Frameworks: TypeScript, Python, React, Go

**What it generates:**
- `.agents/.worktree-config.toml` - Main lifecycle config
- `.agents/.worktree-services.toml` - Service orchestration (if Docker)
- `scripts/worktree-setup.sh` - Setup script (if needed)

### `/worktree-flow optimize-configuration`

Audit existing configuration and fix issues:

```bash
# Audit only
uv run skills/worktree-flow/config/cli.py optimize

# Audit and auto-fix
uv run skills/worktree-flow/config/cli.py optimize --fix

# Preview fixes
uv run skills/worktree-flow/config/cli.py optimize --fix --dry-run

# Output as JSON
uv run skills/worktree-flow/config/cli.py optimize --json
```

**What it checks:**
- Missing required config files
- Invalid/broken paths in config
- Outdated v1 patterns
- Missing validation commands
- Hook script existence

## Makefile Integration

```bash
# Install/configure worktree-flow
make worktree-install
make worktree-optimize

# Show status of all worktrees
make worktree-status

# Run post-init hook (show endpoints)
make worktree-init

# Check service health (if configured)
make worktree-services-health

# Start/stop Docker services (if configured)
make worktree-services-start
make worktree-services-stop

# Run pre-review validations only
make worktree-validate

# Validate and transition to review
make worktree-review-ready APPROVAL="description" MSG="commit message"

# Cleanup worktree
make worktree-cleanup WT=.worktrees/my-feature
```

## Pre-Review Validation Gate

Before transitioning to `human-manual-review`, the CLI automatically runs:

1. **Typecheck** - `make ts-typecheck`
2. **Lint** - `make ts-lint`
3. **Test** - `make ts-test`
4. **Code-simplifier** - Requires `--simplified` flag

**Transition is blocked if any validation fails.**

Configuration in `.agents/.worktree-config.toml`:
```toml
[validation]
typecheck_command = "make ts-typecheck"
lint_command = "make ts-lint"
test_command = "make ts-test"
require_simplified = true
timeout = 300
```

## Enforcement Hooks

### 1. enforce-implementing
Blocks file edits except during `implementing` phase.

### 2. protect-status-file
Blocks manual edits to `worktree-status.toml` - use CLI instead.

### 3. enforce-worktree
Blocks file edits in main repo - only allows edits in worktrees.

### 4. request-review
Generates formatted review summary before commits.

### 5. prevent-orphan-containers
Blocks worktree removal when Docker containers are still running.

## Hook Configuration

Add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/skills/worktree-flow/hooks/enforce-implementing/claude.py"
        },
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/skills/worktree-flow/hooks/protect-status-file/claude.py"
        },
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/skills/worktree-flow/hooks/enforce-worktree/claude.py"
        },
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/skills/worktree-flow/hooks/prevent-orphan-containers/claude.py"
        }
      ]
    }]
  }
}
```

## Lifecycle Hooks

Hooks execute during phase transitions. Missing hooks are skipped silently.

Configure in `.agents/.worktree-config.toml`:
```toml
[lifecycle.hooks]
post_init = "skills/worktree-flow/lifecycle/post_init.py"
pre_validate = "skills/worktree-flow/lifecycle/pre_validate.py"
pre_review = "skills/worktree-flow/lifecycle/pre_review.py"
pre_merge = "skills/worktree-flow/lifecycle/pre_merge.py"
pre_cleanup = "skills/worktree-flow/lifecycle/pre_cleanup.py"
```

See [lifecycle-hooks.md](docs/lifecycle-hooks.md) for customization details.

## Service Configuration (Optional)

Create `.agents/.worktree-services.toml` to enable:
- Hash-based port allocation (unique ports per worktree)
- Service health checking with status indicators
- Orphan container prevention

```toml
[docker]
prefix = "myproject"

[ports]
server = 19091
webui = 19071

[[services]]
name = "Server"
port_key = "server"
health_path = "/health"
```

See [service-configuration.md](docs/service-configuration.md) for details.

## Status File

The lifecycle state is tracked in `worktree-status.toml`:

```toml
branch = "feature/my-feature"
base_branch = "main"
current_phase = "implementing"

created_at = "2026-01-11T10:00:00Z"
initialized_at = "2026-01-11T10:01:00Z"
validated_at = "2026-01-11T10:02:00Z"
implementing_at = "2026-01-11T10:03:00Z"

simplified = false
linted = false
tested = true

server_port = 19099
webui_port = 19072
```

## Quick Reference

| Situation | Action |
|-----------|--------|
| First-time setup | `uv run skills/worktree-flow/config/cli.py install` |
| Audit configuration | `uv run skills/worktree-flow/config/cli.py optimize` |
| Check current phase | `uv run -m worktree_flow.cli show` |
| Advance phase | `uv run -m worktree_flow.cli transition <phase>` |
| View all worktrees | `uv run -m worktree_flow.cli status` |
| View as JSON | `uv run -m worktree_flow.cli status --json` |
| Manual status edit blocked | Use CLI to transition |
| Ready for review | Run code-simplifier, use `--simplified` |
| Test validations only | `transition human-manual-review --validation-only` |
| Validation fails | Fix issues, re-run validation |
| Get user approval | Transition to `human-manual-review` with `--approval` |
| Check service health | `make worktree-services-health` |

## Example Workflow

```bash
# 1. Create worktree (see using-git-worktrees for details)
git worktree add .worktrees/my-feature -b feature/my-feature
cd .worktrees/my-feature

# 2. Progress through phases
uv run -m worktree_flow.cli transition created
uv run -m worktree_flow.cli transition initialized
uv run -m worktree_flow.cli transition validated
uv run -m worktree_flow.cli transition implementing

# 3. Implement feature (edits allowed in implementing phase)

# 4. Request review (requires approval and passing validations)
uv run -m worktree_flow.cli transition human-manual-review \
  --simplified \
  --approval "Implemented auth feature" \
  --commit-message "feat(auth): add login functionality"

# 5. Commit and merge (after user approval)
git add -A && git commit -m "feat(auth): add login functionality"

# 6. Merge and cleanup
uv run -m worktree_flow.cli transition merged
uv run -m worktree_flow.cli transition cleaned
```

## Common Mistakes

**Editing files outside implementing phase**
- **Problem:** Hook blocks the edit
- **Fix:** Transition to `implementing` first: `cli.py transition implementing`

**Manual status file edits**
- **Problem:** Hook blocks the edit
- **Fix:** Use CLI to change phases

**Skipping code-simplifier**
- **Problem:** Transition to review requires `--simplified` flag
- **Fix:** Run code-simplifier before review, then use `--simplified`

**Validation failures blocking review**
- **Problem:** Can't transition to `human-manual-review`
- **Fix:** Fix typecheck/lint/test errors, then retry

## Documentation

- [Lifecycle Specification](docs/lifecycle-spec.md) - Detailed phase definitions
- [Lifecycle Hooks](docs/lifecycle-hooks.md) - Hook customization
- [Service Configuration](docs/service-configuration.md) - Docker integration
- [Agent Integration](docs/agent-integration.md) - Runtime hook configuration
- [CHANGELOG](CHANGELOG.md) - Version history

## Integration

**Builds on:**
- [using-git-worktrees](/using-git-worktrees) - Basic worktree operations

**Called by:**
- Projects requiring structured development workflows
- Teams needing audit trails for agent changes

> **CRITICAL: User Review Before Commit**
>
> The `human-manual-review` phase exists specifically to ensure users review changes before they're committed. Never bypass this - it's the core safety mechanism.
