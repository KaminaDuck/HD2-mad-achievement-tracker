---
title: "JSON Viewer Version Log"
description: "Version history and changelog for @textea/json-viewer React component"
type: "meta"
tags: ["changelog", "versions", "json-viewer", "react", "typescript"]
category: "meta"
subcategory: "none"
version: "1.0"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "json-viewer GitHub"
    url: "https://github.com/TexteaInc/json-viewer"
  - name: "json-viewer npm"
    url: "https://www.npmjs.com/package/@textea/json-viewer"
related: []
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "4.0.1"
---

# JSON Viewer Version Log

**Current version documented:** 4.0.1
**Last checked:** 2025-12-24

[GitHub Repository](https://github.com/TexteaInc/json-viewer) | [npm Package](https://www.npmjs.com/package/@textea/json-viewer)

---

## About JSON Viewer

@textea/json-viewer is a React component library for displaying and inspecting JSON and structured data. It provides TypeScript-first development, Material-UI integration, theming support, custom data type definitions, and interactive editing features.

---

## Current Major: v4.x

### v4.0.1 (2025-02)
Latest stable release.
- Bug fixes and improvements

[npm Package](https://www.npmjs.com/package/@textea/json-viewer)

### v4.0.0 (2024) **BREAKING**
Major release with new features.
- TypeScript-first API
- Enhanced Material-UI integration
- Improved theming and customization
- Custom data type definitions
- Interactive editing features

[Release Notes](https://github.com/TexteaInc/json-viewer/releases)

---

## Previous Major: v3.x

### v3.0.0 (2023) **BREAKING**
Major release.
- **Breaking:** Material-UI dependencies no longer included by default
- Must install @mui/material, @emotion/react, @emotion/styled separately
- Improved tree-shaking support

[CHANGELOG](https://github.com/TexteaInc/json-viewer/blob/main/CHANGELOG.md)

---

## Previous Major: v2.x

### v2.14.x (2023)
Final v2.x releases.
- Feature improvements and bug fixes

### v2.0.0 (2022)
Initial v2 release with major improvements.

---

## Key Features by Version

| Version | Key Features |
|---------|--------------|
| 4.x | TypeScript-first, enhanced MUI integration |
| 3.x | Externalized MUI dependencies, tree-shaking |
| 2.x | Core functionality, theming |

---

## Installation

```bash
# Install json-viewer with peer dependencies
npm install @textea/json-viewer @mui/material @emotion/react @emotion/styled
```

```jsx
import { JsonViewer } from '@textea/json-viewer'

const Component = () => (
  <JsonViewer
    value={{ key: "value" }}
    theme="auto"
  />
)
```

---

## Version Log Guidelines

1. **Current major**: Include all minor/patch versions with brief summaries
2. **Previous majors**: Include milestone releases
3. **Breaking changes**: Mark with `**BREAKING**`
4. **Dates**: Use ISO format (YYYY-MM-DD)
5. **Links**: Always link to official release notes
6. **Updates**: Check for new versions when updating the parent reference
