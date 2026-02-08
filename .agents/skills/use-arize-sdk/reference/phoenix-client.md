# @arizeai/phoenix-client

TypeScript client for the Phoenix REST API with full auto-completion support.

## Features

- **Prompts** — Create, version, retrieve templates
- **Datasets** — Create and manage evaluation datasets
- **Experiments** — Run evaluations with automatic tracing
- **REST API** — Full access to all Phoenix endpoints
- **SDK Helpers** — Convert prompts to OpenAI, Anthropic, Vercel AI formats

## Installation

```bash
npm install @arizeai/phoenix-client
# or
bun add @arizeai/phoenix-client
```

## Quick Start

```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient({
  baseUrl: process.env.PHOENIX_HOST ?? "http://localhost:6006",
});

// Check health
const health = await phoenix.GET("/v1/health");
console.log(health.data);
```

## Configuration

### Environment Variables

```bash
PHOENIX_HOST=http://localhost:6006
PHOENIX_API_KEY=your-api-key
PHOENIX_CLIENT_HEADERS='{"X-Custom": "header"}'
```

### Client Options

```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient({
  baseUrl: "https://app.phoenix.arize.com",
  headers: {
    Authorization: `Bearer ${process.env.PHOENIX_API_KEY}`,
  },
});
```

## Prompts

### Get a Prompt

```typescript
import { getPrompt } from "@arizeai/phoenix-client";

const prompt = await getPrompt({
  name: "my-prompt",
  version: "latest", // or specific version ID
});

console.log(prompt.template);
console.log(prompt.variables);
```

### Convert to SDK Format

```typescript
import { getPrompt } from "@arizeai/phoenix-client";
import { toSDK } from "@arizeai/phoenix-client/prompts";
import Anthropic from "@anthropic-ai/sdk";

// Get prompt
const prompt = await getPrompt({ name: "my-prompt" });

// Convert to Anthropic format
const anthropicParams = toSDK({
  library: "anthropic",
  prompt,
  variables: { topic: "AI", style: "concise" },
});

// Use with Anthropic SDK
const client = new Anthropic();
const response = await client.messages.create(anthropicParams);
```

### Supported SDK Formats

```typescript
import { toSDK } from "@arizeai/phoenix-client/prompts";

// OpenAI format
const openaiParams = toSDK({
  library: "openai",
  prompt,
  variables: { ... },
});

// Anthropic format
const anthropicParams = toSDK({
  library: "anthropic",
  prompt,
  variables: { ... },
});

// Vercel AI SDK format
const vercelParams = toSDK({
  library: "vercel-ai",
  prompt,
  variables: { ... },
});
```

## Datasets

### Get a Dataset

```typescript
import { getDataset } from "@arizeai/phoenix-client";

const dataset = await getDataset({ name: "my-dataset" });

// Iterate through examples
for await (const example of dataset.examples) {
  console.log(example.input);
  console.log(example.output);
}
```

### Upload a Dataset

```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();

await phoenix.POST("/v1/datasets/upload", {
  body: {
    name: "new-dataset",
    description: "My evaluation dataset",
    inputs: [
      { query: "What is AI?" },
      { query: "Explain machine learning" },
    ],
    outputs: [
      { response: "AI is..." },
      { response: "Machine learning is..." },
    ],
  },
});
```

### List Datasets

```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();
const response = await phoenix.GET("/v1/datasets");

for (const dataset of response.data.data) {
  console.log(`${dataset.name}: ${dataset.example_count} examples`);
}
```

## Experiments

### Run an Experiment

```typescript
import { runExperiment } from "@arizeai/phoenix-client";
import { asEvaluator } from "@arizeai/phoenix-client/experiments";

const results = await runExperiment({
  dataset: { name: "qa-dataset" },
  experimentName: "gpt4-evaluation-v1",

  // Task function processes each example
  task: async (example) => {
    const response = await llm.generate(example.input.question);
    return { response };
  },

  // Evaluators score the outputs
  evaluators: [
    asEvaluator("relevance", async ({ input, output, expected }) => {
      const score = await scoreRelevance(input.question, output.response);
      return {
        score,
        label: score > 0.8 ? "relevant" : "not_relevant",
      };
    }),
    asEvaluator("correctness", async ({ output, expected }) => {
      const isCorrect = output.response.includes(expected.answer);
      return {
        score: isCorrect ? 1.0 : 0.0,
        label: isCorrect ? "correct" : "incorrect",
      };
    }),
  ],
});

console.log(`Experiment ID: ${results.experimentId}`);
console.log(`Results: ${results.results.length} examples evaluated`);
```

### Get Experiment Results

```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();

const response = await phoenix.GET("/v1/experiments/{experiment_id}", {
  params: { path: { experiment_id: "exp-123" } },
});

console.log(response.data);
```

## REST API

### Direct API Access

```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();

// List projects
const projects = await phoenix.GET("/v1/projects");

// Get specific project
const project = await phoenix.GET("/v1/projects/{project_name}", {
  params: { path: { project_name: "my-project" } },
});

// Get traces
const traces = await phoenix.GET("/v1/traces", {
  params: {
    query: {
      project_name: "my-project",
      limit: 20,
    },
  },
});

// Get spans for a trace
const spans = await phoenix.GET("/v1/traces/{trace_id}/spans", {
  params: { path: { trace_id: "abc123" } },
});
```

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/health` | Health check |
| GET | `/v1/projects` | List projects |
| GET | `/v1/projects/{name}` | Get project |
| GET | `/v1/traces` | List traces |
| GET | `/v1/traces/{id}/spans` | Get spans |
| GET | `/v1/datasets` | List datasets |
| POST | `/v1/datasets/upload` | Upload dataset |
| GET | `/v1/prompts` | List prompts |
| GET | `/v1/prompts/{name}` | Get prompt |
| GET | `/v1/experiments` | List experiments |
| POST | `/v1/experiments` | Create experiment |

## Error Handling

```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();

try {
  const response = await phoenix.GET("/v1/datasets/{name}", {
    params: { path: { name: "non-existent" } },
  });

  if (!response.response.ok) {
    console.error(`Error: ${response.response.status}`);
  }
} catch (error) {
  console.error("Request failed:", error);
}
```

## TypeScript Support

The client provides full TypeScript support with auto-completion:

```typescript
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();

// Full type inference for request and response
const response = await phoenix.POST("/v1/datasets/upload", {
  body: {
    name: "typed-dataset",
    inputs: [{ query: "test" }],
    outputs: [{ response: "test" }],
  },
});

// response.data is fully typed
console.log(response.data.id);
```
