---
title: "react-markdown v10.1.0 Reference"
description: "Complete reference for safely rendering markdown in React applications"
type: "framework-guide"
tags: ["react", "markdown", "typescript", "security", "xss", "unified", "remark", "rehype"]
category: "ts"
subcategory: "react"
version: "10.1.0"
last_updated: "2025-08-16"
status: "stable"
sources:
  - name: "react-markdown GitHub"
    url: "https://github.com/remarkjs/react-markdown"
  - name: "react-markdown Changelog"
    url: "https://github.com/remarkjs/react-markdown/blob/main/changelog.md"
  - name: "unified Documentation"
    url: "https://unifiedjs.com/"
related: ["remark-gfm-reference.md", "integration-guide.md", "../react-19.md"]
author: "unknown"
contributors: []
---

# react-markdown v10.1.0 Reference

react-markdown is a React component library that safely renders markdown content by building a virtual DOM from a syntax tree rather than using `dangerouslySetInnerHTML`. ([react-markdown GitHub][1])

## Overview

### Core Purpose

react-markdown provides:
- Parse markdown into an abstract syntax tree (AST)
- Transform content through plugins
- Convert to React elements
- Prevent XSS attacks by default
- Enable granular control over rendered output

The library is **safe by default** with no `dangerouslySetInnerHTML` or XSS vulnerabilities. ([react-markdown README][1])

### Architecture

react-markdown integrates three key components of the unified ecosystem:
- **remark**: Parses markdown into an AST
- **rehype**: Transforms AST into HTML representation
- **React integration**: Converts the final AST to React elements

This modular design enables plugins at each transformation stage, providing flexibility and composability. ([unified Documentation][3])

## Installation

### Requirements

- **Node.js**: 16+
- **React**: 18+
- **Module System**: ESM only (no CommonJS)

([react-markdown README][1])

### Installation Commands

```bash
npm install react-markdown
```

```bash
yarn add react-markdown
```

```bash
pnpm add react-markdown
```

### Alternative Installations

**Deno:**
```javascript
import Markdown from 'https://esm.sh/react-markdown@10'
```

**Browser (CDN):**
```javascript
import Markdown from 'https://esm.sh/react-markdown@10?bundle'
```

([react-markdown README][1])

## Version Information

### Version 10.1.0 Release

**Release Date**: 2025-03-07

**New Features**:
- Added `fallback` prop to `MarkdownHooks` component
- Fixed race condition in `MarkdownHooks`

([react-markdown Changelog][2])

### Breaking Changes in v10.0.0

Released: 2025-02-20

#### 1. Removed `className` Prop

**Before (v9):**
```jsx
<Markdown className="prose">{content}</Markdown>
```

**After (v10):**
```jsx
<div className="prose">
  <Markdown>{content}</Markdown>
</div>
```

Users must wrap `<Markdown>` in their own element to add classes. This gives developers explicit control over wrapper elements. ([react-markdown Changelog][2])

#### 2. Better Error Handling

The library now throws errors for removed or invalid props with improved error messages. ([react-markdown Changelog][2])

### Migration from v9

Version 9 introduced several breaking changes that remain in v10:

#### Replaced URL Transformation Props

**Old (v8):**
```jsx
<Markdown
  transformImageUri={(uri) => `/images/${uri}`}
  transformLinkUri={(uri) => sanitize(uri)}
>
```

**New (v9+):**
```jsx
<Markdown
  urlTransform={(url, key) => {
    if (key === 'src') return `/images/${url}`
    return sanitize(url)
  }}
>
```

#### Removed `linkTarget` Option

**Old (v8):**
```jsx
<Markdown linkTarget="_blank">{content}</Markdown>
```

**New (v9+):**
```jsx
<Markdown
  components={{
    a: ({href, children}) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }}
>
```

#### Removed Custom Props Support

The following props were removed:
- `includeElementIndex`
- `rawSourcePos`
- `sourcePos`

Extra props are no longer passed to components. ([react-markdown Changelog][2])

#### No UMD Bundle

UMD builds are no longer provided. Migrate to ESM or use a CDN like esm.sh. ([react-markdown README][1])

## API Reference

### Component Variants

#### Markdown (Default Export)

Synchronous rendering for standard use cases.

```jsx
import Markdown from 'react-markdown'

<Markdown>{content}</Markdown>
```

#### MarkdownAsync

Server-side rendering with async plugin support.

```jsx
import {MarkdownAsync} from 'react-markdown'

<MarkdownAsync>{content}</MarkdownAsync>
```

#### MarkdownHooks

Client-side async support using React hooks. Supports `fallback` prop for loading states (v10.1.0+).

```jsx
import {MarkdownHooks} from 'react-markdown'

<MarkdownHooks fallback={<div>Loading...</div>}>
  {content}
</MarkdownHooks>
```

([react-markdown README][1])

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | string | - | Markdown content to render |
| `components` | object | HTML tags | Custom component mappings |
| `remarkPlugins` | array | `[]` | Markdown transformation plugins |
| `rehypePlugins` | array | `[]` | HTML transformation plugins |
| `allowedElements` | array | all | Whitelist specific HTML tags |
| `disallowedElements` | array | `[]` | Blacklist specific HTML tags |
| `unwrapDisallowed` | boolean | false | Extract children of blocked elements |
| `skipHtml` | boolean | false | Ignore HTML in markdown |
| `urlTransform` | function | defaultUrlTransform | Transform/validate URLs |
| `allowElement` | function | - | Custom element filter function |

([react-markdown README][1])

### Basic Usage

```jsx
import Markdown from 'react-markdown'

export default function App() {
  return <Markdown>{'# Hello\n\nWorld'}</Markdown>
}
```

### With Plugins

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

<Markdown
  remarkPlugins={[remarkGfm, remarkMath]}
  rehypePlugins={[rehypeKatex]}
>
  {content}
</Markdown>
```

### Custom Components

```jsx
<Markdown
  components={{
    h1: ({node, ...props}) => <h1 className="heading-xl" {...props} />,
    h2: ({node, ...props}) => <h2 className="heading-lg" {...props} />,
    code: ({node, inline, className, children, ...props}) => {
      const match = /language-(\w+)/.exec(className || '')
      return inline ? (
        <code className="inline-code" {...props}>{children}</code>
      ) : (
        <CodeBlock language={match?.[1]} {...props}>
          {children}
        </CodeBlock>
      )
    },
    a: ({href, children}) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }}
>
  {markdown}
</Markdown>
```

([react-markdown README][1])

### URL Transformation

#### Default Behavior

The default `urlTransform` function:
- **Allows**: `http`, `https`, `irc`, `ircs`, `mailto`, `xmpp`
- **Blocks**: `javascript:`, `data:`, `vbscript:`, `file:`
- **Preserves**: Relative URLs

([react-markdown README][1])

#### Custom URL Transformation

```jsx
<Markdown
  urlTransform={(url) => {
    // Only allow HTTPS and relative URLs
    if (url.startsWith('https://') || url.startsWith('/')) {
      return url
    }
    return null // Block all other URLs
  }}
>
  {markdown}
</Markdown>
```

### Element Filtering

#### Whitelist Approach

```jsx
<Markdown allowedElements={['p', 'br', 'strong', 'em', 'ul', 'ol', 'li']}>
  {userContent}
</Markdown>
```

#### Blacklist Approach

```jsx
<Markdown disallowedElements={['img', 'video', 'iframe']}>
  {content}
</Markdown>
```

#### Unwrap Disallowed Elements

```jsx
<Markdown
  disallowedElements={['strong']}
  unwrapDisallowed={true}
>
  {'**bold text**'}  {/* Renders as: bold text (without <strong>) */}
</Markdown>
```

([react-markdown README][1])

## TypeScript Support

### Exported Types

```typescript
import type {
  AllowElement,
  Components,
  ExtraProps,
  HooksOptions,
  Options,
  UrlTransform
} from 'react-markdown'
```

### Type-Safe Components

**Approach 1: Using Components Type**

```typescript
import Markdown, { Components } from 'react-markdown'

const customComponents: Components = {
  h1: ({children, node}) => <h1 className="custom">{children}</h1>,
  a: ({href, children}) => (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  )
}

export default function App() {
  return <Markdown components={customComponents}>{md}</Markdown>
}
```

**Approach 2: Using JSX.IntrinsicElements with ExtraProps**

```typescript
import Markdown, { ExtraProps } from 'react-markdown'

<Markdown
  components={{
    code: (props: JSX.IntrinsicElements['code'] & ExtraProps) => {
      const {children, className, node, ...rest} = props
      return <code className={className} {...rest}>{children}</code>
    }
  }}
>
  {content}
</Markdown>
```

**Approach 3: Importing from Sub-path**

```typescript
import { Components } from 'react-markdown/lib/ast-to-react'

const CodeComponent: Components['code'] = ({ className, children, ...props }) => {
  const match = /language-(\w+)/.exec(className || '')
  return <code data-lang={match?.[1]} {...props}>{children}</code>
}
```

### Component Props

All custom components receive:
- Standard HTML props for the element (e.g., `href` for `a`, `src` for `img`)
- `node`: Optional Element from hast AST
- Additional custom props if configured

([Stack Overflow - TypeScript with react-markdown][4])

## Security

### Built-in Protection

#### 1. No dangerouslySetInnerHTML

react-markdown never uses `dangerouslySetInnerHTML`. React manages all DOM updates, preventing XSS attacks. ([Security Articles][5])

#### 2. HTML Escaping

HTML tags in markdown are escaped by default and rendered as plain text:

```jsx
<Markdown>
  {'<script>alert("XSS")</script>'}
</Markdown>
// Renders: <script>alert("XSS")</script> (as text, not executed)
```

#### 3. URL Validation

The `defaultUrlTransform` blocks dangerous protocols like `javascript:` and `data:`.

### Security Best Practices

#### 1. Use skipHtml for Untrusted Content

```jsx
<Markdown skipHtml={true}>
  {untrustedUserContent}
</Markdown>
```

This ignores all HTML in the markdown, rendering only pure markdown features. ([Security Articles][5])

#### 2. Strict URL Validation

```jsx
<Markdown
  urlTransform={(url) => {
    try {
      const parsed = new URL(url, window.location.href)
      // Only allow HTTPS URLs from approved domains
      if (parsed.protocol === 'https:' &&
          approvedDomains.includes(parsed.hostname)) {
        return url
      }
    } catch {}
    return null
  }}
>
  {content}
</Markdown>
```

#### 3. Element Whitelisting

```jsx
const SAFE_ELEMENTS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre'
]

<Markdown allowedElements={SAFE_ELEMENTS}>
  {userContent}
</Markdown>
```

#### 4. External Link Safety

```jsx
<Markdown
  components={{
    a: ({href, children}) => {
      const isExternal = href?.startsWith('http')
      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
        >
          {children}
        </a>
      )
    }
  }}
>
  {content}
</Markdown>
```

Or use the `remark-external-links` plugin:

```jsx
import remarkExternalLinks from 'remark-external-links'

<Markdown remarkPlugins={[[remarkExternalLinks, {target: '_blank', rel: ['noopener', 'noreferrer']}]]}>
  {content}
</Markdown>
```

([Security Articles][5])

#### 5. Content Security Policy

Implement CSP headers for defense in depth:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; object-src 'none';"
>
```

#### 6. Server-Side Validation

Always validate and sanitize markdown content on the server before storing it. Client-side security is a secondary defense layer.

### Important Security Note

**Markdown doesn't provide security benefits by default.** Always treat user-generated content as untrusted and implement multiple layers of defense. ([Security Articles][5])

## Performance Optimization

### Performance Challenges

react-markdown must parse the entire markdown content into an AST before rendering. For large documents, this process can be computationally expensive. ([Performance Articles][6])

### Optimization Strategies

#### 1. Memoization

**Basic Memoization:**

```jsx
import React from 'react'
import Markdown from 'react-markdown'

const MemoizedMarkdown = React.memo(Markdown)

function MyComponent({ content }) {
  return <MemoizedMarkdown>{content}</MemoizedMarkdown>
}
```

**Advanced Memoization with Custom Comparison:**

```jsx
const MemoizedMarkdown = React.memo(
  Markdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children
)
```

([Performance Articles][6])

#### 2. Virtualization

For large documents, render only visible content:

```jsx
import { FixedSizeList } from 'react-window'
import Markdown from 'react-markdown'

function VirtualizedMarkdown({ content }) {
  const lines = content.split('\n')

  return (
    <FixedSizeList
      height={600}
      itemCount={lines.length}
      itemSize={35}
    >
      {({ index, style }) => (
        <div style={style}>
          <Markdown>{lines[index]}</Markdown>
        </div>
      )}
    </FixedSizeList>
  )
}
```

**Important**: Virtualization works best with content that can be split into independent chunks. ([Performance Articles][6])

#### 3. Chunking

Break large documents into smaller, independently rendered chunks:

```jsx
function ChunkedMarkdown({ content, chunkSize = 1000 }) {
  const chunks = []
  for (let i = 0; i < content.length; i += chunkSize) {
    chunks.push(content.slice(i, i + chunkSize))
  }

  return (
    <>
      {chunks.map((chunk, i) => (
        <Markdown key={i}>{chunk}</Markdown>
      ))}
    </>
  )
}
```

#### 4. Lazy Loading

Render visible portion initially, load additional content on scroll:

```jsx
import { useState, useEffect, useRef } from 'react'
import Markdown from 'react-markdown'

function LazyMarkdown({ content }) {
  const [visibleContent, setVisibleContent] = useState(content.slice(0, 2000))
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleContent.length < content.length) {
          setVisibleContent(content.slice(0, visibleContent.length + 2000))
        }
      },
      { threshold: 1.0 }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [visibleContent, content])

  return (
    <div>
      <Markdown>{visibleContent}</Markdown>
      <div ref={containerRef} />
    </div>
  )
}
```

([Performance Articles][6])

#### 5. Plugin Optimization

Load only necessary plugins. Each plugin adds parsing overhead:

```jsx
// Heavy - many plugins
<Markdown
  remarkPlugins={[remarkGfm, remarkMath, remarkToc, remarkEmoji]}
  rehypePlugins={[rehypeHighlight, rehypeKatex, rehypeSlug]}
>

// Optimized - only what you need
<Markdown remarkPlugins={[remarkGfm]}>
```

#### 6. Streaming Content Optimization

For AI chat interfaces or streaming content, use memoization to avoid redundant parsing:

```jsx
import { useMemo } from 'react'
import Markdown from 'react-markdown'

function StreamingMarkdown({ content }) {
  const memoizedContent = useMemo(() => content, [content])
  return <Markdown>{memoizedContent}</Markdown>
}
```

This eliminates redundant parsing operations during streaming. ([Performance Articles][6])

## Common Integration Patterns

### Syntax Highlighting

**Using rehype-highlight:**

```jsx
import Markdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

<Markdown rehypePlugins={[rehypeHighlight]}>
  {codeMarkdown}
</Markdown>
```

**Using react-syntax-highlighter:**

```jsx
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

<Markdown
  components={{
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    }
  }}
>
  {markdown}
</Markdown>
```

([react-markdown README][1])

### Math Rendering

```jsx
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

<Markdown
  remarkPlugins={[remarkMath]}
  rehypePlugins={[rehypeKatex]}
>
  {`Inline math: $E = mc^2$\n\nBlock math:\n\n$$\n\\int_0^\\infty f(x)dx\n$$`}
</Markdown>
```

### React Router Integration

```jsx
import { Link } from 'react-router-dom'

<Markdown
  components={{
    a: ({href, children}) => {
      // Internal links use React Router, external links use <a>
      const isInternal = href?.startsWith('/')
      return isInternal ? (
        <Link to={href}>{children}</Link>
      ) : (
        <a href={href} target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      )
    }
  }}
>
  {markdown}
</Markdown>
```

### Image Optimization

```jsx
import Image from 'next/image'

<Markdown
  components={{
    img: ({src, alt}) => (
      <Image
        src={src || ''}
        alt={alt || ''}
        width={800}
        height={400}
        style={{maxWidth: '100%', height: 'auto'}}
      />
    )
  }}
>
  {markdown}
</Markdown>
```

([react-markdown README][1])

## Supported Markdown

### CommonMark

react-markdown provides 100% CommonMark compliance by default. ([react-markdown README][1])

### GitHub Flavored Markdown

GFM support requires the `remark-gfm` plugin. See [remark-gfm Reference](remark-gfm-reference.md) for details.

```jsx
import remarkGfm from 'remark-gfm'

<Markdown remarkPlugins={[remarkGfm]}>
  {gfmContent}
</Markdown>
```

## Troubleshooting

### Issue: Styles Not Applied to Components

**Problem**: Custom CSS classes don't apply to markdown elements.

**Solution**: Use the `components` prop:

```jsx
<Markdown
  components={{
    p: ({node, ...props}) => <p className="prose-p" {...props} />,
    h1: ({node, ...props}) => <h1 className="prose-h1" {...props} />
  }}
>
  {content}
</Markdown>
```

### Issue: Cannot Add className to Markdown Component (v10+)

**Problem**: `className` prop removed in v10.

**Solution**: Wrap in a div:

```jsx
<div className="markdown-wrapper">
  <Markdown>{content}</Markdown>
</div>
```

### Issue: Links Not Opening in New Tab

**Solution**: Customize link component:

```jsx
<Markdown
  components={{
    a: ({href, children}) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    )
  }}
/>
```

### Issue: Code Blocks Not Highlighted

**Problem**: No syntax highlighting by default.

**Solution**: Add a rehype plugin or custom code component (see Syntax Highlighting section).

### Issue: Performance Degradation with Large Documents

**Solution**: Implement virtualization, chunking, or lazy loading (see Performance Optimization section).

### Issue: TypeScript Errors with Custom Components

**Solution**: Use proper type imports:

```typescript
import { Components } from 'react-markdown'

const components: Components = {
  // Your components here
}
```

## Related Tools

### Official Plugins

- **remark-gfm**: GitHub Flavored Markdown support
- **remark-math**: Math notation parsing
- **remark-breaks**: Convert soft line breaks to `<br>`
- **remark-frontmatter**: YAML/TOML frontmatter support
- **remark-toc**: Table of contents generation
- **rehype-highlight**: Syntax highlighting
- **rehype-katex**: Math rendering
- **rehype-slug**: Add IDs to headings
- **rehype-sanitize**: HTML sanitization

([remark plugins][7], [rehype plugins][8])

### Community Tools

- **react-syntax-highlighter**: Advanced syntax highlighting
- **remark-external-links**: Configure external link behavior
- **remark-emoji**: Emoji shortcode support
- **rehype-autolink-headings**: Auto-link heading anchors

## Resources

- [react-markdown GitHub Repository](https://github.com/remarkjs/react-markdown)
- [Changelog](https://github.com/remarkjs/react-markdown/blob/main/changelog.md)
- [unified Ecosystem Documentation](https://unifiedjs.com/)
- [remark Plugin List](https://github.com/remarkjs/remark/blob/main/doc/plugins.md)
- [rehype Plugin List](https://github.com/rehypejs/rehype/blob/main/doc/plugins.md)

[1]: https://github.com/remarkjs/react-markdown "react-markdown GitHub"
[2]: https://github.com/remarkjs/react-markdown/blob/main/changelog.md "react-markdown Changelog"
[3]: https://unifiedjs.com/ "unified Documentation"
[4]: https://stackoverflow.com/questions/tagged/react-markdown "Stack Overflow - react-markdown TypeScript"
[5]: https://medium.com/search?q=react-markdown+security "Security Articles"
[6]: https://studyraid.com/search?q=react-markdown+performance "Performance Articles"
[7]: https://github.com/remarkjs/remark/blob/main/doc/plugins.md "remark Plugins"
[8]: https://github.com/rehypejs/rehype/blob/main/doc/plugins.md "rehype Plugins"
