"""Lifecycle hook scripts for worktree-flow.

Each hook is a standalone Python script that can be executed by the CLI
during phase transitions. Hooks are optional - if a script doesn't exist,
the transition proceeds without it.
"""
