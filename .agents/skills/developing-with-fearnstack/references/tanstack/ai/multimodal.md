---
title: "TanStack AI Multimodal Content"
description: "Support for images, audio, video, and documents across providers"
type: "concept-guide"
tags: ["tanstack", "ai", "multimodal", "images", "audio", "video", "documents", "vision"]
category: "typescript"
subcategory: "ai"
version: "0.1"
last_updated: "2025-12-05"
status: "stable"
sources:
  - name: "TanStack AI Multimodal Content"
    url: "https://tanstack.com/ai/latest/docs/guides/multimodal-content"
  - name: "TanStack AI Overview"
    url: "https://tanstack.com/ai/latest/docs/getting-started/overview"
related: ["overview.md", "adapters.md", "react-guide.md"]
author: "unknown"
contributors: []
---

# TanStack AI Multimodal Content

TanStack AI supports multimodal content including text, images, audio, video, and documents. Support varies by provider and model. ([TanStack AI Multimodal Content][1])

## Content Part Types

TanStack AI supports these modalities: ([TanStack AI Multimodal Content][1])

| Type | Description |
|------|-------------|
| Text | Plain text messages |
| Images | JPEG, PNG, GIF, WebP formats |
| Audio | Audio files (model-dependent) |
| Video | Video files (model-dependent) |
| Documents | PDFs and other document types |

## MessagePart Types

Messages can contain multiple parts with different content types: ([TanStack AI Multimodal Content][1])

```typescript
type MessagePart =
  | TextPart
  | ImagePart
  | AudioPart
  | VideoPart
  | DocumentPart
  | ToolCallPart
  | ToolResultPart
  | ThinkingPart;
```

### TextPart

```typescript
interface TextPart {
  type: "text";
  text: string;
}
```

### ImagePart

```typescript
interface ImagePart {
  type: "image";
  source: {
    type: "data" | "url";
    value: string; // base64 data or URL
  };
  metadata?: {
    detail?: "auto" | "low" | "high"; // OpenAI-specific
  };
}
```

### AudioPart

```typescript
interface AudioPart {
  type: "audio";
  source: {
    type: "data" | "url";
    value: string;
  };
}
```

### VideoPart

```typescript
interface VideoPart {
  type: "video";
  source: {
    type: "data" | "url";
    value: string;
  };
}
```

### DocumentPart

```typescript
interface DocumentPart {
  type: "document";
  source: {
    type: "data" | "url";
    value: string;
  };
}
```

## Sending Images

Images can be provided as base64-encoded data or URLs: ([TanStack AI Multimodal Content][1])

### Base64 Image

```typescript
import { chat } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

const imageBase64 = await readFileAsBase64("image.png");

const stream = chat({
  adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What's in this image?" },
        {
          type: "image",
          source: { type: "data", value: imageBase64 },
        },
      ],
    },
  ],
});
```

### URL-Based Image

```typescript
const stream = chat({
  adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
  model: "gpt-4o",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Describe this image" },
        {
          type: "image",
          source: { type: "url", value: "https://example.com/image.jpg" },
        },
      ],
    },
  ],
});
```

### Image Detail Level (OpenAI)

OpenAI supports controlling image analysis detail: ([TanStack AI Multimodal Content][1])

```typescript
{
  type: "image",
  source: { type: "url", value: "https://example.com/image.jpg" },
  metadata: { detail: "high" }, // "auto", "low", or "high"
}
```

## Sending Documents

Anthropic's Claude models support PDF documents: ([TanStack AI Multimodal Content][1])

```typescript
import { chat } from "@tanstack/ai";
import { anthropic } from "@tanstack/ai-anthropic";

const pdfBase64 = await readFileAsBase64("document.pdf");

const stream = chat({
  adapter: anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! }),
  model: "claude-3-5-sonnet-20241022",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Summarize this document" },
        {
          type: "document",
          source: { type: "data", value: pdfBase64 },
        },
      ],
    },
  ],
});
```

## Sending Audio

Audio support varies by provider. OpenAI's `gpt-4o-audio-preview` model supports audio alongside text and images: ([TanStack AI Multimodal Content][1])

```typescript
import { chat } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

const audioBase64 = await readFileAsBase64("audio.mp3");

const stream = chat({
  adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
  model: "gpt-4o-audio-preview",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "Transcribe this audio" },
        {
          type: "audio",
          source: { type: "data", value: audioBase64 },
        },
      ],
    },
  ],
});
```

## Sending Video

Google Gemini models support video content: ([TanStack AI Multimodal Content][1])

```typescript
import { chat } from "@tanstack/ai";
import { gemini } from "@tanstack/ai-gemini";

const stream = chat({
  adapter: gemini({ apiKey: process.env.GEMINI_API_KEY! }),
  model: "gemini-pro-vision",
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "What happens in this video?" },
        {
          type: "video",
          source: { type: "url", value: "https://example.com/video.mp4" },
        },
      ],
    },
  ],
});
```

## Provider Support Matrix

| Provider | Text | Image | Audio | Video | Document |
|----------|------|-------|-------|-------|----------|
| OpenAI | Yes | Yes | Preview | No | No |
| Anthropic | Yes | Yes | No | No | Yes (PDF) |
| Google Gemini | Yes | Yes | Yes | Yes | Yes |
| Ollama | Yes | Model-dependent | No | No | No |

([TanStack AI Multimodal Content][1])

## React Integration

Handle multimodal content in React components:

### File Upload Component

```typescript
import { useChat } from "@tanstack/ai-react";
import { fetchServerSentEvents } from "@tanstack/ai-client";
import { useState, useRef } from "react";

function MultimodalChat() {
  const [attachments, setAttachments] = useState<MessagePart[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { messages, input, setInput, submit } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const base64 = await fileToBase64(file);
    const type = file.type.startsWith("image/") ? "image" : "document";

    setAttachments([
      ...attachments,
      {
        type,
        source: { type: "data", value: base64 },
      },
    ]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const content: MessagePart[] = [
      { type: "text", text: input },
      ...attachments,
    ];

    // Submit with multimodal content
    submit({ content });
    setAttachments([]);
    setInput("");
  };

  return (
    <div>
      <div className="messages">
        {messages.map((message) => (
          <MessageDisplay key={message.id} message={message} />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="attachments">
          {attachments.map((att, i) => (
            <div key={i} className="attachment-preview">
              {att.type === "image" && (
                <img src={`data:image/png;base64,${att.source.value}`} alt="" />
              )}
              {att.type === "document" && <span>PDF attached</span>}
              <button onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} />
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="image/*,.pdf"
          hidden
        />
        <button type="button" onClick={() => fileInputRef.current?.click()}>
          Attach
        </button>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

### Rendering Multimodal Messages

```typescript
function MessageDisplay({ message }: { message: Message }) {
  if (typeof message.content === "string") {
    return <div>{message.content}</div>;
  }

  return (
    <div className="message">
      {message.content.map((part, index) => {
        switch (part.type) {
          case "text":
            return <p key={index}>{part.text}</p>;

          case "image":
            const src =
              part.source.type === "url"
                ? part.source.value
                : `data:image/png;base64,${part.source.value}`;
            return <img key={index} src={src} alt="" className="message-image" />;

          case "document":
            return (
              <div key={index} className="document-indicator">
                PDF Document
              </div>
            );

          case "audio":
            return (
              <audio key={index} controls>
                <source
                  src={
                    part.source.type === "url"
                      ? part.source.value
                      : `data:audio/mp3;base64,${part.source.value}`
                  }
                />
              </audio>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
```

## Server-Side Handling

Handle multimodal messages on the server:

```typescript
// app/api/chat/route.ts
import { chat, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

export async function POST(request: Request) {
  const { messages } = await request.json();

  // Messages may contain multimodal content
  // TanStack AI handles the conversion to provider format

  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
    model: "gpt-4o",
    messages,
  });

  return toStreamResponse(stream);
}
```

## Best Practices

1. **Check provider support**: Verify the provider and model support your content type

2. **Optimize image size**: Compress images before sending to reduce latency and costs

3. **Handle errors**: Not all models support all content types—handle gracefully

4. **Use URLs when possible**: URL-based content is often faster than base64

5. **Set appropriate detail levels**: For OpenAI, use "low" for thumbnails, "high" for detailed analysis

6. **Validate file types**: Check MIME types before processing

## Links

[1]: https://tanstack.com/ai/latest/docs/guides/multimodal-content "TanStack AI Multimodal Content"
[2]: https://tanstack.com/ai/latest/docs/getting-started/overview "TanStack AI Overview"
