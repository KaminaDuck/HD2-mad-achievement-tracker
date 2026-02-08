---
title: "@tanstack/ai-react-ui Reference"
description: "Headless React components for building AI chat interfaces"
type: "api-reference"
tags: ["tanstack", "ai", "react", "ui", "headless", "components", "chat"]
category: "typescript"
subcategory: "ai"
version: "0.2.0"
last_updated: "2025-12-23"
status: "alpha"
sources:
  - name: "NPM Package"
    url: "https://www.npmjs.com/package/@tanstack/ai-react-ui"
  - name: "GitHub Source"
    url: "https://github.com/TanStack/ai/tree/main/packages/typescript/ai-react-ui/src"
related: ["README.md", "ai-react.md", "devtools.md", "../react-guide.md"]
author: "unknown"
contributors: []
version_log: "./versions.md"
---

# @tanstack/ai-react-ui

Headless React components for building AI chat interfaces. Like Radix for AI chat - fully functional, completely unstyled components using the compound component pattern.

**Current version:** 0.2.0
**Package:** `@tanstack/ai-react-ui`

> **Note:** Official API documentation for `@tanstack/ai-react-ui` is not yet published. All API details below are verified directly from [GitHub source code][1].

## Installation

```bash
npm install @tanstack/ai-react-ui @tanstack/ai-client
```

## Key Features

- **Compound component pattern** - Flexible, composable chat UI building blocks ([chat.tsx][2])
- **Parts-based message rendering** - Text, tool calls, tool results, thinking ([chat-message.tsx][3])
- **Native tool approval workflows** - Built-in support for tool approval UI ([tool-approval.tsx][4])
- **Streaming support** - Real-time message updates
- **Fully customizable** - Render props for complete control
- **Headless design** - Bring your own styles

## Quick Start

```tsx
import { Chat, ChatMessages, ChatInput, ChatMessage } from '@tanstack/ai-react-ui'
import { fetchServerSentEvents } from '@tanstack/ai-client'

function App() {
  return (
    <Chat connection={fetchServerSentEvents('/api/chat')}>
      <ChatMessages>
        {(message) => <ChatMessage message={message} />}
      </ChatMessages>
      <ChatInput />
    </Chat>
  )
}
```

## API Reference

### Chat

The root container component that provides chat context to all child components. ([chat.tsx][2])

```tsx
import { Chat, useChatContext } from '@tanstack/ai-react-ui'

<Chat
  connection={fetchServerSentEvents('/api/chat')}
  initialMessages={[]}
  body={{ model: 'gpt-4o' }}
  onFinish={(message) => console.log('Done:', message)}
>
  {children}
</Chat>
```

#### Props (ChatProps)

Verified from [chat.tsx][2]:

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | **Required.** Child components |
| `connection` | `ConnectionAdapter` | **Required.** Server connection (SSE or HTTP stream) |
| `className` | `string` | CSS class name for root element |
| `initialMessages` | `Array<UIMessage>` | Initial messages to display |
| `id` | `string` | Custom message ID generator |
| `body` | `any` | Additional body data to send with requests |
| `onResponse` | `(response?: Response) => void \| Promise<void>` | Callback when response received |
| `onChunk` | `(chunk: any) => void` | Callback when each chunk arrives |
| `onFinish` | `(message: UIMessage) => void` | Callback when message is complete |
| `onError` | `(error: Error) => void` | Callback when error occurs |
| `tools` | `Record<string, ComponentType<{ input: any; output?: any }>>` | Custom tool components registry |

> **Note:** The `tools` prop is for custom tool *component* rendering, not client-side tool execution. For client tools, use `useChat` from `@tanstack/ai-react` directly.

### useChatContext

Hook to access chat state from any child component. ([chat.tsx][2])

```tsx
import { useChatContext } from '@tanstack/ai-react-ui'

function CustomComponent() {
  const { messages, isLoading, sendMessage, stop, clear } = useChatContext()

  return (
    <div>
      <span>{messages.length} messages</span>
      {isLoading && <button onClick={stop}>Stop</button>}
    </div>
  )
}
```

Returns the full `UseChatReturn` interface from `@tanstack/ai-react`.

### ChatMessages

Container for rendering the message list with auto-scroll support. ([chat-messages.tsx][5])

```tsx
import { ChatMessages } from '@tanstack/ai-react-ui'

<ChatMessages
  className="messages-container"
  autoScroll={true}
  emptyState={<p>No messages yet</p>}
>
  {(message, index) => (
    <div key={message.id} className={message.role}>
      <ChatMessage message={message} />
    </div>
  )}
</ChatMessages>
```

#### Props (ChatMessagesProps)

Verified from [chat-messages.tsx][5]:

| Prop | Type | Description |
|------|------|-------------|
| `children` | `(message: UIMessage, index: number) => ReactNode` | Custom render function for each message |
| `className` | `string` | CSS class name |
| `emptyState` | `ReactNode` | Element to show when no messages |
| `loadingState` | `ReactNode` | Element to show while loading first message |
| `errorState` | `(props: { error: Error; reload: () => void }) => ReactNode` | Custom error renderer |
| `autoScroll` | `boolean` | Auto-scroll to bottom on new messages (default: `true`) |

### ChatMessage

Renders an individual message with automatic handling of parts (text, thinking, tool-call, tool-result). ([chat-message.tsx][3])

```tsx
import { ChatMessage } from '@tanstack/ai-react-ui'

<ChatMessage
  message={message}
  className="flex"
  userClassName="justify-end"
  assistantClassName="justify-start"
  toolsRenderer={{
    recommendGuitar: ({ id, arguments: args }) => <GuitarCard {...JSON.parse(args)} />,
    weatherLookup: ({ id, arguments: args }) => <WeatherWidget {...JSON.parse(args)} />,
  }}
  defaultToolRenderer={() => null}
/>
```

#### Props (ChatMessageProps)

Verified from [chat-message.tsx][3]:

| Prop | Type | Description |
|------|------|-------------|
| `message` | `UIMessage` | **Required.** Message to render |
| `className` | `string` | Base CSS class name |
| `userClassName` | `string` | Additional className for user messages |
| `assistantClassName` | `string` | Additional className for assistant messages |
| `textPartRenderer` | `(props: { content: string }) => ReactNode` | Custom renderer for text parts |
| `thinkingPartRenderer` | `(props: { content: string; isComplete?: boolean }) => ReactNode` | Custom renderer for thinking parts |
| `toolsRenderer` | `Record<string, (props: ToolCallRenderProps) => ReactNode>` | Named tool renderers by tool name |
| `defaultToolRenderer` | `(props: ToolCallRenderProps) => ReactNode` | Default tool renderer when tool name not in `toolsRenderer` |
| `toolResultRenderer` | `(props: { toolCallId: string; content: string; state: string }) => ReactNode` | Custom renderer for tool results |

#### ToolCallRenderProps

```typescript
interface ToolCallRenderProps {
  id: string
  name: string
  arguments: string    // JSON string
  state: string        // ToolCallState
  approval?: any       // Approval metadata
  output?: any         // Tool execution output
}
```

### ChatInput

Input component with built-in form handling. ([chat-input.tsx][6])

```tsx
import { ChatInput } from '@tanstack/ai-react-ui'

// Default rendering
<ChatInput placeholder="Type a message..." />

// Custom rendering with render props
<ChatInput>
  {({ value, onChange, onSubmit, isLoading, disabled }) => (
    <div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message..."
      />
      <button onClick={onSubmit} disabled={disabled || !value.trim()}>
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </div>
  )}
</ChatInput>
```

#### Props (ChatInputProps)

Verified from [chat-input.tsx][6]:

| Prop | Type | Description |
|------|------|-------------|
| `children` | `(props: ChatInputRenderProps) => ReactNode` | Render prop for custom input |
| `className` | `string` | CSS class |
| `placeholder` | `string` | Input placeholder text (default: `'Type a message...'`) |
| `disabled` | `boolean` | Disable input |
| `submitOnEnter` | `boolean` | Submit on Enter key (default: `true`) |

#### ChatInputRenderProps

Verified from [chat-input.tsx][6]:

```typescript
interface ChatInputRenderProps {
  value: string                                           // Current input value
  onChange: (value: string) => void                       // Set input value
  onSubmit: () => void                                    // Submit the message
  isLoading: boolean                                      // Is chat currently loading
  disabled: boolean                                       // Is input disabled
  inputRef: RefObject<HTMLInputElement | HTMLTextAreaElement | null>  // Ref to input element
}
```

### ToolApproval

Component for handling tool approval workflows. ([tool-approval.tsx][4])

```tsx
import { ToolApproval } from '@tanstack/ai-react-ui'

// Usage within a tool-call part that has approval metadata
{part.approval && (
  <ToolApproval
    toolCallId={part.id}
    toolName={part.name}
    input={JSON.parse(part.arguments)}
    approval={part.approval}
  >
    {({ toolName, input, onApprove, onDeny, hasResponded, approved }) => (
      <div className="approval-dialog">
        <p>Allow {toolName}?</p>
        <pre>{JSON.stringify(input, null, 2)}</pre>
        {!hasResponded && (
          <>
            <button onClick={onApprove}>Approve</button>
            <button onClick={onDeny}>Reject</button>
          </>
        )}
        {hasResponded && <span>{approved ? '✓ Approved' : '✗ Denied'}</span>}
      </div>
    )}
  </ToolApproval>
)}
```

#### Props (ToolApprovalProps)

Verified from [tool-approval.tsx][4]:

| Prop | Type | Description |
|------|------|-------------|
| `toolCallId` | `string` | **Required.** Tool call ID |
| `toolName` | `string` | **Required.** Tool name |
| `input` | `any` | **Required.** Parsed tool arguments/input |
| `approval` | `{ id: string; needsApproval: boolean; approved?: boolean }` | **Required.** Approval metadata |
| `className` | `string` | CSS class |
| `children` | `(props: ToolApprovalRenderProps) => ReactNode` | Custom render prop |

#### ToolApprovalRenderProps

```typescript
interface ToolApprovalRenderProps {
  toolName: string              // Tool name
  input: any                    // Parsed input
  onApprove: () => void         // Approve the tool call
  onDeny: () => void            // Deny the tool call
  hasResponded: boolean         // Whether user has responded
  approved?: boolean            // User's decision (if responded)
}
```

### TextPart

Renders text content with markdown support. ([text-part.tsx][7])

```tsx
import { TextPart } from '@tanstack/ai-react-ui'

<TextPart
  content="Hello **world**!"
  role="assistant"
  className="p-4 rounded"
  userClassName="bg-blue-500"
  assistantClassName="bg-gray-500"
/>
```

#### Props (TextPartProps)

Verified from [text-part.tsx][7]:

| Prop | Type | Description |
|------|------|-------------|
| `content` | `string` | **Required.** Text content to render |
| `role` | `'user' \| 'assistant' \| 'system'` | Message role for styling |
| `className` | `string` | Base CSS class |
| `userClassName` | `string` | Additional className for user messages |
| `assistantClassName` | `string` | Additional className for assistant messages |

Features: Full markdown support with GFM (tables, strikethrough), syntax highlighting for code blocks, sanitized HTML rendering.

### ThinkingPart

Renders thinking/reasoning content with auto-collapse behavior. ([thinking-part.tsx][8])

```tsx
import { ThinkingPart } from '@tanstack/ai-react-ui'

<ThinkingPart
  content="Let me think about this step by step..."
  isComplete={true}
  className="p-4 rounded bg-gray-100"
/>
```

#### Props (ThinkingPartProps)

Verified from [thinking-part.tsx][8]:

| Prop | Type | Description |
|------|------|-------------|
| `content` | `string` | **Required.** Thinking content |
| `className` | `string` | CSS class |
| `isComplete` | `boolean` | Whether thinking is complete (auto-collapses when true, default: `false`) |

## Complete Example

```tsx
import {
  Chat,
  ChatMessages,
  ChatMessage,
  ChatInput,
  ToolApproval,
  useChatContext,
} from '@tanstack/ai-react-ui'
import { fetchServerSentEvents } from '@tanstack/ai-client'

function ChatApp() {
  return (
    <Chat connection={fetchServerSentEvents('/api/chat')}>
      <div className="chat-container">
        <Header />
        <MessageList />
        <InputArea />
      </div>
    </Chat>
  )
}

function Header() {
  const { clear, isLoading, stop } = useChatContext()

  return (
    <header>
      <h1>AI Chat</h1>
      {isLoading && <button onClick={stop}>Stop</button>}
      <button onClick={clear}>New Chat</button>
    </header>
  )
}

function MessageList() {
  return (
    <ChatMessages
      className="messages"
      emptyState={<p>Start a conversation...</p>}
      errorState={({ error, reload }) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={reload}>Retry</button>
        </div>
      )}
    >
      {(message) => (
        <div key={message.id} className={`message ${message.role}`}>
          <ChatMessage
            message={message}
            toolsRenderer={{
              delete_item: (props) => {
                if (props.approval && props.approval.approved === undefined) {
                  return (
                    <ToolApproval
                      toolCallId={props.id}
                      toolName={props.name}
                      input={JSON.parse(props.arguments)}
                      approval={props.approval}
                    >
                      {({ onApprove, onDeny }) => (
                        <div className="approval">
                          <p>Allow delete?</p>
                          <button onClick={onApprove}>Yes</button>
                          <button onClick={onDeny}>No</button>
                        </div>
                      )}
                    </ToolApproval>
                  )
                }
                return <div>Deleting...</div>
              },
            }}
          />
        </div>
      )}
    </ChatMessages>
  )
}

function InputArea() {
  return (
    <ChatInput>
      {({ value, onChange, onSubmit, isLoading, disabled }) => (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="input-form"
        >
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type a message..."
            disabled={disabled}
          />
          <button type="submit" disabled={disabled || !value.trim()}>
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      )}
    </ChatInput>
  )
}
```

## Peer Dependencies

- `react` >= 18.0.0
- `@tanstack/ai-react` >= 0.2.0
- `@tanstack/ai-client` >= 0.2.0

## Related

- [@tanstack/ai-react](ai-react.md) - Core React hooks
- [@tanstack/react-ai-devtools](devtools.md) - Development tools
- [React Guide](../react-guide.md) - Complete integration guide

## References

[1]: https://github.com/TanStack/ai/tree/main/packages/typescript/ai-react-ui/src "ai-react-ui GitHub source"
[2]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react-ui/src/chat.tsx "chat.tsx source"
[3]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react-ui/src/chat-message.tsx "chat-message.tsx source"
[4]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react-ui/src/tool-approval.tsx "tool-approval.tsx source"
[5]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react-ui/src/chat-messages.tsx "chat-messages.tsx source"
[6]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react-ui/src/chat-input.tsx "chat-input.tsx source"
[7]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react-ui/src/text-part.tsx "text-part.tsx source"
[8]: https://github.com/TanStack/ai/blob/main/packages/typescript/ai-react-ui/src/thinking-part.tsx "thinking-part.tsx source"
