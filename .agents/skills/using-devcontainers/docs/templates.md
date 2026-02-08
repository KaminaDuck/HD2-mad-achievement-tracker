# Dev Container Templates

Source files packaged for creating new dev containers.

## Using Templates

In VS Code, use **Dev Containers: Add Dev Container Configuration Files...** to select from available templates.

## Popular Official Templates

### Language Templates

| Template | Reference | Use Case |
|----------|-----------|----------|
| Node.js & TypeScript | `ghcr.io/devcontainers/templates/typescript-node` | TypeScript/Node.js projects |
| Python | `ghcr.io/devcontainers/templates/python` | Python projects |
| Go | `ghcr.io/devcontainers/templates/go` | Go projects |
| Rust | `ghcr.io/devcontainers/templates/rust` | Rust projects |
| Java | `ghcr.io/devcontainers/templates/java` | Java projects |
| C# (.NET) | `ghcr.io/devcontainers/templates/dotnet` | .NET projects |
| PHP | `ghcr.io/devcontainers/templates/php` | PHP projects |
| Ruby | `ghcr.io/devcontainers/templates/ruby` | Ruby projects |

### Infrastructure Templates

| Template | Reference | Use Case |
|----------|-----------|----------|
| Docker-in-Docker | `ghcr.io/devcontainers/templates/docker-in-docker` | Docker development |
| Kubernetes | `ghcr.io/devcontainers/templates/kubernetes-helm` | Kubernetes development |
| Universal | `ghcr.io/devcontainers/templates/universal` | Multi-language projects |

### Reuse Existing Configuration

| Template | Reference | Use Case |
|----------|-----------|----------|
| Existing Docker Compose | `ghcr.io/devcontainers/templates/docker-existing-docker-compose` | Reuse existing docker-compose.yml |
| Existing Dockerfile | `ghcr.io/devcontainers/templates/docker-existing-dockerfile` | Reuse existing Dockerfile |

### Database Templates

| Template | Reference | Stack |
|----------|-----------|-------|
| Node.js & MongoDB | `ghcr.io/devcontainers/templates/javascript-node-mongo` | Node + MongoDB |
| Node.js & PostgreSQL | `ghcr.io/devcontainers/templates/javascript-node-postgres` | Node + Postgres |
| Python & PostgreSQL | `ghcr.io/devcontainers/templates/postgres` | Python + Postgres |
| Go & PostgreSQL | `ghcr.io/devcontainers/templates/go-postgres` | Go + Postgres |
| Rust & PostgreSQL | `ghcr.io/devcontainers/templates/rust-postgres` | Rust + Postgres |

## Template Structure

```
template/
├── devcontainer-template.json    # Template metadata
├── .devcontainer/
│   ├── devcontainer.json         # Dev container config
│   ├── Dockerfile                # Optional
│   └── docker-compose.yml        # Optional
└── README.md                     # Optional documentation
```

## Template Metadata

The `devcontainer-template.json` file defines template properties:

```json
{
  "id": "typescript-node",
  "version": "1.0.0",
  "name": "Node.js & TypeScript",
  "description": "Develop Node.js based applications with TypeScript",
  "options": {
    "imageVariant": {
      "type": "string",
      "enum": ["20", "18", "16"],
      "default": "20",
      "description": "Node.js version"
    }
  }
}
```

## Template Options

Templates can define options that customize the generated configuration:

```json
{
  "options": {
    "version": {
      "type": "string",
      "enum": ["latest", "3.11", "3.10", "3.9"],
      "default": "latest",
      "description": "Python version"
    },
    "installTools": {
      "type": "boolean",
      "default": true,
      "description": "Install common dev tools"
    }
  }
}
```

## Using Templates via CLI

```bash
# Add dev container configuration using a template
devcontainer templates apply \
  --workspace-folder . \
  --template-id ghcr.io/devcontainers/templates/python

# With options
devcontainer templates apply \
  --workspace-folder . \
  --template-id ghcr.io/devcontainers/templates/python \
  --template-args '{"version": "3.11"}'
```

## Customizing After Template Application

After applying a template, customize by:

1. **Adding Features** - Extend functionality with additional Features
2. **Modifying devcontainer.json** - Adjust properties for your needs
3. **Editing Dockerfile** - Add custom dependencies
4. **Updating docker-compose.yml** - Add services for multi-container setups

## Template Best Practices

### 1. Start with the Closest Template

Choose the template that matches your primary language or framework, then customize.

### 2. Use Templates with Database Support

For projects requiring databases, use the combined templates (e.g., `node-postgres`) instead of adding database configuration manually.

### 3. Consider Universal for Polyglot Projects

The `universal` template provides a comprehensive multi-language environment for projects using multiple languages.

### 4. Leverage Existing Configuration Templates

If you have an existing Dockerfile or docker-compose.yml, use the `docker-existing-*` templates to build on top of them.

## Creating Custom Templates

### Basic Template Structure

```
my-template/
├── devcontainer-template.json
├── .devcontainer/
│   └── devcontainer.json
└── README.md
```

### devcontainer-template.json

```json
{
  "id": "my-custom-template",
  "version": "1.0.0",
  "name": "My Custom Template",
  "description": "A custom dev container template",
  "documentationURL": "https://example.com/docs",
  "options": {
    "variant": {
      "type": "string",
      "enum": ["full", "minimal"],
      "default": "full",
      "description": "Configuration variant"
    }
  }
}
```

### Variable Substitution in Templates

Templates support variable substitution using `${templateOption:optionId}`:

```json
{
  "image": "mcr.microsoft.com/devcontainers/python:${templateOption:version}"
}
```

## Registry

The official template registry is at [containers.dev/templates](https://containers.dev/templates). Templates are distributed via OCI registries like GitHub Container Registry (ghcr.io).

## References

- [Dev Container Templates](https://containers.dev/templates)
- [VS Code - Create a Dev Container](https://code.visualstudio.com/docs/devcontainers/create-dev-container)
