# Dev Container CLI Reference

Reference implementation for building and managing dev containers.

## Installation

```bash
npm install -g @devcontainers/cli
```

Or use without installing:

```bash
npx @devcontainers/cli <command>
```

## Available Commands

| Command | Description |
|---------|-------------|
| `devcontainer up` | Create and run dev container |
| `devcontainer build [path]` | Build a dev container image |
| `devcontainer run-user-commands` | Run lifecycle commands like postCreateCommand |
| `devcontainer read-configuration` | Output current configuration for workspace |
| `devcontainer exec <cmd> [args..]` | Execute command with `userEnvProbe`, `remoteUser`, `remoteEnv` applied |
| `devcontainer features <...>` | Tools for authoring and testing Features |
| `devcontainer templates <...>` | Tools for authoring and testing Templates |

## Core Commands

### devcontainer up

Create and start the dev container.

```bash
devcontainer up --workspace-folder <path>
```

**Options:**

| Option | Description |
|--------|-------------|
| `--workspace-folder` | Path to workspace folder (required) |
| `--config` | Path to devcontainer.json (auto-detect default) |
| `--docker-path` | Path to Docker CLI |
| `--docker-compose-path` | Path to Docker Compose CLI |
| `--id-label` | Label to identify the container |
| `--remote-env` | Additional environment variables |
| `--skip-post-create` | Skip postCreateCommand |
| `--remove-existing-container` | Remove existing container before starting |

```bash
devcontainer up --workspace-folder ./my-project
```

### devcontainer build

Build the dev container image without starting it.

```bash
devcontainer build --workspace-folder <path>
```

**Options:**

| Option | Description |
|--------|-------------|
| `--workspace-folder` | Path to workspace folder (required) |
| `--config` | Path to devcontainer.json |
| `--image-name` | Name for the built image |
| `--no-cache` | Build without using cache |
| `--push` | Push the built image to registry |
| `--platform` | Target platform (e.g., `linux/amd64`) |

```bash
devcontainer build \
  --workspace-folder ./my-project \
  --image-name myregistry/myimage:latest \
  --push
```

### devcontainer exec

Execute a command in the running container with environment configuration applied.

```bash
devcontainer exec --workspace-folder <path> <command> [args...]
```

Commands run with `userEnvProbe`, `remoteUser`, and `remoteEnv` applied, matching VS Code behavior.

```bash
devcontainer exec --workspace-folder ./my-project npm test
```

### devcontainer run-user-commands

Run lifecycle commands without starting a new container session.

```bash
devcontainer run-user-commands --workspace-folder <path>
```

Useful for running `postCreateCommand` in CI/CD.

### devcontainer read-configuration

Output the merged configuration for debugging.

```bash
devcontainer read-configuration --workspace-folder <path>
```

**Options:**

| Option | Description |
|--------|-------------|
| `--workspace-folder` | Path to workspace folder (required) |
| `--config` | Path to devcontainer.json |
| `--include-features-configuration` | Include resolved Features |
| `--merge-configuration` | Merge with image metadata |

```bash
devcontainer read-configuration \
  --workspace-folder ./my-project \
  --include-features-configuration
```

## Features Commands

### devcontainer features test

Test Feature installation.

```bash
devcontainer features test \
  --features <feature-id> \
  --base-image <image>
```

### devcontainer features package

Package a Feature for distribution.

```bash
devcontainer features package \
  --output-folder <path> \
  <feature-folder>
```

## Templates Commands

### devcontainer templates apply

Apply a template to create dev container configuration.

```bash
devcontainer templates apply \
  --workspace-folder <path> \
  --template-id <template>
```

```bash
devcontainer templates apply \
  --workspace-folder ./my-project \
  --template-id ghcr.io/devcontainers/templates/python
```

## Usage Examples

### Basic Workflow

```bash
# Clone a sample repository
git clone https://github.com/microsoft/vscode-remote-try-rust
cd vscode-remote-try-rust

# Start the dev container
devcontainer up --workspace-folder .

# Execute a command in the container
devcontainer exec --workspace-folder . cargo run
```

### CI/CD Integration

```yaml
# GitHub Actions example
name: Build in Dev Container

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install devcontainer CLI
        run: npm install -g @devcontainers/cli

      - name: Start dev container
        run: devcontainer up --workspace-folder .

      - name: Run tests
        run: devcontainer exec --workspace-folder . npm test

      - name: Build
        run: devcontainer exec --workspace-folder . npm run build
```

### Building and Pushing Images

```bash
# Build with custom image name
devcontainer build \
  --workspace-folder . \
  --image-name ghcr.io/myorg/myapp-devcontainer:latest

# Build and push to registry
devcontainer build \
  --workspace-folder . \
  --image-name ghcr.io/myorg/myapp-devcontainer:latest \
  --push
```

### Multi-Platform Build

```bash
devcontainer build \
  --workspace-folder . \
  --image-name myapp:latest \
  --platform linux/amd64,linux/arm64
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DOCKER_HOST` | Docker daemon socket |
| `COMPOSE_FILE` | Override Compose file path |
| `DEVCONTAINER_CONFIG_FILE` | Override devcontainer.json path |

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Container creation failed |

## Debugging

Enable verbose output:

```bash
devcontainer up --workspace-folder . --log-level debug
```

View container logs:

```bash
docker logs <container-id>
```

## CI/CD Platform Integration

### GitHub Actions

```yaml
- uses: devcontainers/ci@v0.3
  with:
    push: always
    imageName: ghcr.io/${{ github.repository }}/devcontainer
    runCmd: npm test
```

### Azure DevOps

```yaml
steps:
  - script: |
      npm install -g @devcontainers/cli
      devcontainer up --workspace-folder $(System.DefaultWorkingDirectory)
      devcontainer exec --workspace-folder $(System.DefaultWorkingDirectory) npm test
    displayName: 'Build and Test in Dev Container'
```

## References

- [Dev Container CLI](https://github.com/devcontainers/cli)
- [Dev Container Specification](https://containers.dev/)
