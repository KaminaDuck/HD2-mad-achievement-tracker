---
title: "react-markdown Version Log"
description: "Version history and changelog for react-markdown and remark-gfm libraries"
type: "meta"
tags: ["changelog", "versions", "react-markdown", "remark-gfm", "react", "markdown"]
category: "meta"
subcategory: "none"
version: "1.0"
last_updated: "2025-12-24"
status: "stable"
sources:
  - name: "react-markdown GitHub"
    url: "https://github.com/remarkjs/react-markdown"
  - name: "remark-gfm GitHub"
    url: "https://github.com/remarkjs/remark-gfm"
  - name: "react-markdown npm"
    url: "https://www.npmjs.com/package/react-markdown"
related: []
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "10.1.0"
---

# react-markdown Version Log

**Current version documented:** react-markdown 10.1.0 / remark-gfm 4.0.1
**Last checked:** 2025-12-24

[react-markdown GitHub](https://github.com/remarkjs/react-markdown) | [remark-gfm GitHub](https://github.com/remarkjs/remark-gfm)

---

## About react-markdown

react-markdown is a React component for safely rendering markdown content. It uses the unified ecosystem (remark/rehype) for parsing and transformation, preventing XSS attacks by avoiding dangerouslySetInnerHTML. remark-gfm adds GitHub Flavored Markdown support.

---

## react-markdown Versions

### Current Major: v10.x

#### v10.1.0 (2025-03-07)
Latest stable release.
- Feature improvements and bug fixes

[Release Notes](https://github.com/remarkjs/react-markdown/releases/tag/10.1.0)

#### v10.0.0 (2024) **BREAKING**
Major release with unified ecosystem updates.
- Updated unified ecosystem dependencies
- TypeScript improvements
- ESM-only package

[Changelog](https://github.com/remarkjs/react-markdown/blob/main/changelog.md)

### Previous Major: v9.x

#### v9.0.0 (2023) **BREAKING**
Major release.
- React 18 optimizations
- Improved TypeScript types

### Previous Major: v8.x

#### v8.0.0 (2022) **BREAKING**
Major release with ESM migration.
- ESM-only package
- Node.js 14+ required

---

## remark-gfm Versions

### Current Major: v4.x

#### v4.0.1 (2024)
Latest stable release with bug fixes.

#### v4.0.0 (2023) **BREAKING**
Major release.
- Updated micromark dependencies
- Improved GFM parsing

### Previous Major: v3.x

#### v3.0.0 (2022)
ESM-only release.

---

## Key Features by Version

| Package | Version | Key Features |
|---------|---------|--------------|
| react-markdown | 10.x | Latest unified ecosystem, ESM |
| react-markdown | 9.x | React 18 optimizations |
| remark-gfm | 4.x | Updated micromark, better parsing |
| remark-gfm | 3.x | ESM-only |

---

## GFM Features (remark-gfm)

- **Tables**: Full Markdown table support
- **Task Lists**: Checkbox items `- [ ]` and `- [x]`
- **Strikethrough**: `~~deleted text~~`
- **Autolinks**: URL and email auto-linking
- **Footnotes**: Reference-style footnotes

---

## Installation

```bash
# Install both packages
npm install react-markdown remark-gfm
```

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function App() {
  return (
    <Markdown remarkPlugins={[remarkGfm]}>
      {'# Hello\n\n~~strikethrough~~ **bold** *italic*'}
    </Markdown>
  )
}
```

---

## Version Log Guidelines

1. **Current major**: Include all minor/patch versions with brief summaries
2. **Previous majors**: Include milestone releases
3. **Breaking changes**: Mark with `**BREAKING**`
4. **Dates**: Use ISO format (YYYY-MM-DD)
5. **Links**: Always link to official release notes
6. **Updates**: Check for new versions when updating the parent reference
