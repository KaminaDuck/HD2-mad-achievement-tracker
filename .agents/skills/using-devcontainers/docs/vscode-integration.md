# VS Code Dev Containers Integration

Visual Studio Code Dev Containers extension reference.

## Extension Installation

Install the **Dev Containers** extension (`ms-vscode-remote.remote-containers`) from the VS Code Marketplace.

## Key Commands

| Command | Description |
|---------|-------------|
| `Dev Containers: Reopen in Container` | Open folder in container |
| `Dev Containers: Rebuild Container` | Rebuild current container |
| `Dev Containers: Rebuild and Reopen in Container` | Full rebuild and reopen |
| `Dev Containers: Add Dev Container Configuration Files...` | Generate config from template |
| `Dev Containers: Open Folder in Container` | Open specific folder |
| `Dev Containers: Clone Repository in Container Volume` | Clone into container volume |
| `Dev Containers: Show Container Log` | View build/start logs |

## VS Code Customizations

### Extensions

```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-azuretools.vscode-docker",
        "streetsidesoftware.code-spell-checker"
      ]
    }
  }
}
```

Use exact extension IDs from the VS Code Marketplace.

### Settings

```json
{
  "customizations": {
    "vscode": {
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit"
        },
        "typescript.tsdk": "node_modules/typescript/lib"
      }
    }
  }
}
```

### Complete Example

```json
{
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-python.python",
        "ms-python.vscode-pylance"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.linting.enabled": true,
        "python.linting.pylintEnabled": true
      }
    }
  }
}
```

## Edit Loop

Typical workflow for container configuration:

1. Start with **Dev Containers: Add Dev Container Configuration Files...**
2. Edit the contents of the `.devcontainer` folder as required
3. Try it with **Dev Containers: Reopen in Container**
4. If you see an error, select **Open Folder Locally**
5. After the window reloads, check the build log to investigate
6. Run **Dev Containers: Rebuild and Reopen in Container**

## Repository Badge

Add to README for one-click dev container setup:

```markdown
[![Open in Dev Containers](https://img.shields.io/static/v1?label=Dev%20Containers&message=Open&color=blue)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/your/repo)
```

## Repository Configuration Folders

For repositories you don't control, configure **Dev > Containers: Repository Configuration Paths** setting with a local folder to store repository container configuration files.

Place `.devcontainer/devcontainer.json` in a sub folder mirroring the remote location:

```
📁 github.com
    📁 devcontainers
        📁 templates
           📁 .devcontainer
```

## Port Forwarding

VS Code automatically forwards ports when processes listen on them inside the container.

### Automatic Forwarding

```json
{
  "forwardPorts": [3000, 5432],
  "portsAttributes": {
    "3000": {
      "label": "Application",
      "onAutoForward": "openBrowser"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "silent"
    }
  }
}
```

### Port Forwarding Actions

| Action | Description |
|--------|-------------|
| `notify` | Show notification (default) |
| `openBrowser` | Open in external browser |
| `openBrowserOnce` | Open browser only first time |
| `openPreview` | Open in VS Code preview |
| `silent` | Forward silently |
| `ignore` | Don't forward |

## Debugging

### Launch Configuration

Create `.vscode/launch.json` inside the container:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Node.js",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.js"
    }
  ]
}
```

### Debug Server Inside Container

For languages requiring ptrace (C++, Go, Rust), add capabilities:

```json
{
  "capAdd": ["SYS_PTRACE"],
  "securityOpt": ["seccomp=unconfined"]
}
```

## Tasks

Define tasks in `.vscode/tasks.json`:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "build",
      "type": "shell",
      "command": "npm run build",
      "group": {
        "kind": "build",
        "isDefault": true
      }
    }
  ]
}
```

## Terminal Configuration

### Default Shell

```json
{
  "customizations": {
    "vscode": {
      "settings": {
        "terminal.integrated.defaultProfile.linux": "zsh"
      }
    }
  }
}
```

### Shell Integration

Use Features to install shells with proper configuration:

```json
{
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": true,
      "configureZshAsDefaultShell": true,
      "installOhMyZsh": true
    }
  }
}
```

## Working with Multiple Containers

### Docker Compose Integration

VS Code connects to a single service but can start multiple:

```json
{
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.extend.yml"],
  "service": "app",
  "runServices": ["app", "db", "redis"],
  "workspaceFolder": "/workspace"
}
```

### Connecting to Running Containers

Use **Dev Containers: Attach to Running Container...** to connect to any running container.

## Performance Optimization

### Named Volumes for Dependencies

```json
{
  "mounts": [
    {
      "source": "node_modules",
      "target": "${containerWorkspaceFolder}/node_modules",
      "type": "volume"
    }
  ]
}
```

### Clone in Container Volume

For better I/O performance, use **Dev Containers: Clone Repository in Container Volume...** which stores source code in a Docker volume rather than bind mounting.

## Troubleshooting

### View Logs

- **Dev Containers: Show Container Log** - Build and startup logs
- Check Output panel > Dev Containers

### Common Issues

| Issue | Solution |
|-------|----------|
| Extensions not loading | Verify extension IDs are correct |
| Slow file operations | Use named volumes for node_modules |
| Port not accessible | Check forwardPorts configuration |
| Permission denied | Configure remoteUser and updateRemoteUserUID |

### Rebuild Options

- **Rebuild Container** - Rebuilds but keeps volumes
- **Rebuild Without Cache** - Full rebuild, useful when base image updated

## References

- [VS Code - Create a Dev Container](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
- [devcontainer.json Reference](https://containers.dev/implementors/json_reference/)
