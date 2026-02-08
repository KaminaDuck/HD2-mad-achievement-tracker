# Dev Container Best Practices

Patterns, recommendations, and troubleshooting guidance.

## Configuration Best Practices

### 1. Use Features Over Custom Installation

Prefer Dev Container Features for common tools - they're tested, maintained, and composable.

```json
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  }
}
```

### 2. Pin Image Versions

Avoid `:latest` tags for reproducibility:

```json
{
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-18-bookworm"
}
```

### 3. Use postCreateCommand for Project Setup

Dockerfile runs before workspace is mounted. Use `postCreateCommand` for project-specific setup:

```json
{
  "postCreateCommand": "npm ci && npm run prepare"
}
```

### 4. Configure Non-Root User

```json
{
  "remoteUser": "vscode",
  "containerUser": "vscode"
}
```

On Linux, set up a non-root user to avoid permission problems with bind mounts.

### 5. Mount Credentials Carefully

```json
{
  "mounts": [
    {
      "source": "${localEnv:HOME}/.ssh",
      "target": "/home/vscode/.ssh",
      "type": "bind"
    }
  ]
}
```

### 6. Use containerEnv Over remoteEnv When Possible

`containerEnv` allows all processes to see the variable and isn't client-specific.

### 7. Extend Rather Than Replace Docker Compose

Use a separate `docker-compose.extend.yml` to add dev-specific settings without modifying production compose files.

### 8. Add Debugging Capabilities for C++/Go/Rust

For ptrace-based debuggers:

```yaml
cap_add:
  - SYS_PTRACE
security_opt:
  - seccomp:unconfined
```

Or in devcontainer.json:

```json
{
  "capAdd": ["SYS_PTRACE"],
  "securityOpt": ["seccomp=unconfined"]
}
```

## Performance Optimization

### Use Named Volumes for Heavy Directories

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

### Leverage Docker Build Cache

Structure Dockerfiles to maximize cache hits:

```dockerfile
# Install dependencies first (changes less often)
COPY package*.json ./
RUN npm ci

# Copy source code last (changes most often)
COPY . .
```

### Use Multi-Stage Builds

```dockerfile
FROM node:18 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-slim AS runtime
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
```

## Troubleshooting

### Container Won't Start

**Check build logs:**
- Use `Dev Containers: Show Container Log` command
- Look for failed `RUN` instructions or missing files

**Common causes:**
- Missing base image
- Failed package installation
- Invalid JSON in devcontainer.json
- Command in `postCreateCommand` that doesn't exit

The command needs to exit or the container won't start.

### Ports Not Accessible

**Verify port forwarding:**
```json
{
  "forwardPorts": [3000],
  "portsAttributes": {
    "3000": {
      "onAutoForward": "notify"
    }
  }
}
```

For Docker Compose, ensure the service exposes ports or uses `network_mode: service:<other-service>`.

### Permission Issues on Linux

**Solution:** Match UID/GID with host:
```json
{
  "remoteUser": "vscode",
  "updateRemoteUserUID": true
}
```

The `updateRemoteUserUID` property defaults to `true` and updates the user's UID/GID to match local user.

### Slow Performance with Bind Mounts

**Solution:** Use named volumes for heavy directories:
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

### Features Not Installing

**Check feature syntax:**
```json
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  }
}
```

Ensure version is specified. Some Features only work with certain Linux distros.

### Extensions Not Loading

**Verify extension IDs:**
```json
{
  "customizations": {
    "vscode": {
      "extensions": ["publisher.extension-name"]
    }
  }
}
```

Use exact IDs from VS Code Marketplace.

### Lifecycle Scripts Failing

If a lifecycle script fails, all subsequent scripts are skipped.

**Debug approach:**
1. Check the container log for the failing command
2. Test the command manually in the container
3. Ensure scripts are executable if using file paths
4. Use `bash -i` for commands requiring interactive shell features

## Common Patterns

### Full-Featured TypeScript Project

```json
{
  "name": "TypeScript Development",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-18-bookworm",

  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/aws-cli:1": {}
  },

  "forwardPorts": [3000, 5432, 6379],
  "portsAttributes": {
    "3000": {
      "label": "Application",
      "onAutoForward": "openBrowser"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "silent"
    },
    "6379": {
      "label": "Redis",
      "onAutoForward": "silent"
    }
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-azuretools.vscode-docker",
        "streetsidesoftware.code-spell-checker"
      ],
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "editor.codeActionsOnSave": {
          "source.fixAll.eslint": "explicit"
        }
      }
    }
  },

  "containerEnv": {
    "NODE_ENV": "development",
    "DATABASE_URL": "postgresql://postgres:postgres@db:5432/app"
  },

  "mounts": [
    {
      "source": "node_modules",
      "target": "${containerWorkspaceFolder}/node_modules",
      "type": "volume"
    }
  ],

  "postCreateCommand": "npm ci && npm run db:migrate",
  "postStartCommand": "npm run dev",

  "remoteUser": "node",
  "updateRemoteUserUID": true
}
```

### Multi-Container with Docker Compose

**devcontainer.json:**

```json
{
  "name": "Full Stack App",
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.extend.yml"],
  "service": "app",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },

  "forwardPorts": [3000, 5432],

  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "ms-azuretools.vscode-docker"
      ]
    }
  },

  "postCreateCommand": "npm ci",
  "remoteUser": "node",
  "shutdownAction": "stopCompose"
}
```

**.devcontainer/docker-compose.extend.yml:**

```yaml
version: '3'
services:
  app:
    volumes:
      - ..:/workspace:cached
    cap_add:
      - SYS_PTRACE
    security_opt:
      - seccomp:unconfined
    command: /bin/sh -c "while sleep 1000; do :; done"
    environment:
      - NODE_ENV=development
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
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python",
        "python.linting.enabled": true
      }
    }
  },

  "postCreateCommand": "pip install -r requirements.txt",
  "remoteUser": "vscode"
}
```

## Security Considerations

### Avoid Privileged Mode When Possible

Only use `privileged: true` when absolutely necessary (e.g., Docker-in-Docker).

### Don't Store Secrets in Configuration

Use environment variables or mounted secrets:

```json
{
  "containerEnv": {
    "API_KEY": "${localEnv:API_KEY}"
  }
}
```

### Review Third-Party Features

Before using community Features, review their source code and maintainer reputation.

### Use Specific Image Tags

Pin to specific versions rather than `latest` to avoid unexpected changes.

## References

- [VS Code - Create a Dev Container](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
- [devcontainer.json Reference](https://containers.dev/implementors/json_reference/)
- [Dev Container Features Specification](https://containers.dev/implementors/features/)
