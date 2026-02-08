# Migration Guide: using-git-worktrees → worktree-flow

This guide helps projects transition from the original `using-git-worktrees` skill (when it contained both basic and advanced functionality) to the new split structure.

## What Changed

The original `using-git-worktrees` skill has been split into two independent skills:

| Before | After |
|--------|-------|
| `using-git-worktrees` (mixed) | `using-git-worktrees` (basic only) |
| | `worktree-flow` (advanced lifecycle) |

### Why the Split?

1. **Separation of concerns** - Basic git worktree knowledge is portable; lifecycle management is project-specific
2. **Independent versioning** - Advanced features can evolve without affecting basic documentation
3. **Reduced complexity** - Users wanting simple worktrees aren't overwhelmed with state machine docs
4. **Flexible adoption** - Projects can choose basic-only, advanced-only, or both

## Path Changes

### CLI Commands

```bash
# Old path
uv run skills/development/using-git-worktrees/hooks/worktree-state/cli.py show

# New path
uv run skills/worktree-flow/hooks/worktree-state/cli.py show
```

### Makefile Targets

Makefile targets (`worktree-validate`, `worktree-review-ready`) now reference `skills/worktree-flow/`.

No changes required if you're using Make commands directly.

### Hook Configuration

Update `.claude/settings.json` hook paths:

**Old path:**
```
skills/development/using-git-worktrees/hooks/enforce-implementing/claude.py
```

**New path:**
```
skills/worktree-flow/hooks/enforce-implementing/claude.py
```

Example configuration:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "",
      "hooks": [{
        "type": "command",
        "command": "$CLAUDE_PROJECT_DIR/skills/worktree-flow/hooks/enforce-implementing/claude.py"
      }]
    }]
  }
}
```

### Skill Invocation

| Task | Skill to Use |
|------|-------------|
| Create basic worktree | `/using-git-worktrees` |
| Lifecycle-managed worktree | `/worktree-flow` |
| Phase transitions | `/worktree-flow` |
| Review workflow | `/worktree-flow` |

### Documentation References

| Old Reference | New Reference |
|---------------|---------------|
| `skills/development/using-git-worktrees/docs/lifecycle-spec.md` | `skills/worktree-flow/docs/lifecycle-spec.md` |
| `skills/development/using-git-worktrees/docs/agent-integration.md` | `skills/worktree-flow/docs/agent-integration.md` |
| `skills/development/using-git-worktrees/hooks/*` | `skills/worktree-flow/hooks/*` |
| `skills/development/using-git-worktrees/templates/*` | `skills/worktree-flow/templates/*` |

## Migration Steps

### 1. Update CLAUDE.md

Replace lifecycle references:

```markdown
## Worktree Setup
Use the `/worktree-flow` skill to manage your development workflow.

For basic worktree operations without lifecycle management, see `/using-git-worktrees`.
```

### 2. Update Hook Paths

Search and replace in `.claude/settings.json`:

```bash
# Find occurrences
rg "using-git-worktrees/hooks" .claude/

# Replace (manual or sed)
s|skills/development/using-git-worktrees/hooks|skills/worktree-flow/hooks|g
```

### 3. Update Makefile (if customized)

Search for old paths:

```bash
rg "using-git-worktrees" Makefile
```

Replace with `worktree-flow` for CLI/hook references.

### 4. Verify Existing Worktrees

Existing worktrees continue to work. The `worktree-status.toml` format is unchanged.

```bash
# Check worktree status
./scripts/worktree-status.sh

# Verify CLI works
uv run skills/worktree-flow/hooks/worktree-state/cli.py show
```

## Backwards Compatibility

### What Still Works

- Existing `worktree-status.toml` files
- Existing `.worktree-ports` files
- All phase transitions and states
- Scripts in `scripts/` directory

### What Requires Updates

- Hook paths in `.claude/settings.json`
- Direct CLI invocations using old paths
- Custom documentation referencing old locations

## Common Issues

### "Module not found" errors

If Python imports fail, ensure you're using the new path:

```bash
# Wrong
uv run skills/development/using-git-worktrees/hooks/...

# Correct
uv run skills/worktree-flow/hooks/...
```

### Hooks not firing

Verify `.claude/settings.json` has updated paths. The hook paths must exactly match the new location.

### "Skill not found" when invoking

Ensure `.claude/skills/worktree-flow` symlink exists and points to `../../skills/worktree-flow`.

## Questions?

- See `/worktree-flow` SKILL.md for current documentation
- See `/using-git-worktrees` for basic worktree operations
- Check `skills/worktree-flow/docs/` for detailed specifications
