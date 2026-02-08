# Agent Runtime Integration Guide

How agent runtimes (Claude Code, Cursor, Cline, etc.) hook into the worktree lifecycle.

## Responsibility Boundaries

| Skill (worktree-flow) | Runtime (Claude Code, etc.) |
|-----------------------------|------------------------------|
| Define lifecycle phases | Execute hook scripts |
| Define hook boundaries | Configure hook mappings |
| Generate status file | Handle hook failures |
| Track phase timestamps | Provide hook environment |

## Hook Boundaries

| Phase | Pre Hook | Post Hook |
|-------|----------|-----------|
| Create | `pre_create` | `post_create` |
| Init | `pre_init` | `post_init` |
| Validate | `pre_validate` | `post_validate` |
| Report | `pre_report` | `post_report` |
| Merge | `pre_merge` | `post_merge` |
| Cleanup | `pre_cleanup` | `post_cleanup` |

## Environment Variables

Runtimes should provide these to all hooks:

### Standard (Always Available)

```bash
WORKTREE_PATH="/home/user/project/.worktrees/feature-x"
WORKTREE_BRANCH="feature/my-feature"
REPO_ROOT="/home/user/project"
BASE_BRANCH="main"
```

### Phase-Specific

```bash
VALIDATION_PASSED="true"  # Available after validate phase
MERGE_TARGET="main"       # Available during merge phase
SETUP_DURATION_MS="45000" # Available after init phase
```

## Accessing Status File

Hooks can read `worktree-status.toml` for context:

```bash
VALIDATION_PASSED=$(grep "validation_passed" "$WORKTREE_PATH/worktree-status.toml" | cut -d'=' -f2 | tr -d ' ')
```

## Claude Code Configuration

To enable worktree-flow hooks in Claude Code, add this to `.claude/settings.json`:

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

### Hook Descriptions

| Hook | Purpose |
|------|---------|
| `enforce-implementing` | Blocks file edits except during `implementing` phase |
| `protect-status-file` | Blocks manual edits to `worktree-status.toml` |
| `enforce-worktree` | Blocks file edits in main repo (only allows edits in worktrees) |
| `prevent-orphan-containers` | Blocks worktree removal when Docker containers are running |

## Best Practices

**For Runtime Implementers:**
- Always provide environment variables
- Handle hook failures gracefully
- Log hook execution for debugging
- Respect hook timeouts

**For Hook Authors:**
- Keep hooks fast
- Exit with meaningful codes (0 = success)
- Log to stderr for debugging
- Be idempotent (hooks may run multiple times)

## Troubleshooting

| Issue | Check |
|-------|-------|
| Hook not executing | Matcher pattern, execute permissions, runtime logs |
| Env vars missing | Runtime providing vars, phase-specific availability |
| Status file issues | `.gitignore` entry, setup script generates file, TOML syntax |
