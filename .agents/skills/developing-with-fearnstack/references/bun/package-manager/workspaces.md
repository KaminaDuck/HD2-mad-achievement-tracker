---
title: "Bun Workspaces"
description: "Develop complex monorepos with multiple independent packages"
type: "concept-guide"
tags: ["bun", "workspaces", "monorepo", "package-manager", "npm"]
category: "typescript"
subcategory: "package-manager"
version: "1.0"
last_updated: "2025-12-26"
status: "stable"
sources:
  - name: "Bun Workspaces Documentation"
    url: "https://bun.sh/docs/pm/workspaces"
related:
  - "../README.md"
  - "./install.md"
  - "./lockfile.md"
author: "unknown"
contributors: []
---

# Bun Workspaces

Bun supports workspaces in `package.json` for developing complex monorepos consisting of several independent packages. ([Bun Docs][1])

## Monorepo Structure

Typical monorepo structure:

```
<root>
├── README.md
├── bun.lock
├── package.json
├── tsconfig.json
└── packages
    ├── pkg-a
    │   ├── index.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── pkg-b
    │   ├── index.ts
    │   ├── package.json
    │   └── tsconfig.json
    └── pkg-c
        ├── index.ts
        ├── package.json
        └── tsconfig.json
```

## Configuration

### Root package.json

```json
{
  "name": "my-project",
  "version": "1.0.0",
  "workspaces": ["packages/*"],
  "devDependencies": {
    "example-package-in-monorepo": "workspace:*"
  }
}
```

### Glob Support

Full glob syntax is supported, including negative patterns:

```json
{
  "name": "my-project",
  "workspaces": [
    "packages/**",
    "!packages/**/test/**",
    "!packages/**/template/**"
  ]
}
```

## Workspace Protocol

Reference other packages in the monorepo using `workspace:` protocol:

```json
{
  "name": "pkg-a",
  "version": "1.0.0",
  "dependencies": {
    "pkg-b": "workspace:*"
  }
}
```

### Version Specifiers

| Specifier | Published As |
|-----------|--------------|
| `workspace:*` | `1.0.1` |
| `workspace:^` | `^1.0.1` |
| `workspace:~` | `~1.0.1` |
| `workspace:1.0.2` | `1.0.2` (overrides package version) |

## Installing Specific Workspaces

Use `--filter` to install dependencies for specific workspaces:

```bash
# Install for workspaces starting with `pkg-` except `pkg-c`
bun install --filter "pkg-*" --filter "!pkg-c"

# Using paths
bun install --filter "./packages/pkg-*" --filter "!pkg-c"
```

## Benefits

1. **Code splitting**: Split code into logical parts. Local packages are installed from your `packages/` directory instead of npm registry.

2. **Dependency deduplication**: Shared dependencies are hoisted to root `node_modules`, reducing disk usage and "dependency hell" issues.

3. **Multi-package scripts**: Use `--filter` or `--workspaces` to run scripts across packages:
   ```bash
   bun run --filter "*" test
   bun run --workspaces build
   ```

## Catalogs

Share dependency versions across workspaces using catalogs:

```json
{
  "workspaces": {
    "packages": ["packages/*"],
    "catalog": {
      "react": "^18.0.0",
      "typescript": "^5.0.0"
    }
  }
}
```

Reference in workspace package.json:

```json
{
  "dependencies": {
    "react": "catalog:"
  }
}
```

Updating the catalog automatically updates all referencing packages.

## Performance

Bun installs the Remix monorepo in about **500ms** on Linux:

| Package Manager | Speed Comparison |
|-----------------|------------------|
| npm | 28x slower |
| yarn v1 | 12x slower |
| pnpm | 8x slower |

---

[1]: https://bun.sh/docs/pm/workspaces "Bun Workspaces Documentation"
