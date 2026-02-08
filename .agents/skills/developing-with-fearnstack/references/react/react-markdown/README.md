---
title: "react-markdown and remark-gfm Reference Index"
description: "Comprehensive reference for rendering markdown in React with GFM support"
type: "meta"
tags: ["index", "react", "markdown", "gfm", "typescript", "unified"]
category: "ts"
subcategory: "react"
version: "1.0"
last_updated: "2025-08-16"
status: "stable"
sources: []
related: ["../react-19.md"]
author: "unknown"
contributors: []
---

# react-markdown and remark-gfm Reference Index

Comprehensive reference documentation for react-markdown v10.1.0 and remark-gfm v4.0.1, libraries for safely rendering markdown content in React applications with GitHub Flavored Markdown support.

## Documentation Files

### [react-markdown Reference](react-markdown-reference.md)
Complete reference for react-markdown v10.1.0, covering installation, API, configuration, security, performance optimization, and TypeScript integration.

### [remark-gfm Reference](remark-gfm-reference.md)
Complete reference for remark-gfm v4.0.1, covering GitHub Flavored Markdown features, configuration options, and integration with the unified ecosystem.

### [Integration Guide](integration-guide.md)
Best practices and patterns for using react-markdown and remark-gfm together, including syntax highlighting, custom components, security hardening, and performance optimization.

## Quick Start

```bash
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

## Key Features

- **Security by Default**: No `dangerouslySetInnerHTML`, prevents XSS attacks
- **GitHub Flavored Markdown**: Tables, task lists, strikethrough, autolinks, footnotes
- **Customizable**: Replace any HTML element with custom React components
- **TypeScript Support**: Full type definitions and type-safe component customization
- **Plugin Ecosystem**: Extensible through unified/remark/rehype plugins
- **Performance**: Optimizable with memoization and virtualization

## External Resources

- [react-markdown GitHub](https://github.com/remarkjs/react-markdown)
- [remark-gfm GitHub](https://github.com/remarkjs/remark-gfm)
- [unified Documentation](https://unifiedjs.com/)
- [remark Plugin Ecosystem](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [rehype Plugin Ecosystem](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md)
