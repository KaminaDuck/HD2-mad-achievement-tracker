---
title: "TanStack Router Version Log"
description: "Version history and changelog for TanStack Router"
type: "meta"
tags: ["changelog", "versions", "tanstack", "router"]
category: "typescript"
subcategory: "routing"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/TanStack/router/releases"
related: []
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "1.143.3"
---

# TanStack Router Version Log

**Current version documented:** 1.143.3
**Last checked:** 2025-12-23

[Official Release Notes](https://github.com/TanStack/router/releases)

---

## Current Major: v1.x

### v1.143.3 (2025-12-23)
Fix for rewrite causing infinite redirects.
- Fixed issue #6201: rewrite causes infinite redirects

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.143.3)

### v1.143.2 (2025-12-23)
React Router HMR fix.
- Fixed React Router HMR not updating inline arrow function components (#6197)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.143.2)

### v1.143.1 (2025-12-23)
Compiler type export handling.
- Fixed compiler handles type-only exports (#6199)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.143.1)

### v1.143.0 (2025-12-23)
Server build optimization.
- Feature: Remove ClientOnly children from server build (#6193)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.143.0)

### v1.142.13 (2025-12-23)
Serial head execution and compiler improvements.
- Fix: Serial head execution (#6093)
- Performance: Compiler improvements (#6190)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.142.13)

### v1.142.12 (2025-12-22)
Factory compilation fix.
- Fix: Compile factories (#6188)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.142.12)

### v1.142.11 (2025-12-22)
API cleanup.
- Refactor: Deprecate `json` function in favor of standard `Response.json` (#6181)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.142.11)

### v1.142.10 (2025-12-22)
Route prefix handling.
- Fix: Ignore route pieces in RoutePrefixMap (#6186)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.142.10)

### v1.142.8 (2025-12-21)
Streaming fixes.
- Fix: Streaming issues (#6175)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.142.8)

### v1.142.7 (2025-12-21)
Performance optimization.
- Refactor: Index nodes optimization in router-core (#6173)

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.142.7)

### v1.0.0 (2024-07-17) **BREAKING**
Initial stable release.
- First stable v1.0 release after extensive beta period
- Complete TypeScript support
- File-based routing
- Advanced data loading with SWR caching
- URL-based state management

[Release Notes](https://github.com/TanStack/router/releases/tag/v1.0.0) | [Migration Guide](https://tanstack.com/router/latest/docs/framework/react/migrate-from-v0)

---

## Previous Major Versions

### v0.x (Beta)
Pre-release beta versions with significant API changes between releases.
- Initial public development
- API stabilization phase
- Community feedback integration

[v0.x Releases](https://github.com/TanStack/router/releases?q=v0&expanded=true)
