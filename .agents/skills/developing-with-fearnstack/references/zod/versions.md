---
title: "Zod Version Log"
description: "Version history and changelog for Zod"
type: "meta"
tags: ["changelog", "versions", "zod", "typescript", "validation"]
category: "typescript"
subcategory: "validation"
version: "1.0"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/colinhacks/zod/releases"
  - name: "Zod v4 Release Notes"
    url: "https://zod.dev/v4"
  - name: "Zod v4 Migration Guide"
    url: "https://zod.dev/v4/changelog"
related: ["README.md", "zod-v4-reference.md"]
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "4.2.1"
---

# Zod Version Log

**Current version documented:** 4.2.1
**Last checked:** 2025-12-24

[Official Release Notes](https://github.com/colinhacks/zod/releases)

---

## Current Major: v4.x

### v4.2.1 (2024-12-16)
Minor release with bug fixes and refinements.
- **Fixed:** Various bug fixes and stability improvements

[Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.2.1)

### v4.2.0 (2024-12-15)
Major feature release introducing Standard JSON Schema support.
- **New:** `z.fromJSONSchema()` for converting JSON schemas to Zod validators
- **New:** `z.xor()` for exclusive-or validation between schemas
- **New:** `z.looseRecord()` allowing additional properties beyond defined ones
- **New:** Standard JSON Schema support

[Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.2.0)

### v4.1.13 (2024-11-24)
Performance and validation enhancements.
- **New:** MAC address validation support
- **Fixed:** Regex error reporting to reflect specified regex correctly
- **Fixed:** Dual package hazard for `globalRegistry`
- **New:** Localization improvements (Hebrew, Dutch)
- **Performance:** Faster initialization

[Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.1.13)

### v4.1.12 (2024-10-06)
Error handling improvements.
- **Fixed:** Enhanced error handling in `flatten()` method
- **Fixed:** Crash prevention on 'toString' key
- **Fixed:** Unified code structure and improved type safety

[Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.1.12)

### v4.1.0 (2024-08-23)
Major feature release introducing codecs.
- **New:** Codecs for bi-directional transformations (`z.codec()`)
- **New:** `.safeExtend()` method for safer object extension
- **New:** `z.hash()` and `z.hex()` validators
- **Docs:** Codec documentation improvements

[Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.1.0)

### v4.0.14 (2024-07-30)
JSON Schema improvements.
- **New:** JSON Schema draft-04 support
- **Fixed:** Tuple inference improvements

[Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.0.14)

### v4.0.0 (2024-07-10) **BREAKING**
Major rewrite with significant performance improvements and new features.

**Performance:**
- 14.71x faster string parsing vs v3
- 7.43x faster array parsing vs v3
- 6.5x faster object parsing vs v3
- 100x reduction in TypeScript instantiations

**Bundle Size:**
- Core reduced from 12.47kb to 5.36kb (57% smaller)
- Zod Mini variant: 1.88kb (85% smaller than v3)

**New Features:**
- Native recursive object definitions without type casting
- File schema validation (`z.file()`)
- Template literal types (`z.templateLiteral()`)
- First-party JSON Schema conversion (`z.toJSONSchema()`)
- Metadata registry system for strongly-typed schema metadata
- International error messages via locale system
- Error pretty-printing (`z.prettifyError()`)
- Fixed-width number types (int32, uint32, float32, float64)
- Enhanced discriminated unions with composition support
- Tree-shakable Zod Mini variant (`zod/mini`)
- Ecosystem foundation via `zod/v4/core` sub-package

**Breaking Changes:**
- Error customization: unified `error` parameter replaces `message`
- `z.number()` rejects `POSITIVE_INFINITY` and `NEGATIVE_INFINITY`
- String format methods moved to top-level: `z.email()`, `z.uuid()`, etc.
- `z.record()` requires two arguments
- `z.nativeEnum()` deprecated; use `z.enum()` instead
- `.merge()` deprecated in favor of `.extend()`
- `.deepPartial()` removed entirely
- `ZodEffects` class dropped; `ZodTransform` added
- `._def` property moved to `._zod.def`
- TypeScript v5.5+ required

[Release Notes](https://zod.dev/v4) | [Migration Guide](https://zod.dev/v4/changelog)

---

## Previous Major Versions

### v3.24.x (Latest v3)
Final v3.x release series before v4 migration.
- Maintenance releases and bug fixes
- Feature freeze in preparation for v4

[v3 Releases](https://github.com/colinhacks/zod/releases?q=v3.24&expanded=true)

### v3.0.0 (2021-05)
Initial TypeScript-first stable release.
- TypeScript-first schema validation
- Static type inference via `z.infer<>`
- Zero dependencies
- Comprehensive primitive and complex type support
- Refinements and transformations
- Established Zod as the leading TypeScript validation library

[Release Notes](https://github.com/colinhacks/zod/releases/tag/v3.0.0)

---

## Version Compatibility

| Zod Version | TypeScript | Node.js |
|-------------|------------|---------|
| v4.x | v5.5+ | v18+ |
| v3.x | v4.5+ | v14+ |

---

## Upgrade Resources

- [v3 to v4 Migration Guide](https://zod.dev/v4/changelog)
- [v4 Versioning Strategy](https://zod.dev/v4/versioning)
- [API Reference](https://zod.dev/api)
