---
title: "TanStack AI React Version Log"
description: "Version history for @tanstack/ai-react, @tanstack/ai-react-ui, @tanstack/react-ai-devtools"
type: "meta"
tags: ["changelog", "versions", "tanstack", "ai", "react", "hooks", "devtools"]
category: "typescript"
subcategory: "ai"
version: "1.0"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "GitHub Releases"
    url: "https://github.com/TanStack/ai/releases"
  - name: "TanStack AI Alpha Announcement"
    url: "https://tanstack.com/blog/tanstack-ai-alpha-your-ai-your-way"
  - name: "TanStack AI Alpha 2 Announcement"
    url: "https://tanstack.com/blog/tanstack-ai-alpha-2"
related: ["README.md", "ai-react.md", "ai-react-ui.md", "devtools.md"]
author: "unknown"
contributors: []
parent_reference: "./README.md"
current_version: "0.2.0"
---

# TanStack AI React Version Log

**Current versions documented:**
- @tanstack/ai-react: 0.2.0
- @tanstack/ai-react-ui: 0.2.0
- @tanstack/react-ai-devtools: 0.1.1

**Last checked:** 2025-12-23

[Official Release Notes](https://github.com/TanStack/ai/releases)

---

## @tanstack/ai-react

### v0.2.0 (2025-12-22)

Standard Schema / Standard JSON Schema support for TanStack AI. ([GitHub Release][1])

- **New:** Removes Zod constraint for tools and structured outputs
- **New:** Bring your own schema validation library (Valibot, ArkType, etc.)

[Release Notes](https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-react%400.2.0)

### v0.1.x (2025-12-03 - Alpha 1)

Initial alpha release with React hooks. ([Alpha Announcement][2])

- `useChat` hook for chat state management
- Streaming support via SSE and HTTP streams
- Client-side tool execution
- Tool approval workflows
- Re-exports from @tanstack/ai-client

[Alpha 1 Announcement](https://tanstack.com/blog/tanstack-ai-alpha-your-ai-your-way)

---

## @tanstack/ai-react-ui

### v0.2.0 (2025-12-22)

Dependency updates for Standard Schema support. ([GitHub Release][3])

- Updated dependencies: @tanstack/ai-react@0.2.0

[Release Notes](https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-react-ui%400.2.0)

### v0.1.x (Alpha 1)

Initial headless UI components. ([Alpha 2 Announcement][4])

- Chat container component
- ChatMessages component with render props
- ChatMessage component for individual messages
- ChatInput component with form handling
- ToolApproval component for approval workflows
- TextPart and ThinkingPart for message content

---

## @tanstack/react-ai-devtools

### v0.1.1 (2025-12-22)

Patch release with dependency updates. ([GitHub Release][5])

- Updated dependencies: @tanstack/ai-devtools-core@0.1.1

[Release Notes](https://github.com/TanStack/ai/releases/tag/%40tanstack%2Freact-ai-devtools%400.1.1)

### v0.1.0 (Alpha 1)

Initial devtools release. ([Devtools Docs][6])

- AIDevtools floating panel component
- AIDevtoolsPanel standalone component
- Message inspection and debugging
- Stream chunk visualization

---

## References

[1]: https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-react%400.2.0 "ai-react v0.2.0 Release"
[2]: https://tanstack.com/blog/tanstack-ai-alpha-your-ai-your-way "TanStack AI Alpha Announcement"
[3]: https://github.com/TanStack/ai/releases/tag/%40tanstack%2Fai-react-ui%400.2.0 "ai-react-ui v0.2.0 Release"
[4]: https://tanstack.com/blog/tanstack-ai-alpha-2 "TanStack AI Alpha 2 Announcement"
[5]: https://github.com/TanStack/ai/releases/tag/%40tanstack%2Freact-ai-devtools%400.1.1 "react-ai-devtools v0.1.1 Release"
[6]: https://tanstack.com/ai/latest/docs/getting-started/devtools "TanStack AI Devtools Documentation"
