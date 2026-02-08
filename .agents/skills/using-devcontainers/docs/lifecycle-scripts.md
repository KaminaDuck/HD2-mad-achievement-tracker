# Lifecycle Scripts

Execution order and scripting for container lifecycle events.

## Execution Order

```
initializeCommand     (on host, before container)
    ↓
onCreateCommand       (in container, first creation only)
    ↓
updateContentCommand  (in container, when content changes)
    ↓
postCreateCommand     (in container, after assigned to user)
    ↓
postStartCommand      (in container, every start)
    ↓
postAttachCommand     (in container, every attach)
```

## Script Properties

| Property | Type | Description |
|----------|------|-------------|
| `initializeCommand` | string/array/object | Run on **host machine** during initialization. May run more than once |
| `onCreateCommand` 🏷️ | string/array/object | First finalization command. Runs after container first starts. Used by cloud services for caching |
| `updateContentCommand` 🏷️ | string/array/object | Second finalization. Runs when content changes. Cloud services periodically refresh |
| `postCreateCommand` 🏷️ | string/array/object | Last finalization. Runs after assigned to user. Used for user-specific secrets |
| `postStartCommand` 🏷️ | string/array/object | Run each time container starts successfully |
| `postAttachCommand` 🏷️ | string/array/object | Run each time tool attaches to container |
| `waitFor` 🏷️ | enum | Which command tools should wait for. Defaults to `updateContentCommand` |

## Command Formats

### String Format (Runs in Shell)

```json
{
  "postCreateCommand": "npm install && npm run build"
}
```

### Array Format (Direct Execution)

```json
{
  "postCreateCommand": ["npm", "install"]
}
```

No shell processing - runs command directly.

### Object Format (Parallel Execution)

```json
{
  "postCreateCommand": {
    "install": "npm install",
    "build": ["npm", "run", "build"],
    "db": "docker compose up -d db"
  }
}
```

Commands execute in parallel. Each key is a label.

## When to Use Which Command

| Command | Use Case |
|---------|----------|
| `initializeCommand` | Pre-flight checks on host, clone submodules |
| `onCreateCommand` | Install dependencies, compile native extensions |
| `updateContentCommand` | Refresh dependencies when code changes |
| `postCreateCommand` | User-specific setup, configure tools |
| `postStartCommand` | Start background services, restore state |
| `postAttachCommand` | Configure terminal, display welcome message |

## Error Handling

If a lifecycle script fails, **all subsequent scripts are skipped**. For example, if `postCreateCommand` fails, `postStartCommand` will not run.

## Practical Examples

### Using NVM (Requires Interactive Shell)

```json
{
  "postCreateCommand": "bash -i -c 'nvm install --lts'"
}
```

Tools like NVM require `-i` for interactive mode.

### Running a Script from Source Tree

```json
{
  "postCreateCommand": "bash scripts/install-dependencies.sh"
}
```

### Interactive Bash for .bashrc

```json
{
  "postCreateCommand": "bash -i scripts/install-dependencies.sh"
}
```

Picks up your .bashrc for custom environment.

### Project Setup Pattern

```json
{
  "onCreateCommand": "pip install -r requirements.txt",
  "postCreateCommand": "python manage.py migrate",
  "postStartCommand": "python manage.py runserver 0.0.0.0:8000"
}
```

### Database Setup with Parallel Execution

```json
{
  "postCreateCommand": {
    "install": "npm ci",
    "migrate": "npm run db:migrate",
    "seed": "npm run db:seed"
  }
}
```

## Dockerfile vs postCreateCommand

**Use Dockerfile for:**
- System packages
- Global tools
- Base configuration

**Use postCreateCommand for:**
- Project dependencies (`npm install`, `pip install`)
- Workspace-dependent setup
- Database migrations

A Dockerfile benefits from Docker's build cache and faster rebuilds, but runs **before** the workspace is mounted and cannot access workspace files.

## Container Startup Behavior

**The command must exit** or the container won't finish starting.

**Wrong:** Command blocks container startup
```json
{
  "postCreateCommand": "npm run dev"
}
```

**Correct:** Use postStartCommand for long-running processes
```json
{
  "postStartCommand": "npm run dev &"
}
```

Or better, use a process manager or VS Code's task system.

## Feature Lifecycle Hooks

Features can declare their own lifecycle hooks. Feature commands **always execute before** user-provided commands in devcontainer.json.

| Property | Type |
|----------|------|
| `onCreateCommand` | string/array/object |
| `updateContentCommand` | string/array/object |
| `postCreateCommand` | string/array/object |
| `postStartCommand` | string/array/object |
| `postAttachCommand` | string/array/object |

## Debugging Lifecycle Scripts

1. **Check the container log** for the failing command
2. **Test the command manually** in the container
3. **Ensure scripts are executable** if using file paths
4. **Use `bash -i`** for commands requiring interactive shell features

## References

- [devcontainer.json Reference](https://containers.dev/implementors/json_reference/)
- [VS Code - Create a Dev Container](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
- [Dev Container Features Specification](https://containers.dev/implementors/features/)
