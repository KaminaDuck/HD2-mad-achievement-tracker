# devcontainer.json Reference

Complete property reference for dev container configuration.

## Configuration Approaches

### Image-Based

```json
{
  "image": "mcr.microsoft.com/devcontainers/typescript-node:0-18"
}
```

**When to use:** Quick setup with standard environments, no custom dependencies needed.

### Dockerfile-Based

```json
{
  "build": {
    "dockerfile": "Dockerfile",
    "context": ".."
  }
}
```

**When to use:** Custom dependencies, build-time configuration required.

### Docker Compose-Based

```json
{
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.extend.yml"],
  "service": "app",
  "workspaceFolder": "/workspace"
}
```

**When to use:** Multi-container setups with databases or services.

## General Properties

Properties marked with 🏷️ can be stored in the `devcontainer.metadata` container image label.

### Core Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Display name for the dev container in UI |
| `forwardPorts` 🏷️ | array | Ports always forwarded from container to local machine. Defaults to `[]` |
| `portsAttributes` 🏷️ | object | Maps port number/range/regex to default options |
| `otherPortsAttributes` 🏷️ | object | Default options for unconfigured ports |
| `features` | object | Dev Container Feature IDs and options to add |
| `overrideFeatureInstallOrder` | array | Override Feature install order |
| `customizations` 🏷️ | object | Product-specific properties |

### Environment Variables

| Property | Type | Description |
|----------|------|-------------|
| `containerEnv` 🏷️ | object | Environment variables for the container. Recommended over `remoteEnv` as all processes see the variable |
| `remoteEnv` 🏷️ | object | Environment variables for devcontainer.json supporting service only. Use when value isn't static |

```json
{
  "containerEnv": {
    "MY_VARIABLE": "${localEnv:MY_VARIABLE}"
  },
  "remoteEnv": {
    "PATH": "${containerEnv:PATH}:/custom/path"
  }
}
```

### User Configuration

| Property | Type | Description |
|----------|------|-------------|
| `remoteUser` 🏷️ | string | User for devcontainer.json supporting services. Defaults to container user |
| `containerUser` 🏷️ | string | User for all operations inside container. Defaults to `root` or Dockerfile `USER` |
| `updateRemoteUserUID` 🏷️ | boolean | On Linux, update user UID/GID to match local user. Defaults to `true` |
| `userEnvProbe` 🏷️ | enum | Shell type to probe for env vars: `none`, `interactiveShell`, `loginShell`, `loginInteractiveShell` (default) |

### Container Behavior

| Property | Type | Description |
|----------|------|-------------|
| `overrideCommand` 🏷️ | boolean | Run sleep loop instead of default command. Defaults to `true` for image/Dockerfile, `false` for Compose |
| `shutdownAction` 🏷️ | enum | Action on close: `none`, `stopContainer` (default for image), `stopCompose` (default for Compose) |
| `init` 🏷️ | boolean | Use tini init process for zombie processes. Defaults to `false` |
| `privileged` 🏷️ | boolean | Run in privileged mode. Required for Docker-in-Docker. Defaults to `false` |
| `capAdd` 🏷️ | array | Add capabilities. Most common: `["SYS_PTRACE"]` for C++/Go/Rust debugging |
| `securityOpt` 🏷️ | array | Security options like `["seccomp=unconfined"]` |

### Mounts

```json
{
  "mounts": [
    {
      "source": "dind-var-lib-docker",
      "target": "/var/lib/docker",
      "type": "volume"
    },
    {
      "source": "${localWorkspaceFolder}/.cache",
      "target": "/home/vscode/.cache",
      "type": "bind"
    }
  ]
}
```

## Image/Dockerfile Properties

| Property | Type | Description |
|----------|------|-------------|
| `image` | string | **Required** when using image. Container registry image name |
| `build.dockerfile` | string | **Required** when using Dockerfile. Location relative to devcontainer.json |
| `build.context` | string | Docker build context. Defaults to `"."` |
| `build.args` | object | Docker build arguments |
| `build.options` | array | Docker build options |
| `build.target` | string | Multi-stage build target |
| `build.cacheFrom` | string/array | Images to use as build cache |
| `workspaceMount` | string | Override default workspace mount. Requires `workspaceFolder` |
| `workspaceFolder` | string | Default path to open when connecting |
| `runArgs` | array | Docker CLI arguments for running container |

```json
{
  "build": {
    "dockerfile": "Dockerfile",
    "context": "..",
    "args": {
      "VARIANT": "3.10",
      "NODE_VERSION": "18"
    },
    "target": "development",
    "cacheFrom": "myregistry.azurecr.io/myimage:cache"
  }
}
```

## Docker Compose Properties

| Property | Type | Description |
|----------|------|-------------|
| `dockerComposeFile` | string/array | **Required**. Path(s) to Docker Compose files. Order matters for overrides |
| `service` | string | **Required**. Service to connect to once running |
| `runServices` | array | Services to start. Defaults to all |
| `workspaceFolder` | string | Default path to open. Defaults to `"/"` |

### Extending Docker Compose

**.devcontainer/docker-compose.extend.yml:**

```yaml
version: '3'
services:
  app:
    volumes:
      - .:/workspace:cached
    cap_add:
      - SYS_PTRACE
    security_opt:
      - seccomp:unconfined
    command: /bin/sh -c "while sleep 1000; do :; done"
```

**devcontainer.json:**

```json
{
  "dockerComposeFile": ["../docker-compose.yml", "docker-compose.extend.yml"],
  "service": "app",
  "workspaceFolder": "/workspace"
}
```

## Variables

Variables use `${variableName}` format in string values.

| Variable | Properties | Description |
|----------|------------|-------------|
| `${localEnv:VAR}` | Any | Host machine environment variable. Default: `${localEnv:VAR:default}` |
| `${containerEnv:VAR}` | `remoteEnv` | Container environment variable once running |
| `${localWorkspaceFolder}` | Any | Path of opened folder on host |
| `${containerWorkspaceFolder}` | Any | Path where workspace files are in container |
| `${localWorkspaceFolderBasename}` | Any | Name of opened folder on host |
| `${containerWorkspaceFolderBasename}` | Any | Name of workspace folder in container |
| `${devcontainerId}` | Any | Unique, stable identifier for the dev container |

## Host Requirements

Cloud services use these to select compute options.

| Property | Type | Description |
|----------|------|-------------|
| `hostRequirements.cpus` 🏷️ | integer | Minimum CPUs/cores |
| `hostRequirements.memory` 🏷️ | string | Minimum memory with `tb`/`gb`/`mb`/`kb` suffix |
| `hostRequirements.storage` 🏷️ | string | Minimum storage with suffix |
| `hostRequirements.gpu` 🏷️ | boolean/string/object | GPU requirements. `"optional"` for when available |

```json
{
  "hostRequirements": {
    "cpus": 4,
    "memory": "8gb",
    "storage": "32gb",
    "gpu": {
      "cores": 1000,
      "memory": "8gb"
    }
  }
}
```

## Port Attributes

| Property | Type | Description |
|----------|------|-------------|
| `label` 🏷️ | string | Display name in ports view |
| `protocol` 🏷️ | enum | `https` ignores SSL certificates and uses correct forwarded URL certificate |
| `onAutoForward` 🏷️ | enum | `notify` (default), `openBrowser`, `openBrowserOnce`, `openPreview`, `silent`, `ignore` |
| `requireLocalPort` 🏷️ | boolean | Must map to same local port. Defaults to `false` |
| `elevateIfNeeded` 🏷️ | boolean | Auto-elevate for low ports (22, 80, 443). Defaults to `false` |

```json
{
  "forwardPorts": [3000, "db:5432"],
  "portsAttributes": {
    "3000": {
      "label": "Application",
      "onAutoForward": "openBrowser"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "silent"
    }
  },
  "otherPortsAttributes": {
    "onAutoForward": "silent"
  }
}
```

## VS Code Customizations

```json
{
  "customizations": {
    "vscode": {
      "settings": {
        "editor.formatOnSave": true,
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "typescript.tsdk": "node_modules/typescript/lib"
      },
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "ms-python.python"
      ]
    }
  }
}
```

## Complete Example

```json
{
  "name": "Node.js Development",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:18",
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },
  "forwardPorts": [3000, 5432],
  "portsAttributes": {
    "3000": {
      "label": "Application",
      "onAutoForward": "notify"
    }
  },
  "containerEnv": {
    "NODE_ENV": "development"
  },
  "customizations": {
    "vscode": {
      "settings": {
        "editor.formatOnSave": true
      },
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  },
  "postCreateCommand": "npm install",
  "remoteUser": "node"
}
```

## References

- [devcontainer.json Reference](https://containers.dev/implementors/json_reference/)
- [VS Code - Create a Dev Container](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
