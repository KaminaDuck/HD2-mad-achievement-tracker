---
title: "Zod Reference Index"
description: "TypeScript-first schema validation library documentation"
type: "meta"
tags: ["index", "zod", "typescript", "validation", "schema", "type-safety"]
category: "typescript"
subcategory: "validation"
version: "1.0"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "Zod Documentation"
    url: "https://zod.dev"
  - name: "Zod GitHub"
    url: "https://github.com/colinhacks/zod"
  - name: "Zod v4 Release Notes"
    url: "https://zod.dev/v4"
related: ["zod-v4-reference.md", "versions.md", "basics.md", "api-reference.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# Zod Reference Index

Comprehensive reference documentation for Zod, a TypeScript-first schema validation library with static type inference. Zod enables developers to define schemas and parse data with full TypeScript support, providing runtime validation with compile-time type safety.

## Getting Started

### [Basic Usage](basics.md)
Introduction to Zod covering schema definition, parsing data, error handling, and type inference.

### [API Reference](api-reference.md)
Complete reference for all Zod schema types including primitives, strings, numbers, objects, arrays, unions, and more.

## Core Documentation

### [Zod v4 Library Reference](zod-v4-reference.md)
Comprehensive reference for Zod v4 including:
- Core concepts and architecture
- All schema types and methods
- Refinements and transformations
- Performance improvements over v3
- Migration guidance from v3

### [Version History](versions.md)
Changelog and version history tracking Zod releases including:
- Current v4.x releases with detailed changelogs
- Breaking changes and migration notes
- Previous v3.x major version history
- Version compatibility matrix

## Feature Guides

### [Error Handling](error-handling.md)
Complete guide to error customization and formatting:
- Custom error messages
- Error maps and precedence
- Internationalization (40+ locales)
- Error formatting utilities (`z.treeifyError()`, `z.prettifyError()`, `z.flattenError()`)

### [JSON Schema Conversion](json-schema.md)
Convert Zod schemas to and from JSON Schema:
- `z.toJSONSchema()` for OpenAPI and AI structured outputs
- `z.fromJSONSchema()` (experimental)
- Configuration options for targets, cycles, metadata
- Registry-based multi-schema conversion

### [Codecs](codecs.md)
Bidirectional transformations (v4.1+):
- Encode and decode between formats
- Type-safe network boundary parsing
- Common codec implementations (dates, JSON, base64, etc.)

### [Metadata and Registries](metadata.md)
Associate schemas with metadata:
- Global and custom registries
- `.meta()` and `.describe()` methods
- JSON Schema integration
- Custom registry patterns

### [Zod Mini](zod-mini.md)
Tree-shakable variant for optimized bundles:
- Functional API differences
- Bundle size comparisons
- When to use (and when not to)
- Migration guide

## Key Features

- **TypeScript-First**: Full static type inference via `z.infer<>`
- **Zero Dependencies**: 2kb core bundle (gzipped)
- **Performance**: v4 is 14x faster than v3 for string parsing
- **Tree-Shakable**: Zod Mini variant for optimized bundles
- **JSON Schema**: First-party conversion via `z.toJSONSchema()`
- **Internationalization**: Built-in locale support for 40+ languages
- **Codecs**: Bidirectional transformations for network boundaries

## Quick Start

```bash
# Install Zod v4
npm install zod@^4.0.0
```

```typescript
import * as z from "zod";

// Define a schema
const UserSchema = z.object({
  name: z.string(),
  email: z.email(),
  age: z.number().min(0)
});

// Infer the TypeScript type
type User = z.infer<typeof UserSchema>;

// Parse and validate data
const user = UserSchema.parse({
  name: "Alice",
  email: "alice@example.com",
  age: 30
});
```

## Requirements

- TypeScript v5.5+ (v4 requires strict mode)
- Node.js v18+ or modern browsers

## Project Statistics

- 40.6k+ GitHub stars
- 488 contributors
- 2.7 million dependents
- MIT License

## External Resources

- [Official Documentation](https://zod.dev)
- [GitHub Repository](https://github.com/colinhacks/zod)
- [Zod v4 Release Notes](https://zod.dev/v4)
- [API Reference](https://zod.dev/api)
- [Error Customization](https://zod.dev/error-customization)
- [Metadata & Registries](https://zod.dev/metadata)
- [JSON Schema Conversion](https://zod.dev/json-schema)
- [Migration Guide (v3 to v4)](https://zod.dev/v4/changelog)
