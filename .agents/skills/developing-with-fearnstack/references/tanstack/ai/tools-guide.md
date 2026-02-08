---
title: "TanStack AI Tools Guide"
description: "Type-safe tool definitions with server and client implementations"
type: "concept-guide"
tags: ["tanstack", "ai", "tools", "function-calling", "zod", "typescript", "server", "client"]
category: "typescript"
subcategory: "ai"
version: "0.1"
last_updated: "2025-12-05"
status: "stable"
sources:
  - name: "TanStack AI Tools Guide"
    url: "https://tanstack.com/ai/latest/docs/guides/tools"
  - name: "TanStack AI Overview"
    url: "https://tanstack.com/ai/latest/docs/getting-started/overview"
related: ["overview.md", "adapters.md", "streaming.md", "react-guide.md"]
author: "unknown"
contributors: []
---

# TanStack AI Tools Guide

TanStack AI provides a powerful, type-safe tool system that allows LLMs to interact with external systems. Tools are defined once with schemas, then implemented separately for server or client environments. ([TanStack AI Tools Guide][1])

## Tool Definition Pattern

Tools are defined using `toolDefinition()` from `@tanstack/ai`. The key pattern is to define the schema once, then implement environment-specific logic separately. ([TanStack AI Tools Guide][1])

```typescript
import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

const getWeatherDef = toolDefinition({
  name: "get_weather",
  description: "Get the current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA"),
    unit: z.enum(["celsius", "fahrenheit"]).optional(),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    location: z.string(),
  }),
});
```

### Schema Properties

| Property | Description |
|----------|-------------|
| `name` | Unique identifier for the tool |
| `description` | Human-readable description for the LLM to understand when to use |
| `inputSchema` | Zod schema defining the tool's input parameters |
| `outputSchema` | Zod schema defining the tool's return value |
| `needsApproval` | Optional boolean to require user approval before execution |

## Server-Side Tools

Server implementations handle backend operations like API calls, database access, and sensitive operations. Use `.server()` to create a server-side tool implementation. ([TanStack AI Tools Guide][1])

```typescript
const getWeatherServer = getWeatherDef.server(async ({ location, unit }) => {
  const response = await fetch(
    `https://api.weather.com/v1/current?location=${location}&unit=${unit || "fahrenheit"}`
  );
  return await response.json();
});
```

### Using Server Tools in Chat

Pass server tools to the `chat()` function to enable automatic execution:

```typescript
import { chat } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";

const stream = chat({
  adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
  messages,
  model: "gpt-4o",
  tools: [getWeatherServer],
});
```

When the LLM decides to call the tool, it executes automatically on the server and the result is returned to the model. ([TanStack AI Tools Guide][1])

## Client-Side Tools

Client implementations enable browser-based operations like UI updates, local storage, and user interactions. Use `.client()` to create a client-side tool implementation. ([TanStack AI Tools Guide][1])

```typescript
const updateUIDef = toolDefinition({
  name: "update_ui",
  description: "Update the user interface with a notification",
  inputSchema: z.object({
    message: z.string(),
    type: z.enum(["info", "success", "warning", "error"]),
  }),
  outputSchema: z.object({
    success: z.boolean(),
  }),
});

const updateUI = updateUIDef.client((input) => {
  setNotification(input.message);
  return { success: true };
});
```

### Using Client Tools with useChat

Client tools are registered using `clientTools()` and passed to the chat client options:

```typescript
import { clientTools, createChatClientOptions, fetchServerSentEvents } from "@tanstack/ai-client";

const tools = clientTools(updateUI, saveToStorage);

const chatOptions = createChatClientOptions({
  connection: fetchServerSentEvents("/api/chat"),
  tools,
});
```

## Hybrid Tools

Tools can implement both server and client logic for flexible execution across environments. ([TanStack AI Tools Guide][1])

```typescript
const addToCartDef = toolDefinition({
  name: "add_to_cart",
  description: "Add an item to the shopping cart",
  inputSchema: z.object({
    itemId: z.string(),
    quantity: z.number(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    cartId: z.string(),
  }),
});

// Server: stores in database
const addToCartServer = addToCartDef.server(async (input) => {
  const cart = await db.carts.create({ data: input });
  return { success: true, cartId: cart.id };
});

// Client: updates local storage
const addToCartClient = addToCartDef.client((input) => {
  const wishlist = JSON.parse(localStorage.getItem("wishlist") || "[]");
  wishlist.push(input.itemId);
  localStorage.setItem("wishlist", JSON.stringify(wishlist));
  return { success: true, cartId: "local" };
});
```

## Tool Approval Workflows

For sensitive operations, tools can require user approval before execution. Set `needsApproval: true` in the tool definition. ([TanStack AI Tools Guide][1])

```typescript
const addToCartDef = toolDefinition({
  name: "add_to_cart",
  description: "Add an item to the shopping cart",
  inputSchema: z.object({
    itemId: z.string(),
    quantity: z.number(),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    cartId: z.string(),
  }),
  needsApproval: true,
});
```

### Tool States During Approval

Tools go through these states during the approval workflow: ([TanStack AI Tools Guide][1])

| State | Description |
|-------|-------------|
| `awaiting-input` | Tool call received, waiting for arguments |
| `input-streaming` | Partial arguments arriving |
| `input-complete` | All arguments received |
| `approval-requested` | User consent needed |
| `approval-responded` | User decision recorded |

## Input/Output Schemas with Zod

Zod schemas provide runtime validation and automatic TypeScript type inference. No `as const` needed—types are inferred from schemas. ([TanStack AI Tools Guide][1])

```typescript
const productSearchDef = toolDefinition({
  name: "search_products",
  description: "Search for products in the catalog",
  inputSchema: z.object({
    query: z.string().min(1),
    category: z.enum(["electronics", "clothing", "home"]).optional(),
    maxPrice: z.number().positive().optional(),
    sortBy: z.enum(["price", "rating", "relevance"]).default("relevance"),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
      rating: z.number().min(0).max(5),
      imageUrl: z.string().url(),
    })
  ),
});
```

### Schema Best Practices

1. **Use `.describe()`** to add descriptions that help the LLM understand parameters:
   ```typescript
   z.string().describe("The user's full name")
   ```

2. **Use `.optional()`** for non-required parameters:
   ```typescript
   z.number().optional()
   ```

3. **Use `.default()`** for sensible defaults:
   ```typescript
   z.enum(["asc", "desc"]).default("desc")
   ```

4. **Use refinements** for complex validation:
   ```typescript
   z.string().min(3).max(100)
   ```

## Tool Execution Flow

The tool execution flow in TanStack AI: ([TanStack AI Tools Guide][1])

1. **Model Decision**: LLM decides to invoke a tool based on user input
2. **Tool Identification**: Tool type identified (server or client implementation)
3. **Input Validation**: Input validated against Zod schema
4. **Execution**: Tool executes in appropriate environment
5. **Output Validation**: Result validated against output schema
6. **Result Return**: Result returns to model as tool result message
7. **Continuation**: Model continues response generation using result

## Complete Example

```typescript
import { chat, toolDefinition, toStreamResponse } from "@tanstack/ai";
import { openai } from "@tanstack/ai-openai";
import { z } from "zod";

// Define the tool schema
const getProductsDef = toolDefinition({
  name: "getProducts",
  description: "Search for products matching a query",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().default(10),
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.number(),
    })
  ),
});

// Implement server-side logic
const getProducts = getProductsDef.server(async ({ query, limit }) => {
  const products = await db.products.search({ query, limit });
  return products.map((p) => ({
    id: p.id,
    name: p.name,
    price: p.price,
  }));
});

// Use in API endpoint
export async function POST(request: Request) {
  const { messages } = await request.json();

  const stream = chat({
    adapter: openai({ apiKey: process.env.OPENAI_API_KEY! }),
    model: "gpt-4o",
    messages,
    tools: [getProducts],
  });

  return toStreamResponse(stream);
}
```

## Links

[1]: https://tanstack.com/ai/latest/docs/guides/tools "TanStack AI Tools Guide"
[2]: https://tanstack.com/ai/latest/docs/getting-started/overview "TanStack AI Overview"
