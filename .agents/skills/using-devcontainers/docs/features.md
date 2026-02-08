# Dev Container Features

Self-contained units of installation code and configuration.

## Overview

Features are shareable units that add tooling, runtimes, or library "features" into your development container. They're tested, maintained, and composable.

## Using Features

```json
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/github-cli:1": {
      "version": "latest"
    },
    "ghcr.io/devcontainers/features/node:1": {
      "version": "18",
      "nodeGypDependencies": true
    }
  }
}
```

The `:latest` version is implicit if omitted. Pin to specific versions with `:2`, `:1.0.0`, etc.

## Feature Referencing Formats

| Type | Description | Example |
|------|-------------|---------|
| OCI Registry | Reference in OCI registry | `ghcr.io/user/repo/go:1` |
| HTTPS URI | Direct tarball URL | `https://github.com/user/repo/releases/devcontainer-feature-go.tgz` |
| Local Path | Relative directory | `./myGoFeature` |

## Shorthand Version Syntax

```json
{
  "features": {
    "ghcr.io/owner/repo/go": "1.18"
  }
}
```

Equivalent to:

```json
{
  "features": {
    "ghcr.io/owner/repo/go": {
      "version": "1.18"
    }
  }
}
```

## Popular Official Features

### Development Tools

| Feature | Reference | Description |
|---------|-----------|-------------|
| Docker-in-Docker | `ghcr.io/devcontainers/features/docker-in-docker` | Run Docker inside container |
| Docker-outside-of-Docker | `ghcr.io/devcontainers/features/docker-outside-of-docker` | Use host Docker socket |
| GitHub CLI | `ghcr.io/devcontainers/features/github-cli` | GitHub CLI (gh) |
| Azure CLI | `ghcr.io/devcontainers/features/azure-cli` | Azure CLI |
| AWS CLI | `ghcr.io/devcontainers/features/aws-cli` | AWS CLI |
| kubectl-helm-minikube | `ghcr.io/devcontainers/features/kubectl-helm-minikube` | Kubernetes tools |
| Common Utils | `ghcr.io/devcontainers/features/common-utils` | zsh, Oh My Zsh, git, etc. |

### Runtimes

| Feature | Reference | Description |
|---------|-----------|-------------|
| Python | `ghcr.io/devcontainers/features/python` | Python runtime |
| Node.js | `ghcr.io/devcontainers/features/node` | Node.js runtime |
| Go | `ghcr.io/devcontainers/features/go` | Go runtime |
| Rust | `ghcr.io/devcontainers/features/rust` | Rust toolchain |

## Feature Install Order

By default, Features install in an optimal order determined by the implementing tool. Control order using:

1. **`dependsOn`** - Required dependencies that must be satisfied before installation
2. **`installsAfter`** - Soft dependencies that influence order only if the Feature is already queued
3. **`overrideFeatureInstallOrder`** - User property in devcontainer.json to override order

```json
{
  "overrideFeatureInstallOrder": [
    "ghcr.io/devcontainers/features/common-utils",
    "ghcr.io/devcontainers/features/python",
    "ghcr.io/devcontainers/features/node"
  ]
}
```

## Feature Options

Options are passed as environment variables to the `install.sh` script. Option IDs are converted to uppercase with special characters replaced by underscores.

### Example Options Definition

```json
{
  "options": {
    "version": {
      "type": "string",
      "enum": ["latest", "3.10", "3.9"],
      "default": "latest",
      "description": "Select a Python version to install."
    },
    "pip": {
      "type": "boolean",
      "default": true,
      "description": "Installs pip"
    }
  }
}
```

### User Configuration

```json
{
  "features": {
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.10",
      "pip": false
    }
  }
}
```

### Emitted Environment Variables

```bash
VERSION="3.10"
PIP="false"
```

## Feature User Environment Variables

Feature scripts run as `root` and receive:

| Variable | Description |
|----------|-------------|
| `_REMOTE_USER` | The configured remoteUser (or containerUser) |
| `_CONTAINER_USER` | The container's user |
| `_REMOTE_USER_HOME` | Home folder of the remote user |
| `_CONTAINER_USER_HOME` | Home folder of the container user |

## Feature Lifecycle Hooks

Features can declare lifecycle hooks that execute **before** user-provided commands:

| Property | Type |
|----------|------|
| `onCreateCommand` | string/array/object |
| `updateContentCommand` | string/array/object |
| `postCreateCommand` | string/array/object |
| `postStartCommand` | string/array/object |
| `postAttachCommand` | string/array/object |

## Base Image Compatibility

Some Features may only work with certain Linux distros. Check Feature documentation for base image requirements.

## Distribution

Features are distributed via:

- **OCI Registries** - GitHub Container Registry (ghcr.io), Docker Hub, Azure Container Registry
- **Direct tarball URL** - Self-hosted feature packages

### OCI Registry Format

```
ghcr.io/<namespace>/<repo>/<feature-name>:<version>
```

Example:
```
ghcr.io/devcontainers/features/docker-in-docker:2
```

## Creating Custom Features

### Minimal Structure

```
my-feature/
├── devcontainer-feature.json
└── install.sh
```

### devcontainer-feature.json

```json
{
  "id": "my-feature",
  "version": "1.0.0",
  "name": "My Custom Feature",
  "description": "Installs my custom tooling",
  "options": {
    "version": {
      "type": "string",
      "default": "latest",
      "description": "Version to install"
    }
  }
}
```

### install.sh

```bash
#!/bin/bash
set -e

VERSION="${VERSION:-latest}"

echo "Installing my-feature version $VERSION..."

apt-get update
apt-get install -y some-package

echo "Done!"
```

## Troubleshooting

### Feature Not Installing

Ensure version is specified:
```json
{
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  }
}
```

### Feature Fails on Specific Base Image

Check the Feature's documentation for supported base images.

### Feature Order Issues

Use `overrideFeatureInstallOrder` to control installation order when dependencies aren't properly declared.

## References

- [Dev Container Features Specification](https://containers.dev/implementors/features/)
- [Features Distribution](https://containers.dev/implementors/features-distribution/)
- [devcontainer.json Reference](https://containers.dev/implementors/json_reference/)
