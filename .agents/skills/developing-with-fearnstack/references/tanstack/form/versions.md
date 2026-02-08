---
title: "TanStack Form Version Log"
description: "Version history and changelog for TanStack Form"
type: "meta"
tags: ["changelog", "versions", "tanstack", "form", "validation"]
category: "typescript"
subcategory: "forms"
version: "1.0"
last_updated: "2025-12-23"
status: "stable"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/TanStack/form/releases"
  - name: "TanStack Form v1 Announcement"
    url: "https://tanstack.com/blog/announcing-tanstack-form-v1"
related: []
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "1.27.6"
---

# TanStack Form Version Log

**Current version documented:** 1.27.6
**Last checked:** 2025-12-23

[Official Release Notes](https://github.com/TanStack/form/releases)

---

## Current Major: v1.x

### v1.27.6 (2025-12-22)
Validation runtime error fix.
- Fixed: Prevent runtime errors during validation (#1948)

[Release Notes](https://github.com/TanStack/form/releases/tag/v1.27.6)

### v1.27.4 (2025-12-15)
Array field re-render fix.
- Fixed: Array fields with `mode="array"` incorrectly re-rendering when any element property mutated
- Regression from v1.27.0 React Compiler compatibility changes
- Now correctly only re-renders when array length changes (items added/removed)

[Release Notes](https://github.com/TanStack/form/releases/tag/v1.27.4)

### v1.27.0 (2025-12-01)
React Compiler compatibility.
- Fixed: React Compiler compatibility issues (#1893)
- Fixed: React 17 support - replaced `useId` with `uuid` for compatibility (#1850)
- Performance improvements for TanStack Start integration (#1882)

[Release Notes](https://github.com/TanStack/form/releases/tag/v1.27.0)

### v1.23.0 (2025-09-19)
DevTools release.
- **New:** `@tanstack/form-devtools@0.1.0` - Visual debugging tools
- **New:** Framework-specific devtools packages for React, Vue, Solid
- SSR improvements and dependency updates (#1747)

[Release Notes](https://github.com/TanStack/form/releases/tag/v1.23.0)

### v1.15.0 (2025-07-26)
Field grouping API.
- **New:** `withFieldGroup` utility for React Form (#1469)
- Enables logical grouping of related form fields

[Release Notes](https://github.com/TanStack/form/releases/tag/v1.15.0)

### v1.1.0 (2025-03-16)
Field reset utility.
- **New:** Form reset field utility function (#1223)
- Programmatic field reset capability for complex form workflows
- Documentation: Composition API tutorial added
- Documentation: Dark mode graph readability improvements

[Release Notes](https://github.com/TanStack/form/releases/tag/v1.1.0)

### v1.0.0 (2025-03-03) **BREAKING**
Initial stable release.

**Framework Support:**
- React, Vue, Angular, Solid, Lit (Svelte 5 planned)

**Core Features:**
- Signals-based state management via TanStack Store (fine-grained reactivity, minimal re-renders)
- Standard Schema validation support (Zod, Valibot, ArkType) - no adapter packages needed
- Async validation with debouncing and AbortSignal cancellation
- Field-level and form-level validation (mixable)
- Full TypeScript inference without explicit generics

**Platform Support:**
- React Native, NativeScript, Next.js, TanStack Start
- SSR with server-side validation using same logic as frontend

[Release Notes](https://github.com/TanStack/form/releases/tag/v1.0.0) | [Announcement](https://tanstack.com/blog/announcing-tanstack-form-v1)

---

## Previous Major Versions

### v0.x (Beta) **BREAKING**
Pre-release development phase with significant API changes leading to v1.0.

Key milestones during beta:
- v0.43: Validator API overhaul (stricter types, non-string errors)
- v0.40: Native Standard Schema support (no adapters needed)
- v0.39: Removed `form.useStore` and `form.useField` for React Compiler compliance
- v0.38: Dropped TypeScript <5.1 and Angular <19 support

[v0.x Releases](https://github.com/TanStack/form/releases?q=v0) | [Breaking Changes Tracking](https://github.com/TanStack/form/issues/1044)

---

## Architecture Notes

TanStack Form uses signals-based state management (TanStack Store) to prevent unnecessary re-renders, especially critical for large forms with complex validation. The library follows Standard Schema specification for validation, decoupling it from specific validators.
