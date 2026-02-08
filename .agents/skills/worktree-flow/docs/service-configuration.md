# Service Configuration

## Overview

Worktree-flow supports optional container service orchestration with both Docker and Podman. When configured, it provides:
- **Port Allocation** - Unique ports per worktree (no conflicts)
- **Health Checking** - Monitor service availability
- **Orphan Prevention** - Block worktree removal with running containers
- **Runtime Flexibility** - Use Docker or Podman based on preference or availability

All service features are **optional** - if not configured, they're skipped silently.

## Configuration File

Create `.agents/.worktree-services.toml`:

```toml
[docker]
prefix = "myproject"
runtime = "auto"  # "auto", "docker", or "podman"

[ports]
server = 19091
webui = 19071

[[services]]
name = "Server"
port_key = "server"
health_path = "/health"

[[services]]
name = "WebUI"
port_key = "webui"
health_path = "/"
```

## Container Runtime Support

Worktree-flow supports both Docker and Podman as container runtimes.

### Runtime Configuration

Set the runtime in your configuration:

```toml
[docker]
prefix = "myproject"
runtime = "auto"  # "auto", "docker", or "podman"
```

### Runtime Values

| Value | Behavior |
|-------|----------|
| `"auto"` | Auto-detect available runtime (prefers Docker) |
| `"docker"` | Use Docker explicitly |
| `"podman"` | Use Podman explicitly |

### Auto-Detection

When `runtime = "auto"` (default):
1. Docker is checked first
2. Falls back to Podman if Docker is unavailable
3. Checks for compose plugin (v2) before standalone command (v1)

### Supported Compose Variants

| Runtime | Compose Command |
|---------|-----------------|
| Docker (v2) | `docker compose` |
| Docker (v1) | `docker-compose` |
| Podman | `podman-compose` |

**Note:** We only support `podman-compose` (standalone Python tool), not the `podman compose` wrapper. The wrapper delegates to external compose providers which can have compatibility issues.

### Podman Setup

For Podman users:

1. Install Podman and `podman-compose`:
   ```bash
   # Ubuntu/Debian
   sudo apt install podman python3-podman-compose

   # Fedora
   sudo dnf install podman podman-compose

   # pip (any platform)
   pip install podman-compose
   ```

2. Optionally set `runtime = "podman"` in config (auto-detection works too)
3. Commands will automatically use `podman-compose`

**Note:** Podman's rootless mode uses `$XDG_RUNTIME_DIR/podman/podman.sock`.

## Port Allocation

### How It Works

Port allocation uses a hash-based offset system:

1. **Base Ports** - Configured in `[ports]` section
2. **Offset Calculation** - CRC32 hash of worktree name -> offset 10-99
3. **Final Port** - base_port + offset

### Example

For worktree `feature-auth` with base port `19091`:
```
CRC32("feature-auth") % 90 + 10 = 42
Final port = 19091 + 42 = 19133
```

### Generated Files

The setup script generates:
- `.worktree-ports` - Shell export format
- `.worktree-ports.mk` - Makefile format

```bash
# .worktree-ports
export PORT_OFFSET=42
export SERVER_PORT=19133
export WEBUI_PORT=19113
```

```makefile
# .worktree-ports.mk
PORT_OFFSET := 42
SERVER_PORT := 19133
WEBUI_PORT := 19113
```

### Deterministic Allocation

The same worktree name always produces the same offset. This means:
- Ports are reproducible across sessions
- Team members get the same ports for the same worktree name
- No need to remember or configure ports manually

## Health Checking

### Service Definition

Each service needs:
- `name` - Display name
- `port_key` - Port variable name (becomes `{PORT_KEY}_PORT`)
- `health_path` - HTTP path to check

### Health Check Behavior

Health checks use HTTP GET requests:
- Success: Any response (including non-200)
- Failure: Connection refused, timeout, network error

### Status Display

The status command shows health indicators:
```
WORKTREE                            BRANCH                         PHASE
.worktrees/feature-auth             feat/feature-auth              implementing ●
```

The indicator:
- Green circle - All services healthy
- Red circle - One or more services unhealthy

## Container Naming

### Prefix Configuration

Set `docker.prefix` in config:
```toml
[docker]
prefix = "myproject"
```

### Naming Convention

Containers are named: `{prefix}_{worktree-name}_{service}`

Example: `myproject_feature_auth_server`

### Docker Compose Integration

Your `docker-compose.yml` should use the `COMPOSE_PROJECT_NAME` environment variable:

```yaml
# docker-compose.yml
version: '3.8'
services:
  server:
    # ...
```

```bash
# Start with project name
COMPOSE_PROJECT_NAME=myproject_feature_auth docker compose up -d
```

## Orphan Prevention

### How It Works

The `prevent-orphan-containers` hook intercepts `git worktree remove` commands and:
1. Extracts the worktree path
2. Derives the compose project name
3. Checks for running containers
4. Blocks removal if containers exist

### Cleanup Workflow

Before removing a worktree with running services:

```bash
# Option 1: Use the CLI (recommended - runtime-agnostic)
uv run -m worktree_flow.cli transition cleaned

# Option 2: Manual cleanup (Docker)
cd .worktrees/my-feature
docker compose down  # or: podman compose down
cd ..
git worktree remove my-feature

# Option 3: Make target (uses detected runtime)
make worktree-cleanup WT=.worktrees/my-feature
```

### Hook Installation

Add to `.claude/settings.json`:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "",
      "hooks": [
        {
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/skills/worktree-flow/hooks/prevent-orphan-containers/claude.py"
        }
      ]
    }]
  }
}
```

## Makefile Integration

### Available Targets

| Target | Description |
|--------|-------------|
| `make worktree-services-health` | Check service health |
| `make worktree-services-start` | Start Docker services |
| `make worktree-services-stop` | Stop Docker services |

All targets skip silently if no service configuration exists.

## No Configuration = No Problem

When `.agents/.worktree-services.toml` doesn't exist:
- Port allocation is skipped
- Health checks are skipped
- Orphan prevention is skipped
- All worktree-flow phases still work
- Status shows `?:?` for ports

This allows teams to adopt service features gradually.

## Rootless Podman (Secure Sandbox)

Rootless Podman provides enhanced security by running containers without root privileges. This makes it ideal for CI/CD pipelines and development environments where security is a priority.

### Administrator Setup

Before users can run rootless Podman, administrators must configure the system.

#### Install Networking Tools

A user-mode networking tool is required for rootless containers:

```bash
# pasta (recommended, default since Podman 5.0)
# Fedora/RHEL
sudo dnf install passt
# Debian/Ubuntu
sudo apt-get install passt

# slirp4netns (alternative for older systems)
sudo dnf install slirp4netns  # or apt-get
```

| Feature | pasta | slirp4netns |
|---------|-------|-------------|
| IPv6 | Full support | Limited |
| Performance | Better | Good |
| Security | Modern isolation | Traditional |
| Default | Podman 5.0+ | Pre-5.0 |

#### Configure subuid/subgid

Rootless Podman requires UID/GID ranges for user namespace mapping:

```bash
# Check current configuration
cat /etc/subuid
cat /etc/subgid
# Format: USERNAME:START_UID:RANGE
# Example: johndoe:100000:65536

# Add user mapping
sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 johndoe

# Verify
grep johndoe /etc/subuid /etc/subgid
```

**Important**: Each user must have unique, non-overlapping ranges.

After updating subuid/subgid for an existing user:
```bash
podman system migrate
```

### User Setup

1. **Install Podman and podman-compose**:
   ```bash
   # Ubuntu/Debian
   sudo apt install podman
   pip install podman-compose

   # Fedora
   sudo dnf install podman podman-compose

   # Arch
   sudo pacman -S podman
   pip install podman-compose

   # macOS
   brew install podman
   pip install podman-compose
   ```

2. **Verify rootless mode**:
   ```bash
   podman info --format '{{.Host.Security.Rootless}}'
   # Should output: true
   ```

3. **Configure worktree-flow**:
   ```toml
   # .agents/.worktree-services.toml
   [docker]
   prefix = "myproject"
   runtime = "podman"
   ```

### User Configuration Files

Rootless Podman uses configuration files in the user's home directory:

| File | Location |
|------|----------|
| containers.conf | `~/.config/containers/containers.conf` |
| storage.conf | `~/.config/containers/storage.conf` |
| registries.conf | `~/.config/containers/registries.conf` |

Default directories:
- Config: `$XDG_CONFIG_HOME` (defaults to `~/.config`)
- Data: `$XDG_DATA_HOME` (defaults to `~/.local/share`)
- Runtime: `$XDG_RUNTIME_DIR` (defaults to `/run/user/$UID`)

### Port Restrictions

Rootless containers cannot bind to privileged ports (<1024). Worktree-flow uses high ports by default:

```toml
[ports]
server = 19091  # OK - above 1024
webui = 19071   # OK - above 1024
```

If you need to bind to port 80 or 443, you'll need to either:
- Use rootful Podman (not recommended for security)
- Set up port forwarding with iptables/nftables
- Use a reverse proxy on a high port

### Socket Location

Rootless Podman socket: `$XDG_RUNTIME_DIR/podman/podman.sock`

Enable the user socket for API access:
```bash
systemctl --user enable --now podman.socket
echo $XDG_RUNTIME_DIR/podman/podman.sock
```

For tools that expect Docker's socket location:
```bash
export DOCKER_HOST=unix://$XDG_RUNTIME_DIR/podman/podman.sock
```

### Volume Handling

#### UID Mapping in Rootless Mode

In rootless Podman:
- `root` inside the container = your user on the host
- UID 1 in container = first UID in your subuid range

```bash
# Example: file created as root in container
podman run -v ./data:/data alpine touch /data/test
ls -l ./data/test
# Shows ownership as your user, not root
```

#### Using --userns=keep-id

To keep your UID the same inside and outside the container:

```bash
podman run --userns=keep-id -v ./data:/data alpine id
# Shows your actual UID/GID
```

**Important**: If the container has a non-root USER directive, you **must** use `--userns=keep-id` for volume access.

#### SELinux Volume Labels

For rootless Podman with SELinux (RHEL/Fedora), add labels to bind mounts:

```yaml
# docker-compose.yml / compose.yaml
volumes:
  - ./data:/app/data:Z      # Private unshared label
  - ./shared:/app/shared:z  # Shared between containers
```

| Label | Meaning |
|-------|---------|
| `:Z` | Private unshared - only this container can access |
| `:z` | Shared - multiple containers can access |

### Security Benefits

| Feature | Rootful | Rootless |
|---------|---------|----------|
| Root daemon | Required | Not required |
| Privilege escalation risk | Higher | Lower |
| User namespace isolation | Optional | Default |
| Attack surface | Larger | Smaller |
| CI/CD sandboxing | Risky | Safe |

### Troubleshooting Rootless Mode

**"Permission denied" on volumes:**
```bash
# Option 1: Use keep-id
podman run --userns=keep-id -v ./data:/data myimage

# Option 2: Add SELinux label (RHEL/Fedora)
# Edit compose.yaml to add :Z to volumes
```

**subuid/subgid not configured:**
```bash
cat /etc/subuid
cat /etc/subgid
# Your user should have entries like: username:100000:65536
# If missing, ask administrator to run:
# sudo usermod --add-subuids 100000-165535 --add-subgids 100000-165535 $USER
```

**Network issues:**
```bash
# Check networking tool is installed
which pasta || which slirp4netns
```

**"Port already in use" errors:**
```bash
podman ps --all --format "{{.Names}} {{.Ports}}"
```

**Storage corruption:**
```bash
podman system reset
```

**Slow first run:**
The first rootless container start may be slow due to user namespace setup. Subsequent runs are faster.

### Running E2E Tests with Rootless Podman

```bash
# Run Podman-specific tests
cd skills/worktree-flow && uv run pytest tests/e2e/test_podman_runtime.py -v

# Run rootless-specific tests
cd skills/worktree-flow && uv run pytest tests/e2e/test_podman_runtime.py::TestPodmanRootless -v
```

### Further Reading

For comprehensive Podman documentation, see:
- `domains/infra/podman/` - Full Podman reference documentation
- `domains/infra/podman/tutorials/rootless.md` - Detailed rootless tutorial
- `domains/infra/podman/compose/podman-compose.md` - Compose guide
- `domains/infra/podman/comparison/migration-guide.md` - Docker migration
