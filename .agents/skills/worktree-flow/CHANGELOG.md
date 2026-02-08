# Changelog

All notable changes to the worktree-flow skill.

## [2.2.0] - 2026-01-15

### Added
- **Container Runtime Abstraction**: Support for Docker and Podman
  - Auto-detection of available runtimes (Docker preferred)
  - Support for compose variants: `docker-compose` (v1), `docker compose` (v2), `podman compose`
  - New `runtime` configuration option in `.worktree-services.toml`
  - Runtime-agnostic error messages and cleanup commands
  - New module: `worktree_flow.lib.container_runtime`

- **New Functions**:
  - `get_container_status()` - Get compose container statuses (runtime-agnostic)
  - `compose_down()` - Stop compose services (runtime-agnostic)
  - `get_runtime()` - Get detected container runtime instance
  - `ContainerRuntime` class with detection and compose operations

### Fixed
- **Critical**: Implemented missing `docker_compose_down()` function
  - The `pre_cleanup.py` hook now works correctly
  - Worktree cleanup no longer fails with ImportError

### Changed
- `get_docker_compose_status()` now uses runtime abstraction (backward-compatible alias)
- `docker_compose_down()` now uses runtime abstraction (backward-compatible alias)
- `prevent-orphan-containers` hook shows runtime-specific cleanup commands
- `pre_validate.py` shows runtime-specific logs command
- Setup script generator produces runtime-appropriate compose commands
- Service config generator includes `runtime` field

### Documentation
- Updated `service-configuration.md` with Container Runtime Support section
- Added Podman setup instructions
- Updated cleanup workflow examples

## [2.1.0] - 2026-01-13

### Added
- **Installation Helper** (`/worktree-flow install`):
  - Auto-detects project patterns (package managers, build tools, Docker, frameworks)
  - Generates `.agents/.worktree-config.toml` with appropriate validation commands
  - Generates `.agents/.worktree-services.toml` for Docker projects
  - Generates `scripts/worktree-setup.sh` setup script
  - `--dry-run` flag to preview without writing

- **Configuration Optimizer** (`/worktree-flow optimize-configuration`):
  - Audits existing configuration for issues
  - Detects missing sections, invalid paths, outdated patterns
  - `--fix` flag to auto-fix detected issues
  - `--json` flag for machine-readable output
  - Migrates v1 patterns to v2

- **New Detectors**:
  - Package managers: bun, pnpm, npm, yarn, uv, pip, cargo
  - Build tools: Make, turbo, nx, gradle, just
  - Infrastructure: Docker Compose, Vite, Next.js, webpack
  - Frameworks: TypeScript, Python, React, Go, Rust

- **New Makefile Targets**:
  - `make worktree-install` - Run installation helper
  - `make worktree-optimize` - Run configuration optimizer

### Changed
- SKILL.md updated with Installation Helper section
- Quick Reference table now includes install/optimize commands

## [2.0.0] - 2026-01-12

### Added
- **Python Package**: Restructured as `worktree-flow` uv package
- **Lifecycle Hooks**: Configurable pre/post hooks for phase transitions
  - `post_init`, `pre_validate`, `pre_review`, `pre_merge`, `pre_cleanup`
  - Hooks are optional - skipped silently if script doesn't exist
- **Service Orchestration** (optional):
  - Hash-based port allocation (10-99 offset)
  - Dual-format port files (shell + Makefile)
  - Service health checking with status indicators
- **Orphan Prevention**: Hook blocks worktree removal with running containers
- **Python Status Dashboard**: Replaces bash worktree-status.sh
  - `uv run -m worktree_flow.cli status`
  - `--json` flag for machine-readable output
  - Service health indicators in table
- **Performance Logging**: Optional timing instrumentation
  - Enable with `WORKTREE_PERF_LOG=1`
- **Jinja Templates**: Review request uses Jinja templating

### Changed
- **CLI Module Structure**: Split core.py into state, validation, config modules
- **Import Paths**: Clean break - all hooks use `from worktree_flow.core import ...`
- **Makefile Targets**: `worktree-status` now uses Python version

### Documentation
- New: `docs/lifecycle-hooks.md` - Hook system documentation
- New: `docs/service-configuration.md` - Service setup guide
- Updated: `SKILL.md` - All new features documented
- Updated: `docs/agent-integration.md` - Orphan prevention hook

## [1.0.0] - 2026-01-11

Initial release as standalone skill, extracted from `using-git-worktrees`.

### Added
- 7-phase lifecycle state machine with enforcement
- CLI tool (`worktree-state`) for phase transitions
- Pre-review validation gate (typecheck, lint, test)
- `--simplified` flag to confirm code-simplifier was run
- `--validation-only` flag to run validations without transitioning
- Protection hook to block manual status file edits
- Enforcement hooks: `enforce-implementing`, `enforce-worktree`, `request-review`
- `[validation]` section in `.worktree-config.toml`
- `make worktree-validate` and `make worktree-review-ready` Makefile targets
- Lifecycle specification and agent integration documentation

### Phases
`created` -> `initialized` -> `validated` -> `implementing` -> `human-manual-review` -> `merged` -> `cleaned`
