---
title: "remark-gfm v4.0.1 Reference"
description: "Complete reference for GitHub Flavored Markdown support in unified/remark"
type: "tool-reference"
tags: ["remark", "gfm", "markdown", "github", "unified", "typescript", "tables", "strikethrough"]
category: "ts"
subcategory: "react"
version: "4.0.1"
last_updated: "2025-08-16"
status: "stable"
sources:
  - name: "remark-gfm GitHub"
    url: "https://github.com/remarkjs/remark-gfm"
  - name: "GFM Specification"
    url: "https://github.github.com/gfm/"
  - name: "unified Documentation"
    url: "https://unifiedjs.com/"
related: ["react-markdown-reference.md", "integration-guide.md"]
author: "unknown"
contributors: []
---

# remark-gfm v4.0.1 Reference

remark-gfm is a unified/remark plugin that enables parsing and serialization of GitHub Flavored Markdown (GFM) extensions. ([remark-gfm GitHub][1])

## Overview

### Purpose

Many users believe GFM extensions are part of standard markdown syntax. Using remark-gfm aligns your implementation with user expectations of how markdown works on GitHub. ([remark-gfm README][1])

### What It Does

remark-gfm adds support for five GitHub Flavored Markdown extensions:

1. **Autolink Literals** – URLs like `www.example.com` become clickable links automatically
2. **Footnotes** – Reference-style footnotes using `[^1]` syntax
3. **Strikethrough** – Text deletion via `~~text~~` (or `~text~` with configuration)
4. **Tables** – Pipe-delimited table syntax with column alignment
5. **Tasklists** – Checkbox-style list items using `[ ]` and `[x]` notation

([remark-gfm README][1])

### Architecture

**Important**: This plugin handles parsing and AST construction only. Converting to HTML requires additional plugins like `remark-rehype` and `rehype-stringify`. ([remark-gfm README][1])

**Processing Pipeline**:
```
Markdown → remarkParse → remarkGfm → AST (mdast)
AST → remarkRehype → HAST (HTML AST)
HAST → rehypeStringify → HTML
```

remark-gfm operates in the markdown-to-AST phase only.

## Installation

### Requirements

- **Node.js**: 16+
- **Module System**: ESM only (no CommonJS)
- **remark**: v15+ (remark-parse v11+)

([remark-gfm README][1])

### Installation Commands

```bash
npm install remark-gfm
```

```bash
yarn add remark-gfm
```

```bash
pnpm add remark-gfm
```

### Alternative Installation

**Deno:**
```javascript
import remarkGfm from 'https://esm.sh/remark-gfm@4'
```

([remark-gfm README][1])

## Version Information

### Version 4.0.1

**Publication**: Approximately 9 months ago (as of 2025-08-16)

**Compatibility**:
- remark-gfm v4 works with remark-parse v11+ (remark v15+)
- remark-gfm v3 worked with remark-parse v10 (remark v14)
- remark-gfm v2 worked with remark-parse v9 (remark v13)

([remark-gfm GitHub][1])

### Dependencies

Version 4 requires:
- `@types/mdast`: ^4.0.0
- `mdast-util-gfm`: ^3.0.0
- `micromark-extension-gfm`: ^3.0.0
- `remark-parse`: ^11.0.0
- `remark-stringify`: ^11.0.0
- `unified`: ^11.0.0

([remark-gfm package.json][1])

### Breaking Changes in v4

- Compatibility updated for remark v15+ and unified v11
- Some users reported table rendering edge cases when upgrading from v3
- Requires Node.js 16+ (up from Node.js 14+ in v3)

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `singleTilde` | boolean | `true` | Enable strikethrough with single `~` (matches GitHub behavior) |
| `stringLength` | function | `d => d.length` | Calculate table cell width (useful for emoji/CJK characters) |
| `tablePipeAlign` | boolean | `true` | Align pipes in table serialization |
| `tableCellPadding` | boolean | `true` | Add spaces between pipes and cell content |
| `firstLineBlank` | boolean | `false` | Serialize blank line before first footnote definition |

([remark-gfm README][1])

## Usage

### Basic Setup

```javascript
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)

const ast = processor.parse('~~strikethrough~~ text')
```

([remark-gfm README][1])

### Complete Processing Pipeline

```javascript
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const markdown = `
# Heading

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |

- [ ] Unchecked task
- [x] Completed task

Visit www.example.com for more info.
`

const html = await unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(markdown)

console.log(String(html))
```

([remark-gfm README][1])

### With react-markdown

```jsx
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

<Markdown remarkPlugins={[remarkGfm]}>
  {markdownContent}
</Markdown>
```

See [Integration Guide](integration-guide.md) for detailed integration patterns.

### With Plugin Options

```javascript
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm, {
    singleTilde: false, // Disable single-tilde strikethrough
    tableCellPadding: false // Compact table formatting
  })
```

**In react-markdown:**

```jsx
<Markdown remarkPlugins={[[remarkGfm, {singleTilde: false}]]}>
  This ~is not~ strikethrough, but ~~this is~~!
</Markdown>
```

([remark-gfm README][1])

## GFM Features

### 1. Autolink Literals

Automatically converts URLs and email addresses to clickable links without explicit markdown syntax.

**Syntax:**
```markdown
Visit www.example.com or https://example.com
Email me at user@example.com
```

**Rendered:**
```html
<p>Visit <a href="http://www.example.com">www.example.com</a> or <a href="https://example.com">https://example.com</a></p>
<p>Email me at <a href="mailto:user@example.com">user@example.com</a></p>
```

([GFM Specification][2])

### 2. Footnotes

Reference-style footnotes with `[^id]` syntax.

**Syntax:**
```markdown
Here's a sentence with a footnote.[^1]

[^1]: This is the footnote content.
```

**Rendered:**
```html
<p>Here's a sentence with a footnote.<sup><a href="#fn-1">1</a></sup></p>
<section class="footnotes">
  <ol>
    <li id="fn-1">This is the footnote content.</li>
  </ol>
</section>
```

**Multiple Footnotes:**
```markdown
First reference.[^1] Second reference.[^2]

[^1]: First footnote.
[^2]: Second footnote.
```

([remark-gfm README][1])

### 3. Strikethrough

Delete or mark text as incorrect using tildes.

**Syntax (default with `singleTilde: true`):**
```markdown
~single tilde~ or ~~double tilde~~
```

**Syntax (with `singleTilde: false`):**
```markdown
~~only double tilde works~~
```

**Rendered:**
```html
<p><del>single tilde</del> or <del>double tilde</del></p>
```

**Note**: GitHub uses single tildes despite the GFM spec specifying double tildes. The `singleTilde` option defaults to `true` to match GitHub's behavior. ([remark-gfm README][1])

### 4. Tables

Pipe-delimited tables with optional column alignment.

**Basic Table:**
```markdown
| Column 1 | Column 2 | Column 3 |
| -------- | -------- | -------- |
| Cell A1  | Cell B1  | Cell C1  |
| Cell A2  | Cell B2  | Cell C2  |
```

**With Alignment:**
```markdown
| Left | Center | Right |
| :--- | :----: | ----: |
| L1   | C1     | R1    |
| L2   | C2     | R2    |
```

**Rendered:**
```html
<table>
  <thead>
    <tr>
      <th align="left">Left</th>
      <th align="center">Center</th>
      <th align="right">Right</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td align="left">L1</td>
      <td align="center">C1</td>
      <td align="right">R1</td>
    </tr>
  </tbody>
</table>
```

**Compact Format:**
```markdown
|Header1|Header2|
|-|-|
|Data1|Data2|
```

([GFM Specification][2])

### 5. Task Lists

Interactive checkbox lists using `[ ]` for unchecked and `[x]` for checked items.

**Syntax:**
```markdown
- [ ] Unchecked task
- [x] Completed task
- [ ] Another unchecked task
  - [x] Nested completed task
  - [ ] Nested unchecked task
```

**Rendered:**
```html
<ul>
  <li><input type="checkbox" disabled> Unchecked task</li>
  <li><input type="checkbox" checked disabled> Completed task</li>
  <li><input type="checkbox" disabled> Another unchecked task
    <ul>
      <li><input type="checkbox" checked disabled> Nested completed task</li>
      <li><input type="checkbox" disabled> Nested unchecked task</li>
    </ul>
  </li>
</ul>
```

**Note**: Checkboxes are rendered with `disabled` attribute by default. To make them interactive, use custom components in react-markdown. ([remark-gfm README][1])

## Configuration Deep Dive

### singleTilde Option

**Problem**: The GFM specification requires `~~double tildes~~`, but GitHub.com actually supports `~single tildes~`.

**Solution**: The `singleTilde` option (default: `true`) matches GitHub's behavior.

```javascript
// Match GitHub.com behavior (default)
.use(remarkGfm, {singleTilde: true})

// Match GFM spec strictly
.use(remarkGfm, {singleTilde: false})
```

([remark-gfm README][1])

### stringLength Option

**Problem**: The default `s => s.length` doesn't account for visual width. CJK characters and emoji appear wider but count as single characters, causing misaligned tables.

**Example Problem:**
```markdown
| Name | Emoji |
| ---- | ----- |
| Test | 🎉    |
```

The emoji `🎉` is 1 character but visually wider than 5 ASCII characters, breaking alignment.

**Solution**: Use a visual width calculation function.

```javascript
import stringWidth from 'string-width'

.use(remarkGfm, {stringLength: stringWidth})
```

**With react-markdown:**
```jsx
import remarkGfm from 'remark-gfm'
import stringWidth from 'string-width'

<Markdown remarkPlugins={[[remarkGfm, {stringLength: stringWidth}]]}>
  {tableWithEmoji}
</Markdown>
```

([remark-gfm README][1])

### tablePipeAlign and tableCellPadding

Control table formatting when serializing markdown.

**Default (both true):**
```markdown
| Column A | Column B |
| -------- | -------- |
| Cell 1   | Cell 2   |
```

**With `tablePipeAlign: false, tableCellPadding: false`:**
```markdown
|Column A|Column B|
|--------|--------|
|Cell 1|Cell 2|
```

**Usage:**
```javascript
.use(remarkGfm, {
  tablePipeAlign: false,
  tableCellPadding: false
})
```

### firstLineBlank

Controls whether a blank line is added before the first footnote definition.

**With `firstLineBlank: true`:**
```markdown
Paragraph with footnote.[^1]

[^1]: Footnote text.
```

**With `firstLineBlank: false` (default):**
```markdown
Paragraph with footnote.[^1]
[^1]: Footnote text.
```

([remark-gfm README][1])

## HTML Elements Generated

When using remark-gfm with react-markdown, these additional HTML elements may be rendered:

- `<del>` – Strikethrough text
- `<input type="checkbox">` – Task list checkboxes
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>` – Tables
- `<sup>`, `<section>`, `<ol>` – Footnotes

You can customize these using react-markdown's `components` prop. See [Integration Guide](integration-guide.md).

## Security

### Built-in Security

**Quote**: "Use of remark-gfm does not involve rehype (hast) or user content so there are no openings for cross-site scripting (XSS) attacks." ([remark-gfm README][1])

### Security Considerations

1. **Parsing Only**: remark-gfm only parses markdown syntax; it doesn't generate HTML
2. **HTML Generation**: Security should be addressed at the rehype/HTML conversion stage
3. **Sanitization**: Use `rehype-sanitize` if processing untrusted content

**Example with Sanitization:**
```javascript
import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'
import {unified} from 'unified'

const safeHtml = await unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeSanitize) // Sanitize HTML output
  .use(rehypeStringify)
  .process(untrustedMarkdown)
```

## Best Practices

### 1. Always Use with remark-rehype

remark-gfm only handles AST construction. Use remark-rehype to convert to HTML.

```javascript
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)  // Required for HTML output
  .use(rehypeStringify)
```

### 2. Configure String Width for International Content

If your content includes CJK characters, emoji, or other multi-byte characters, use a visual width function.

```javascript
import stringWidth from 'string-width'

.use(remarkGfm, {stringLength: stringWidth})
```

### 3. Match Your Target Platform

- **For GitHub compatibility**: Use default settings (`singleTilde: true`)
- **For strict GFM spec**: Set `singleTilde: false`

### 4. Handle Footnotes in Non-English Content

When using non-English content, configure remark-rehype appropriately for footnote label generation.

### 5. Don't Rely on remark-gfm for HTML Security

HTML conversion and sanitization happen downstream. Use rehype plugins for security.

([remark-gfm README][1])

## Troubleshooting

### Issue: Tables Not Aligning Properly

**Problem**: Tables with emoji or CJK characters have misaligned columns.

**Solution**: Use the `stringLength` option with a visual width function:

```javascript
import stringWidth from 'string-width'

.use(remarkGfm, {stringLength: stringWidth})
```

### Issue: Single Tilde Strikethrough Not Working

**Problem**: `~text~` doesn't render as strikethrough.

**Solution**: Verify `singleTilde: true` (the default). If explicitly set to `false`, only `~~text~~` will work.

```javascript
.use(remarkGfm, {singleTilde: true})
```

### Issue: Markdown Parsing Works but HTML Output Missing

**Problem**: AST is generated but no HTML is produced.

**Solution**: Add `remark-rehype` and `rehype-stringify` to the processing chain:

```javascript
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)  // Add this
  .use(rehypeStringify)  // Add this
```

### Issue: Footnotes Not Generating Proper HTML

**Problem**: Footnote references work but HTML structure is incorrect.

**Solution**: HTML conversion happens in remark-rehype. Ensure it's configured correctly. remark-gfm only parses the syntax.

### Issue: Task List Checkboxes Not Interactive

**Problem**: Checkboxes are rendered but disabled.

**Solution**: In react-markdown, customize the `input` component:

```jsx
<Markdown
  remarkPlugins={[remarkGfm]}
  components={{
    input: ({node, ...props}) => (
      <input
        {...props}
        disabled={false}  // Enable interaction
        onChange={(e) => {
          // Handle checkbox state change
        }}
      />
    )
  }}
/>
```

See [Integration Guide](integration-guide.md) for more details.

### Issue: Version Compatibility Errors

**Problem**: Errors when using with older versions of remark.

**Solution**: Ensure version compatibility:
- remark-gfm v4 requires remark v15+ (remark-parse v11+)
- If using remark v14, use remark-gfm v3
- If using remark v13, use remark-gfm v2

```bash
# Check installed versions
npm list remark-parse remark-gfm

# Install compatible versions
npm install remark-gfm@3  # For remark v14
npm install remark-gfm@2  # For remark v13
```

## Related Plugins

### Complementary remark Plugins

- **remark-frontmatter**: YAML/TOML frontmatter support
- **remark-github**: Link GitHub references (commits, issues, users)
- **remark-breaks**: Convert soft line breaks to `<br>` tags
- **remark-emoji**: Emoji shortcode support (`:smile:`)
- **remark-math**: Math notation support

### Complementary rehype Plugins

- **rehype-slug**: Add IDs to headings (useful for footnote linking)
- **rehype-autolink-headings**: Auto-link heading anchors
- **rehype-sanitize**: HTML sanitization for security
- **rehype-highlight**: Syntax highlighting for code blocks

([remark-gfm README][1])

## Migration Guide

### From v3 to v4

**Breaking Changes:**
- Requires Node.js 16+ (was 14+)
- Requires remark v15+ (was v14)
- Updated to unified v11 (was v10)

**Steps:**
1. Update Node.js to v16 or higher
2. Update remark and related packages:
   ```bash
   npm install remark@latest remark-parse@latest remark-gfm@latest
   ```
3. Test table rendering thoroughly (some edge cases changed)
4. Verify footnote output

### From v2 to v4

Follow the v2→v3 migration first, then v3→v4. Major ecosystem changes occurred between these versions.

### From react-markdown v8 + remark-gfm v3

**If upgrading to react-markdown v9/v10:**
```bash
npm install react-markdown@latest remark-gfm@latest
```

react-markdown v9+ is compatible with remark-gfm v4. No code changes needed for basic integration.

## Performance Considerations

### Plugin Overhead

remark-gfm adds parsing overhead for five GFM features. If you only need specific features, consider:
- Using only the features you need in your markdown
- Avoiding complex tables in performance-critical scenarios
- Limiting footnote usage in very large documents

### Table Rendering Performance

Large tables can impact performance. Consider:
- Limiting table size in user-generated content
- Using virtual scrolling for large tables
- Implementing pagination for data-heavy tables

### AST Size

GFM features increase AST complexity:
- Tables generate nested structures
- Footnotes create additional nodes
- Task lists add metadata

For very large documents, monitor memory usage.

## Resources

- [remark-gfm GitHub Repository](https://github.com/remarkjs/remark-gfm)
- [GFM Specification](https://github.github.com/gfm/)
- [unified Documentation](https://unifiedjs.com/)
- [remark Documentation](https://github.com/remarkjs/remark)
- [mdast (Markdown AST) Specification](https://github.com/syntax-tree/mdast)

[1]: https://github.com/remarkjs/remark-gfm "remark-gfm GitHub"
[2]: https://github.github.com/gfm/ "GFM Specification"
[3]: https://unifiedjs.com/ "unified Documentation"
