---
name: using-devcontainers
description: Configure reproducible, containerized development environments using the Dev Container specification
---

# Using Dev Containers

Configure reproducible, containerized development environments using the Dev Container specification.

**Announce at start:** "I'm using the using-devcontainers skill to help configure your development container."

## Quick Reference

| Topic | Documentation | Use Case |
|-------|---------------|----------|
| Configuration | [devcontainer-json.md](docs/devcontainer-json.md) | Define container properties |
| Lifecycle | [lifecycle-scripts.md](docs/lifecycle-scripts.md) | Run commands at container events |
| Features | [features.md](docs/features.md) | Add tools via composable units |
| CLI | [cli.md](docs/cli.md) | Automate container management |
| VS Code | [vscode-integration.md](docs/vscode-integration.md) | IDE integration |
| Templates | [templates.md](docs/templates.md) | Start from pre-built configs |
| Patterns | [best-practices.md](docs/best-practices.md) | Troubleshooting and optimization |

## Overview

A dev container is defined by a `devcontainer.json` file that describes how to enrich a container for development. The specification supports three configuration approaches:

| Approach | Use Case | Complexity |
|----------|----------|------------|
| **Image** | Standard environments, quick setup | Low |
| **Dockerfile** | Custom dependencies, build-time configuration | Medium |
| **Docker Compose** | Multi-container setups, databases, services | High |

### File Location

```
project/
├── .devcontainer/
│   ├── devcontainer.json     # Primary configuration
│   ├── Dockerfile            # Optional custom Dockerfile
│   └── docker-compose.yml    # Optional for multi-container
└── src/
```

Or as `.devcontainer.json` (dot-prefix) in the project root.

## Minimal Examples

### Image-Based (Simplest)

```json
{
  "name": "Node.js Development",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18"
}
```

### Dockerfile-Based

```json
{
  "name": "Custom Node.js",
  "build": {
    "dockerfile": "Dockerfile",
    "context": ".."
  },
  "forwardPorts": [3000]
}
```

### Docker Compose-Based

```json
{
  "name": "Full Stack",
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.extend.yml"],
  "service": "app",
  "workspaceFolder": "/workspace"
}
```

## Essential Properties

| Property | Purpose | Example |
|----------|---------|---------|
| `name` | Display name in UI | `"Node.js Dev"` |
| `image` | Base container image | `"mcr.microsoft.com/devcontainers/typescript-node:18"` |
| `features` | Add tools (Docker, GitHub CLI, etc.) | See [features.md](docs/features.md) |
| `forwardPorts` | Expose container ports | `[3000, 5432]` |
| `postCreateCommand` | Run after container creation | `"npm install"` |
| `customizations.vscode` | VS Code extensions/settings | See [vscode-integration.md](docs/vscode-integration.md) |

## Common Patterns

### TypeScript/Node.js Project

```json
{
  "name": "TypeScript Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-18-bookworm",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm ci",
  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ],
      "settings": {
        "editor.formatOnSave": true
      }
    }
  },
  "remoteUser": "node"
}
```

### Python Data Science

```json
{
  "name": "Python Data Science",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",
  "features": {
    "ghcr.io/devcontainers/features/common-utils:2": {
      "installZsh": true,
      "configureZshAsDefaultShell": true
    }
  },
  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance",
        "ms-toolsai.jupyter"
      ]
    }
  },
  "postCreateCommand": "pip install -r requirements.txt",
  "remoteUser": "vscode"
}
```

### Multi-Container with Database

```json
{
  "name": "App + PostgreSQL",
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.extend.yml"],
  "service": "app",
  "workspaceFolder": "/workspace",
  "forwardPorts": [3000, 5432],
  "postCreateCommand": "npm ci && npm run db:migrate",
  "shutdownAction": "stopCompose"
}
```

## Lifecycle Command Order

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

See [lifecycle-scripts.md](docs/lifecycle-scripts.md) for detailed guidance.

## CLI Quick Start

```bash
# Install CLI
npm install -g @devcontainers/cli

# Start container
devcontainer up --workspace-folder .

# Execute command in container
devcontainer exec --workspace-folder . npm test

# Build image
devcontainer build --workspace-folder . --image-name myapp:latest
```

See [cli.md](docs/cli.md) for complete reference.

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Container won't start | Check `postCreateCommand` exits (don't run servers there) |
| Slow file operations | Use named volumes for `node_modules` |
| Permission denied on Linux | Set `remoteUser` and `updateRemoteUserUID: true` |
| Features not installing | Ensure version specified (`:2`, `:latest`) |
| Ports not accessible | Add to `forwardPorts` array |

See [best-practices.md](docs/best-practices.md) for comprehensive troubleshooting.

## Supporting Tools

- **VS Code** - Dev Containers extension
- **GitHub Codespaces** - Cloud-hosted dev containers
- **JetBrains IDEs** - Via plugin support
- **DevPod** - Open-source dev container management
- **Dev Container CLI** - Reference implementation for automation

## External Resources

- [Dev Container Specification](https://containers.dev/)
- [devcontainer.json Reference](https://containers.dev/implementors/json_reference/)
- [Features Registry](https://containers.dev/features)
- [Templates Registry](https://containers.dev/templates)
- [VS Code Dev Containers Documentation](https://code.visualstudio.com/docs/devcontainers/containers)
