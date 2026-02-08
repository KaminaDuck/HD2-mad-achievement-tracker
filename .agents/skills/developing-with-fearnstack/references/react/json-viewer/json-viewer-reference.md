---
author: unknown
category: ts
contributors: []
description: React component for displaying and inspecting JSON and structured data
  with theming and customization
last_updated: '2025-08-16'
related:
- ../../react/react-19.md
- ../../material-ui/mui-v7.md
sources:
- name: GitHub Repository
  url: https://github.com/TexteaInc/json-viewer
- name: Official Documentation
  url: https://viewer.textea.io
- name: npm Package
  url: https://www.npmjs.com/package/@textea/json-viewer
status: stable
subcategory: react
tags:
- react
- json
- viewer
- typescript
- mui
- component
- data-visualization
- inspector
title: '@textea/json-viewer Reference'
type: tool-reference
version: 4.0.1
---

# @textea/json-viewer Reference

A React component library for displaying and inspecting various data types with full TypeScript support, Material-UI integration, and extensive customization capabilities. ([GitHub Repository][1])

## Overview

@textea/json-viewer is not limited to JSON—it can visualize Objects, Arrays, Maps, Sets, and primitive types with built-in support for theming, editing, and custom data type definitions. ([Official Documentation][2]) The library is built with 100% TypeScript and designed for server-side rendering compatibility. ([GitHub Repository][1])

### Key Features

- **100% TypeScript** - Fully typed implementation for type safety ([GitHub Repository][1])
- **Comprehensive data inspection** - Objects, Arrays, primitives, Maps, and Sets ([GitHub Repository][1])
- **Theme flexibility** - Built-in light/dark modes plus Base16 theme support ([Official Documentation][2])
- **Copy-to-clipboard** - Built-in functionality for data values ([GitHub Repository][1])
- **Metadata display** - Item counts, string lengths, and property details ([GitHub Repository][1])
- **Customizable editor** - Basic data types with extensibility options ([GitHub Repository][1])
- **SSR-ready** - Server-side rendering architecture ([GitHub Repository][1])
- **Custom data types** - Define renderers for specialized data formats ([Official Documentation][2])

## Installation

The component requires Material-UI and Emotion as peer dependencies. ([npm Package][3])

```bash
npm install @textea/json-viewer @mui/material @emotion/react @emotion/styled
```

### CDN Usage

For direct HTML integration via jsDelivr: ([npm Package][3])

```html
<script src="https://cdn.jsdelivr.net/npm/@textea/json-viewer@3"></script>
<script>
  new JsonViewer({
    value: { /* data */ }
  }).render('#json-viewer')
</script>
```

## Basic Usage

The minimal implementation requires only the `value` prop: ([Official Documentation][2])

```jsx
import { JsonViewer } from '@textea/json-viewer'

const data = {
  string: "Hello World",
  number: 42,
  float: 3.14159,
  boolean: true,
  null: null,
  object: { nested: "value" },
  array: [1, 2, 3]
}

const Component = () => <JsonViewer value={data} />
```

### With Theme

```jsx
<JsonViewer
  value={data}
  theme="dark" // 'light', 'dark', or 'auto'
/>
```

### Hide Root Name

The `rootName` prop controls the root node display: ([Official Documentation][2])

```jsx
<JsonViewer
  value={data}
  rootName={false} // or custom string
/>
```

## Component API

Complete props reference for the JsonViewer component. ([Official Documentation - APIs][4])

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `any` | — | Input data for rendering (required) |
| `rootName` | `string \| false` | `"root"` | Name displayed for root element |
| `theme` | `"light" \| "dark" \| "auto" \| Base16` | `"light"` | Color scheme selection |

### Styling Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | — | Custom CSS class |
| `style` | `CSSProperties` | — | Inline styles |
| `sx` | `SxProps` | — | MUI System inline properties |
| `indentWidth` | `number` | `3` | Spacing for nested levels |

### Display Control Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `defaultInspectDepth` | `number` | `5` | Initial expansion depth |
| `defaultInspectControl` | `function` | — | Per-field expansion control |
| `maxDisplayLength` | `number` | `30` | Item count threshold before collapsing |
| `groupArraysAfterLength` | `number` | `100` | Array grouping threshold |
| `collapseStringsAfterLength` | `number` | `50` | String truncation length |
| `objectSortKeys` | `boolean` | `false` | Sort object keys alphabetically |
| `quotesOnKeys` | `boolean` | `true` | Display quotation marks around keys |
| `displayDataTypes` | `boolean` | `true` | Show type labels (e.g., "int", "date") |
| `displaySize` | `boolean \| function` | `true` | Display container sizes (item counts) |
| `displayComma` | `boolean` | `true` | Show trailing commas |
| `highlightUpdates` | `boolean` | `true` | Highlight changed values |

### Interaction Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enableClipboard` | `boolean` | `false` | Copy-to-clipboard feature |
| `editable` | `boolean \| function` | `false` | Enable value editing |
| `enableAdd` | `boolean \| function` | `false` | Allow adding values |
| `enableDelete` | `boolean \| function` | `false` | Allow removing values |

### Customization Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `keyRenderer` | `{when: (props) => boolean}` | — | Custom key rendering logic |
| `valueTypes` | `ValueTypes` | — | Custom data type definitions |

### Callback Props

| Prop | Type | Description |
|------|------|-------------|
| `onChange` | `function` | Triggered on value modification |
| `onCopy` | `function` | Triggered on copy action |
| `onSelect` | `function` | Triggered on value selection |
| `onAdd` | `function` | Implements add functionality |
| `onDelete` | `function` | Implements delete functionality |

## Theming and Styling

### Built-in Themes

Pass the `theme` prop with automatic system theme detection: ([Official Documentation - Styling][5])

```jsx
<JsonViewer
  value={data}
  theme="auto" // automatically according to system theme
/>
```

Theme-specific CSS classes are applied to the component root: ([Official Documentation - Styling][5])

- `json-viewer-theme-light`
- `json-viewer-theme-dark`
- `json-viewer-theme-custom` (when using Base16 theme object)

### Base16 Custom Themes

Pass a Base16 theme object for granular color control: ([Official Documentation - Styling][5])

```typescript
import type { NamedColorspace } from '@textea/json-viewer'

export const oceanTheme: NamedColorspace = {
  scheme: 'Ocean',
  author: 'Chris Kempson',
  base00: '#2b303b', // background
  base01: '#343d46',
  base02: '#4f5b66',
  base03: '#65737e',
  base04: '#a7adba',
  base05: '#c0c5ce',
  base06: '#dfe1e8',
  base07: '#eff1f5', // foreground
  base08: '#bf616a', // red/error
  base09: '#d08770', // orange
  base0A: '#ebcb8b', // yellow
  base0B: '#a3be8c', // green
  base0C: '#96b5b4', // cyan
  base0D: '#8fa1b3', // blue
  base0E: '#b48ead', // purple
  base0F: '#ab7967'  // brown
}

<JsonViewer value={data} theme={oceanTheme} />
```

### CSS Class Customization

Target specific elements using these class names: ([Official Documentation - Styling][5])

**Structure classes:**
- `data-object-start`, `data-object-body`, `data-object-end`
- `data-function-start`, `data-function-body`, `data-function-end`

**Content classes:**
- `data-key` - Key names
- `data-key-pair` - Key-value pairs
- `data-key-colon` - Colon separator
- `data-type-label` - Type badges
- `data-value-fallback` - Default value display

**Toggle classes:**
- `data-key-toggle-expanded` - Expanded state icon
- `data-key-toggle-collapsed` - Collapsed state icon

Example:

```css
.json-viewer .data-object-start {
  color: red;
}

.json-viewer .data-type-label {
  font-weight: bold;
}
```

### MUI System Styling

Use the `sx` prop for Material-UI System-based styling: ([Official Documentation - Styling][5])

```jsx
<JsonViewer
  value={data}
  sx={{
    backgroundColor: 'background.paper',
    padding: 2,
    borderRadius: 1
  }}
/>
```

## Custom Data Types

### defineDataType API

Create custom renderers for specific data patterns: ([Official Documentation - Data Types][6])

```jsx
import { JsonViewer, defineDataType } from '@textea/json-viewer'

const imageDataType = defineDataType({
  is: (value) => typeof value === 'string' && value.startsWith('https://'),
  Component: (props) => (
    <img
      src={props.value}
      alt={props.value}
      style={{ maxWidth: '200px' }}
    />
  )
})

<JsonViewer
  value={data}
  valueTypes={[imageDataType]}
/>
```

### DataItemProps Interface

The renderer component receives these props: ([Official Documentation - Data Types][6])

- `props.path` - Location of the value in the data structure
- `props.value` - The data to display
- `props.inspect` - Boolean expansion state flag
- `props.setInspect` - Function to toggle expansion state

### Advanced Custom Types

Enhanced data types with editing capability: ([Official Documentation - Data Types][6])

```jsx
const urlDataType = defineDataType({
  is: (value) => value instanceof URL,

  Component: (props) => (
    <a href={props.value.href} target="_blank" rel="noopener">
      {props.value.href}
    </a>
  ),

  Editor: (props) => (
    <input
      value={props.value.href}
      onChange={(e) => props.setValue(new URL(e.target.value))}
    />
  ),

  // Required when Editor is provided
  serialize: (value) => value.href,
  deserialize: (str) => new URL(str)
})
```

### PreComponent and PostComponent

Wrap values for advanced layouts: ([Official Documentation - Data Types][6])

```jsx
const actionableString = defineDataType({
  is: (value) => typeof value === 'string',

  Component: stringType.Component, // reuse built-in

  PostComponent: (props) => (
    <button onClick={() => navigator.clipboard.writeText(props.value)}>
      Copy
    </button>
  )
})
```

### defineEasyType Helper

Simplified alternative for common formatting scenarios: ([Official Documentation - Data Types][6])

```jsx
import { defineEasyType } from '@textea/json-viewer'

const dateType = defineEasyType({
  is: (value) => value instanceof Date,
  type: 'date',
  colorKey: 'base0D',
  Renderer: (props) => props.value.toLocaleDateString()
})
```

## Editing and Interaction

### Enable Editing

Make values editable with callbacks: ([GitHub Repository][1])

```jsx
<JsonViewer
  value={data}
  editable={true}
  onChange={(path, oldValue, newValue) => {
    console.log('Changed:', path, oldValue, '→', newValue)
  }}
/>
```

### Conditional Editing

Use a function to enable editing for specific paths:

```jsx
<JsonViewer
  value={data}
  editable={(path, value) => {
    // Only allow editing primitive values
    return typeof value !== 'object'
  }}
  onChange={(path, oldValue, newValue) => {
    // Update your state
  }}
/>
```

### Add and Delete Operations

Enable CRUD operations: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={data}
  enableAdd={true}
  enableDelete={true}
  onAdd={(path, newValue) => {
    console.log('Added:', path, newValue)
  }}
  onDelete={(path, deletedValue) => {
    console.log('Deleted:', path, deletedValue)
  }}
/>
```

### Copy to Clipboard

Enable clipboard functionality: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={data}
  enableClipboard={true}
  onCopy={(path, value) => {
    console.log('Copied:', path, value)
  }}
/>
```

## Display Configuration

### Control Expansion

Set default inspection depth: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={data}
  defaultInspectDepth={2} // only expand 2 levels
/>
```

### Per-field Expansion Control

Customize which fields start expanded:

```jsx
<JsonViewer
  value={data}
  defaultInspectControl={(path, value) => {
    // Expand only objects with fewer than 5 keys
    return typeof value === 'object'
      && Object.keys(value).length < 5
  }}
/>
```

### Array Grouping

Group large arrays into manageable chunks: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={largeArray}
  groupArraysAfterLength={50} // group after 50 items
/>
```

### String Collapsing

Truncate long strings automatically: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={data}
  collapseStringsAfterLength={100} // truncate after 100 chars
/>
```

## Advanced Usage

### Custom Key Renderer

Customize how keys are displayed: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={data}
  keyRenderer={{
    when: (props) => props.key === 'password',
    render: (props) => (
      <span style={{ color: 'red', fontWeight: 'bold' }}>
        {props.key} (sensitive)
      </span>
    )
  }}
/>
```

### Object Key Sorting

Display object keys alphabetically: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={data}
  objectSortKeys={true}
/>
```

### Type Labels and Metadata

Control display of type information: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={data}
  displayDataTypes={true}  // show "int", "date", etc.
  displaySize={true}       // show item counts
  displayComma={true}      // show trailing commas
/>
```

### Highlight Updates

Automatically highlight changed values: ([Official Documentation - APIs][4])

```jsx
<JsonViewer
  value={data}
  highlightUpdates={true}
/>
```

## Data Type Support

The library natively supports: ([Official Documentation][2])

- **Primitives**: `string`, `number`, `boolean`, `null`, `undefined`
- **Objects**: Plain objects with nested structures
- **Arrays**: Indexed arrays with grouping support
- **Maps**: ES6 Map instances
- **Sets**: ES6 Set instances
- **Dates**: Date objects with locale formatting
- **BigInt**: Large integer values
- **Functions**: Function references (non-editable)

### Type Badges

Visual indicators for data types: ([Official Documentation][2])

- `int` - Integer numbers
- `float` - Floating-point numbers
- `date` - Date objects
- `NULL` - Null values
- Object and array item counts

## Migration Notes

### Version 4.x

Version 4.0.1 represents the latest stable release. ([npm Package][3]) For migration guidance from v3 to v4, see the official migration guide at https://viewer.textea.io/migration/migration-v4.

### Version 3.x

Version 3.x introduced significant API changes from v2. Users upgrading from v2 should review breaking changes.

### Version 1.x

The v1.x branch used different API conventions including the `onEdit` callback pattern rather than `onChange`. ([GitHub Repository v1.x][7])

## Best Practices

### Performance Optimization

1. **Limit inspection depth** for large objects:
   ```jsx
   <JsonViewer value={largeData} defaultInspectDepth={1} />
   ```

2. **Group large arrays** to reduce initial render:
   ```jsx
   <JsonViewer value={data} groupArraysAfterLength={50} />
   ```

3. **Collapse long strings** to prevent layout issues:
   ```jsx
   <JsonViewer value={data} collapseStringsAfterLength={80} />
   ```

### Theming Integration

1. **Use `auto` theme** for system preference matching:
   ```jsx
   <JsonViewer value={data} theme="auto" />
   ```

2. **Coordinate with MUI theme** using `sx` prop:
   ```jsx
   <JsonViewer
     value={data}
     sx={(theme) => ({
       backgroundColor: theme.palette.background.default
     })}
   />
   ```

### Custom Data Types

1. **Match specific patterns** rather than broad types:
   ```jsx
   // Good: specific URL pattern
   is: (value) => typeof value === 'string' && /^https:\/\//.test(value)

   // Avoid: too broad
   is: (value) => typeof value === 'string'
   ```

2. **Reuse built-in types** when extending functionality:
   ```jsx
   Component: stringType.Component
   PostComponent: (props) => <CustomWidget {...props} />
   ```

3. **Provide serialization** for editable custom types:
   ```jsx
   Editor: MyEditor,
   serialize: (value) => value.toString(),
   deserialize: (str) => new MyType(str)
   ```

### Editing Considerations

1. **Validate changes** in `onChange` handler:
   ```jsx
   onChange={(path, oldValue, newValue) => {
     if (isValid(newValue)) {
       updateState(path, newValue)
     } else {
       console.error('Invalid value:', newValue)
     }
   }}
   ```

2. **Use conditional editing** for restricted fields:
   ```jsx
   editable={(path) => !path.includes('readonly')}
   ```

## Troubleshooting

### Material-UI Peer Dependency Issues

Ensure all required peer dependencies are installed: ([npm Package][3])

```bash
npm install @mui/material @emotion/react @emotion/styled
```

### Theme Not Applying

Verify the theme prop is correctly typed:
- Use `"light"`, `"dark"`, or `"auto"` (strings)
- For custom themes, ensure Base16 format with all color keys

### SSR Hydration Mismatches

When using server-side rendering, ensure consistent `theme` prop on server and client. Use `"light"` or `"dark"` explicitly rather than `"auto"` during SSR.

### Large Data Performance

For datasets with thousands of nodes:
1. Reduce `defaultInspectDepth` to 1-2
2. Enable `groupArraysAfterLength` with lower threshold
3. Consider pagination or virtualization for the parent component

## References

[1]: https://github.com/TexteaInc/json-viewer "TexteaInc/json-viewer GitHub Repository"
[2]: https://viewer.textea.io "Official @textea/json-viewer Documentation"
[3]: https://www.npmjs.com/package/@textea/json-viewer "npm Package - @textea/json-viewer"
[4]: https://viewer.textea.io/apis "JsonViewer Component API Reference"
[5]: https://viewer.textea.io/how-to/styling "Styling and Theming Guide"
[6]: https://viewer.textea.io/how-to/data-types "Custom Data Types Guide"
[7]: https://github.com/TexteaInc/json-viewer/tree/v1.x "json-viewer v1.x Documentation"