---
title: "react-markdown + remark-gfm Integration Guide"
description: "Best practices and patterns for integrating react-markdown with remark-gfm"
type: "integration-guide"
tags: ["react", "markdown", "gfm", "integration", "best-practices", "security", "performance"]
category: "ts"
subcategory: "react"
version: "1.0"
last_updated: "2025-08-16"
status: "stable"
sources:
  - name: "react-markdown GitHub"
    url: "https://github.com/remarkjs/react-markdown"
  - name: "remark-gfm GitHub"
    url: "https://github.com/remarkjs/remark-gfm"
related: ["react-markdown-reference.md", "remark-gfm-reference.md"]
author: "unknown"
contributors: []
---

# react-markdown + remark-gfm Integration Guide

Comprehensive guide for integrating react-markdown with remark-gfm to render GitHub Flavored Markdown in React applications.

## Quick Start

### Basic Integration

```bash
npm install react-markdown remark-gfm
```

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function App() {
  const markdown = `
# Hello World

This is **bold** and this is *italic*.

## GFM Features

~~Strikethrough~~ works!

- [ ] Unchecked task
- [x] Completed task

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |

Visit www.example.com for more.
  `.trim()

  return <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
}
```

([react-markdown README][1], [remark-gfm README][2])

## Version Compatibility

### Current Compatibility Matrix

| react-markdown | remark-gfm | remark | Node.js | Status |
|----------------|------------|--------|---------|--------|
| v10.x | v4.x | v15+ | 16+ | ✅ Recommended |
| v9.x | v4.x | v15+ | 16+ | ✅ Supported |
| v8.x | v3.x | v14 | 14+ | ⚠️ Legacy |

**Current Recommended Setup:**
```bash
npm install react-markdown@^10.1.0 remark-gfm@^4.0.1
```

([react-markdown Changelog][3], [remark-gfm GitHub][2])

## Integration Patterns

### 1. Basic GFM Support

Enable all GitHub Flavored Markdown features:

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function MarkdownContent({ content }) {
  return (
    <div className="markdown-body">
      <Markdown remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  )
}
```

### 2. With Plugin Options

Configure remark-gfm behavior:

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import stringWidth from 'string-width'

function MarkdownContent({ content }) {
  return (
    <Markdown
      remarkPlugins={[
        [remarkGfm, {
          singleTilde: false,  // Only ~~double~~ strikethrough
          stringLength: stringWidth  // Handle emoji/CJK in tables
        }]
      ]}
    >
      {content}
    </Markdown>
  )
}
```

([remark-gfm README][2])

### 3. Multiple Plugins

Combine remark-gfm with other remark/rehype plugins:

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeHighlight from 'rehype-highlight'
import 'katex/dist/katex.min.css'
import 'highlight.js/styles/github-dark.css'

function MarkdownContent({ content }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeHighlight]}
    >
      {content}
    </Markdown>
  )
}
```

([react-markdown README][1])

### 4. Memoized Component

Optimize re-renders with memoization:

```jsx
import { memo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const MemoizedMarkdown = memo(
  ({ content }) => (
    <Markdown remarkPlugins={[remarkGfm]}>
      {content}
    </Markdown>
  ),
  (prevProps, nextProps) => prevProps.content === nextProps.content
)

export default function App({ markdown }) {
  return <MemoizedMarkdown content={markdown} />
}
```

([Performance Best Practices][4])

## Customizing GFM Elements

### Tables

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    table: ({node, ...props}) => (
      <div className="table-wrapper">
        <table className="custom-table" {...props} />
      </div>
    ),
    thead: ({node, ...props}) => (
      <thead className="table-header" {...props} />
    ),
    tbody: ({node, ...props}) => (
      <tbody className="table-body" {...props} />
    ),
    tr: ({node, isHeader, ...props}) => (
      <tr className={isHeader ? 'header-row' : 'data-row'} {...props} />
    ),
    th: ({node, ...props}) => (
      <th className="header-cell" {...props} />
    ),
    td: ({node, ...props}) => (
      <td className="data-cell" {...props} />
    )
  }}
>
  {markdownWithTables}
</Markdown>
```

**Responsive Tables:**

```jsx
<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    table: ({node, ...props}) => (
      <div style={{overflowX: 'auto'}}>
        <table {...props} />
      </div>
    )
  }}
/>
```

### Task Lists

**Read-Only Task Lists (Default):**

```jsx
<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    input: ({node, ...props}) => (
      <input
        {...props}
        className="task-checkbox"
        style={{marginRight: '0.5rem'}}
      />
    )
  }}
/>
```

**Interactive Task Lists:**

```jsx
import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function InteractiveTaskList({ initialMarkdown }) {
  const [markdown, setMarkdown] = useState(initialMarkdown)
  const [tasks, setTasks] = useState(
    extractTasks(initialMarkdown)
  )

  const handleTaskToggle = (index) => {
    const newTasks = [...tasks]
    newTasks[index] = !newTasks[index]
    setTasks(newTasks)
    setMarkdown(updateMarkdownTasks(markdown, newTasks))
  }

  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        input: ({node, checked, ...props}) => {
          const index = getCurrentTaskIndex(node)
          return (
            <input
              {...props}
              type="checkbox"
              checked={tasks[index] ?? checked}
              disabled={false}
              onChange={() => handleTaskToggle(index)}
            />
          )
        }
      }}
    >
      {markdown}
    </Markdown>
  )
}

// Helper functions (simplified)
function extractTasks(md) {
  const matches = md.match(/- \[(x| )\]/gi) || []
  return matches.map(m => m.includes('x'))
}

function updateMarkdownTasks(md, tasks) {
  let index = 0
  return md.replace(/- \[(x| )\]/gi, () =>
    `- [${tasks[index++] ? 'x' : ' '}]`
  )
}

function getCurrentTaskIndex(node) {
  // Implementation depends on AST structure
  return 0 // Placeholder
}
```

### Strikethrough

```jsx
<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    del: ({node, ...props}) => (
      <del className="strikethrough" {...props} />
    )
  }}
/>
```

**Custom Styling:**

```css
.strikethrough {
  text-decoration: line-through;
  color: #6c757d;
  opacity: 0.7;
}
```

### Autolinks

```jsx
<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    a: ({href, children, node}) => {
      const isExternal = href?.startsWith('http')
      const isAutolink = node?.properties?.className?.includes('autolink')

      return (
        <a
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className={isAutolink ? 'autolink' : 'manual-link'}
        >
          {children}
        </a>
      )
    }
  }}
/>
```

### Footnotes

```jsx
<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    sup: ({node, ...props}) => (
      <sup className="footnote-ref" {...props} />
    ),
    section: ({node, className, ...props}) => {
      if (className === 'footnotes') {
        return (
          <section className="footnotes-section" {...props} />
        )
      }
      return <section className={className} {...props} />
    }
  }}
/>
```

**Custom Footnote Styling:**

```css
.footnote-ref {
  font-size: 0.8em;
  vertical-align: super;
}

.footnote-ref a {
  color: #0366d6;
  text-decoration: none;
}

.footnotes-section {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e1e4e8;
  font-size: 0.9em;
}
```

([react-markdown README][1])

## Advanced Integration Patterns

### Syntax Highlighting

**Using rehype-highlight:**

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'

<Markdown
  remarkPlugins={[remarkGfm]}
  rehypePlugins={[rehypeHighlight]}
>
  {markdownWithCode}
</Markdown>
```

**Using react-syntax-highlighter:**

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'

<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '')
      const language = match ? match[1] : ''

      return !inline ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
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
  {markdownWithCode}
</Markdown>
```

**Copy Button for Code Blocks:**

```jsx
import { useState } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'

function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(String(children))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="language">{language}</span>
        <button onClick={handleCopy} className="copy-button">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter language={language}>
        {String(children)}
      </SyntaxHighlighter>
    </div>
  )
}

<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    code({node, inline, className, children, ...props}) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <CodeBlock language={match[1]}>{children}</CodeBlock>
      ) : (
        <code className={className} {...props}>{children}</code>
      )
    }
  }}
>
  {markdown}
</Markdown>
```

([react-markdown README][1])

### GitHub-Like Styling

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import 'github-markdown-css/github-markdown.css'

function GitHubStyleMarkdown({ content }) {
  return (
    <div className="markdown-body" style={{
      boxSizing: 'border-box',
      minWidth: '200px',
      maxWidth: '980px',
      margin: '0 auto',
      padding: '45px'
    }}>
      <Markdown remarkPlugins={[remarkGfm]}>
        {content}
      </Markdown>
    </div>
  )
}
```

**Install GitHub styles:**
```bash
npm install github-markdown-css
```

### React Router Integration

```jsx
import { Link } from 'react-router-dom'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    a: ({href, children}) => {
      const isInternal = href?.startsWith('/')
      const isHash = href?.startsWith('#')

      if (isInternal) {
        return <Link to={href}>{children}</Link>
      }

      if (isHash) {
        return <a href={href}>{children}</a>
      }

      return (
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

### Image Optimization (Next.js)

```jsx
import Image from 'next/image'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    img: ({src, alt}) => {
      if (!src) return null

      return (
        <Image
          src={src}
          alt={alt || ''}
          width={800}
          height={400}
          style={{
            maxWidth: '100%',
            height: 'auto'
          }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      )
    }
  }}
>
  {markdown}
</Markdown>
```

### Dark Mode Support

```jsx
import { useTheme } from './ThemeContext'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github-dark.css'
import 'highlight.js/styles/github.css'

function ThemedMarkdown({ content }) {
  const { theme } = useTheme()

  return (
    <div className={`markdown-wrapper ${theme}`}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
      >
        {content}
      </Markdown>
    </div>
  )
}
```

```css
.markdown-wrapper.light {
  --text-color: #24292e;
  --bg-color: #ffffff;
  --border-color: #e1e4e8;
}

.markdown-wrapper.dark {
  --text-color: #c9d1d9;
  --bg-color: #0d1117;
  --border-color: #30363d;
}

.markdown-wrapper {
  color: var(--text-color);
  background-color: var(--bg-color);
}

.markdown-wrapper table {
  border-color: var(--border-color);
}
```

## Security Best Practices

### 1. Secure Configuration for User Content

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const SAFE_ELEMENTS = [
  'p', 'br', 'strong', 'em', 'u', 'del',
  'ul', 'ol', 'li',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'input', 'sup', 'section'
]

function SafeMarkdown({ userContent }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      skipHtml={true}  // Ignore HTML in markdown
      allowedElements={SAFE_ELEMENTS}
      urlTransform={(url) => {
        // Only allow HTTPS and relative URLs
        if (url.startsWith('https://') || url.startsWith('/')) {
          return url
        }
        return null
      }}
      components={{
        a: ({href, children}) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        input: ({node, ...props}) => (
          <input {...props} disabled={true} />  // Keep checkboxes read-only
        )
      }}
    >
      {userContent}
    </Markdown>
  )
}
```

([Security Best Practices][5])

### 2. URL Validation

```jsx
const ALLOWED_PROTOCOLS = ['https:', 'http:', 'mailto:']
const ALLOWED_DOMAINS = ['example.com', 'trusted-site.org']

function validateUrl(url) {
  try {
    const parsed = new URL(url, window.location.href)

    // Check protocol
    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return null
    }

    // For HTTP(S), check domain whitelist
    if (parsed.protocol.startsWith('http')) {
      const isAllowed = ALLOWED_DOMAINS.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith(`.${domain}`)
      )
      if (!isAllowed) {
        return null
      }
    }

    return url
  } catch {
    return null
  }
}

<Markdown
  remarkPlugins={[remarkGfm]}
  urlTransform={validateUrl}
>
  {content}
</Markdown>
```

### 3. Content Security Policy

Add CSP headers to prevent XSS:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self';
    style-src 'self' 'unsafe-inline';
    img-src 'self' https:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  "
>
```

### 4. Server-Side Validation

Always validate and sanitize markdown on the server:

```javascript
// Server-side (Node.js/Express)
import sanitizeHtml from 'sanitize-html'

app.post('/api/content', (req, res) => {
  const userMarkdown = req.body.markdown

  // Validate length
  if (userMarkdown.length > 50000) {
    return res.status(400).json({ error: 'Content too large' })
  }

  // Sanitize HTML if present
  const sanitized = sanitizeHtml(userMarkdown, {
    allowedTags: [],  // Strip all HTML
    allowedAttributes: {}
  })

  // Store sanitized content
  await db.saveContent(sanitized)

  res.json({ success: true })
})
```

([Security Best Practices][5])

## Performance Optimization

### 1. Memoization Strategies

**Component-Level Memoization:**

```jsx
import { memo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const MemoizedMarkdown = memo(Markdown)

function MyComponent({ content }) {
  return (
    <MemoizedMarkdown remarkPlugins={[remarkGfm]}>
      {content}
    </MemoizedMarkdown>
  )
}
```

**Custom Comparison:**

```jsx
const MemoizedMarkdown = memo(
  Markdown,
  (prevProps, nextProps) => {
    return (
      prevProps.children === nextProps.children &&
      JSON.stringify(prevProps.remarkPlugins) === JSON.stringify(nextProps.remarkPlugins)
    )
  }
)
```

### 2. Virtualization for Large Documents

```jsx
import { FixedSizeList } from 'react-window'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function VirtualizedMarkdown({ content }) {
  // Split by paragraphs or sections
  const sections = content.split('\n\n')

  return (
    <FixedSizeList
      height={600}
      itemCount={sections.length}
      itemSize={100}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          <Markdown remarkPlugins={[remarkGfm]}>
            {sections[index]}
          </Markdown>
        </div>
      )}
    </FixedSizeList>
  )
}
```

### 3. Lazy Loading

```jsx
import { useState, useEffect, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function LazyMarkdown({ content, chunkSize = 3000 }) {
  const [visibleLength, setVisibleLength] = useState(chunkSize)
  const sentinelRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleLength < content.length) {
          setVisibleLength(prev => Math.min(prev + chunkSize, content.length))
        }
      },
      { threshold: 0.1 }
    )

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current)
    }

    return () => observer.disconnect()
  }, [visibleLength, content.length, chunkSize])

  const visibleContent = content.slice(0, visibleLength)
  const hasMore = visibleLength < content.length

  return (
    <div>
      <Markdown remarkPlugins={[remarkGfm]}>
        {visibleContent}
      </Markdown>
      {hasMore && (
        <div ref={sentinelRef} style={{ height: '20px' }}>
          Loading more...
        </div>
      )}
    </div>
  )
}
```

### 4. Streaming Content (AI Chat)

```jsx
import { useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function StreamingMarkdown({ streamingContent }) {
  // Memoize to prevent re-parsing on every stream update
  const content = useMemo(() => streamingContent, [streamingContent])

  return (
    <Markdown remarkPlugins={[remarkGfm]}>
      {content}
    </Markdown>
  )
}

// Better: Debounce updates
import { useState, useEffect } from 'react'
import { useDebouncedValue } from './hooks'

function DebouncedStreamingMarkdown({ streamingContent }) {
  const debouncedContent = useDebouncedValue(streamingContent, 100)

  return (
    <Markdown remarkPlugins={[remarkGfm]}>
      {debouncedContent}
    </Markdown>
  )
}
```

([Performance Best Practices][4])

### 5. Plugin Selection

```jsx
// Heavy - all plugins loaded
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkToc from 'remark-toc'
import remarkEmoji from 'remark-emoji'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'

<Markdown
  remarkPlugins={[remarkGfm, remarkMath, remarkToc, remarkEmoji]}
  rehypePlugins={[rehypeHighlight, rehypeKatex]}
/>

// Optimized - only what you need
import remarkGfm from 'remark-gfm'

<Markdown remarkPlugins={[remarkGfm]} />
```

## Common Use Cases

### Documentation Site

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'

function DocumentationPage({ content }) {
  return (
    <article className="documentation">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
          rehypeHighlight
        ]}
        components={{
          h1: ({id, children}) => (
            <h1 id={id} className="doc-heading-1">{children}</h1>
          ),
          h2: ({id, children}) => (
            <h2 id={id} className="doc-heading-2">{children}</h2>
          ),
          a: ({href, children}) => {
            const isExternal = href?.startsWith('http')
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="doc-link"
              >
                {children}
              </a>
            )
          }
        }}
      >
        {content}
      </Markdown>
    </article>
  )
}
```

### Blog Post Renderer

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'

function BlogPost({ frontmatter, content }) {
  return (
    <article className="blog-post">
      <header>
        <h1>{frontmatter.title}</h1>
        <time>{frontmatter.date}</time>
      </header>

      <div className="blog-content">
        <Markdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
        >
          {content}
        </Markdown>
      </div>
    </article>
  )
}
```

### Comment System

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const COMMENT_SAFE_ELEMENTS = [
  'p', 'br', 'strong', 'em', 'del',
  'ul', 'ol', 'li',
  'code', 'pre',
  'blockquote'
]

function UserComment({ comment }) {
  return (
    <div className="comment">
      <div className="comment-header">
        <img src={comment.avatar} alt={comment.username} />
        <span>{comment.username}</span>
        <time>{comment.timestamp}</time>
      </div>

      <div className="comment-body">
        <Markdown
          remarkPlugins={[remarkGfm]}
          skipHtml={true}
          allowedElements={COMMENT_SAFE_ELEMENTS}
          urlTransform={(url) =>
            url.startsWith('https://') ? url : null
          }
        >
          {comment.text}
        </Markdown>
      </div>
    </div>
  )
}
```

### README Viewer

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'github-markdown-css'

function ReadmeViewer({ readme, repoUrl }) {
  return (
    <div className="markdown-body">
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        urlTransform={(url) => {
          // Convert relative URLs to absolute GitHub URLs
          if (url.startsWith('./') || url.startsWith('../')) {
            return `${repoUrl}/blob/main/${url}`
          }
          return url
        }}
        components={{
          img: ({src, alt}) => (
            <img
              src={src?.startsWith('http') ? src : `${repoUrl}/raw/main/${src}`}
              alt={alt}
              style={{ maxWidth: '100%' }}
            />
          )
        }}
      >
        {readme}
      </Markdown>
    </div>
  )
}
```

## Testing

### Unit Testing with Jest

```jsx
import { render, screen } from '@testing-library/react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

describe('Markdown Rendering', () => {
  it('renders GFM tables', () => {
    const markdown = `
| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
    `

    render(<Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>)

    expect(screen.getByText('Column A')).toBeInTheDocument()
    expect(screen.getByText('Cell 1')).toBeInTheDocument()
  })

  it('renders task lists', () => {
    const markdown = '- [x] Completed\n- [ ] Incomplete'

    render(<Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(2)
    expect(checkboxes[0]).toBeChecked()
    expect(checkboxes[1]).not.toBeChecked()
  })

  it('sanitizes dangerous URLs', () => {
    const markdown = '[Link](javascript:alert("XSS"))'

    render(
      <Markdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) =>
          url.startsWith('http') ? url : null
        }
      >
        {markdown}
      </Markdown>
    )

    const link = screen.getByText('Link')
    expect(link).not.toHaveAttribute('href', 'javascript:alert("XSS")')
  })
})
```

## Troubleshooting

### Issue: GFM Features Not Working

**Problem**: Tables, task lists, or strikethrough not rendering.

**Solution**: Ensure `remarkGfm` is in the `remarkPlugins` array:

```jsx
<Markdown remarkPlugins={[remarkGfm]}>{content}</Markdown>
```

### Issue: Table Alignment Issues with Emoji

**Problem**: Tables with emoji or CJK characters have misaligned columns.

**Solution**: Use `stringWidth` for visual width calculation:

```bash
npm install string-width
```

```jsx
import stringWidth from 'string-width'

<Markdown remarkPlugins={[[remarkGfm, {stringLength: stringWidth}]]}>
  {content}
</Markdown>
```

### Issue: Task List Checkboxes Not Interactive

**Problem**: Checkboxes are disabled by default.

**Solution**: Customize the `input` component (see Interactive Task Lists section above).

### Issue: Performance Degradation

**Problem**: Slow rendering with large markdown documents.

**Solution**: Implement memoization, virtualization, or lazy loading (see Performance Optimization section).

### Issue: TypeScript Errors

**Problem**: Type errors with custom components.

**Solution**: Import and use proper types:

```typescript
import { Components } from 'react-markdown'

const components: Components = {
  // Your components
}
```

## Resources

- [react-markdown Reference](react-markdown-reference.md)
- [remark-gfm Reference](remark-gfm-reference.md)
- [react-markdown GitHub](https://github.com/remarkjs/react-markdown)
- [remark-gfm GitHub](https://github.com/remarkjs/remark-gfm)
- [unified Documentation](https://unifiedjs.com/)
- [GFM Specification](https://github.github.com/gfm/)

[1]: https://github.com/remarkjs/react-markdown "react-markdown README"
[2]: https://github.com/remarkjs/remark-gfm "remark-gfm README"
[3]: https://github.com/remarkjs/react-markdown/blob/main/changelog.md "react-markdown Changelog"
[4]: https://studyraid.com/search?q=react-markdown+performance "Performance Best Practices"
[5]: https://medium.com/search?q=react-markdown+security "Security Best Practices"
