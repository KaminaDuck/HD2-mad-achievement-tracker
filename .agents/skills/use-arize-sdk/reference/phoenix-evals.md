# @arizeai/phoenix-evals

TypeScript evaluation library for LLM applications. Run evaluations as part of experiments or standalone.

## Features

- **Vendor Agnostic** — Works with any AI SDK provider
- **Pre-built Evaluators** — Hallucination, relevance, and more
- **Custom Classifiers** — Create evaluators with custom prompts
- **Experiment Integration** — Works with `@arizeai/phoenix-client`

## Installation

```bash
npm install @arizeai/phoenix-evals
# or
bun add @arizeai/phoenix-evals
```

## Quick Start

```typescript
import { Evals } from "@arizeai/phoenix-evals";
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();

const evals = new Evals({
  client: phoenix,
  model: "gpt-4o",
});

// Run evaluation on traces
const results = await evals.evaluate({
  projectName: "my-project",
  evaluators: ["relevance", "coherence"],
});
```

## Pre-built Evaluators

### Hallucination Detection

Detects when LLM outputs contain information not grounded in the context.

```typescript
import { Evals } from "@arizeai/phoenix-evals";

const evals = new Evals({ model: "gpt-4o" });

const result = await evals.hallucination({
  input: "What is the capital of France?",
  output: "The capital of France is Paris, which has a population of 12 million.",
  context: "Paris is the capital city of France.",
});

console.log(result.label); // "hallucination" or "factual"
console.log(result.score); // 0.0 to 1.0
console.log(result.explanation);
```

### Relevance

Measures how relevant the response is to the input query.

```typescript
const result = await evals.relevance({
  input: "How do I reset my password?",
  output: "To reset your password, click on 'Forgot Password' on the login page.",
});

console.log(result.label); // "relevant" or "irrelevant"
console.log(result.score);
```

### QA Correctness

Evaluates if the answer correctly addresses the question.

```typescript
const result = await evals.qaCorrectness({
  input: "What year was Python created?",
  output: "Python was created in 1991.",
  reference: "Python was first released in 1991 by Guido van Rossum.",
});

console.log(result.label); // "correct" or "incorrect"
```

### Toxicity

Detects toxic, harmful, or inappropriate content.

```typescript
const result = await evals.toxicity({
  output: "Here's a helpful response to your question...",
});

console.log(result.label); // "toxic" or "non_toxic"
```

## Custom Evaluators

### Template-based Evaluator

```typescript
import { Evals } from "@arizeai/phoenix-evals";

const evals = new Evals({ model: "gpt-4o" });

const customEval = evals.createEvaluator({
  name: "helpfulness",
  template: `
    You are evaluating the helpfulness of an AI assistant's response.

    User Question: {input}
    Assistant Response: {output}

    Rate the helpfulness on a scale of 0-10 where:
    - 0-3: Not helpful, doesn't address the question
    - 4-6: Partially helpful, addresses some aspects
    - 7-10: Very helpful, fully addresses the question

    Provide your rating as a JSON object:
    {"score": <0-10>, "label": "<helpful|partially_helpful|not_helpful>", "explanation": "<reason>"}
  `,
  parseResponse: (response) => {
    const parsed = JSON.parse(response);
    return {
      score: parsed.score / 10, // Normalize to 0-1
      label: parsed.label,
      explanation: parsed.explanation,
    };
  },
});

const result = await customEval({
  input: "How do I learn Python?",
  output: "Start with the official Python tutorial at python.org",
});
```

### Code-based Evaluator

```typescript
const lengthEvaluator = {
  name: "response-length",
  evaluate: async ({ output }) => {
    const wordCount = output.split(/\s+/).length;
    const score = Math.min(wordCount / 100, 1.0); // Normalize

    return {
      score,
      label: wordCount > 50 ? "sufficient" : "too_short",
      explanation: `Response contains ${wordCount} words`,
    };
  },
};
```

### JSON Validation Evaluator

```typescript
const jsonEvaluator = {
  name: "valid-json",
  evaluate: async ({ output }) => {
    try {
      JSON.parse(output);
      return {
        score: 1.0,
        label: "valid",
        explanation: "Output is valid JSON",
      };
    } catch (e) {
      return {
        score: 0.0,
        label: "invalid",
        explanation: `Invalid JSON: ${e.message}`,
      };
    }
  },
};
```

## Batch Evaluation

### Evaluate Traces

```typescript
import { Evals } from "@arizeai/phoenix-evals";
import { createClient } from "@arizeai/phoenix-client";

const phoenix = createClient();
const evals = new Evals({ client: phoenix, model: "gpt-4o" });

// Evaluate all traces in a project
const results = await evals.evaluateTraces({
  projectName: "my-project",
  evaluators: ["relevance", "hallucination"],
  limit: 100,
});

console.log(`Evaluated ${results.length} traces`);
```

### Evaluate Dataset

```typescript
import { runExperiment } from "@arizeai/phoenix-client";
import { asEvaluator } from "@arizeai/phoenix-client/experiments";
import { Evals } from "@arizeai/phoenix-evals";

const evals = new Evals({ model: "gpt-4o" });

const results = await runExperiment({
  dataset: { name: "qa-dataset" },
  task: async (example) => {
    const response = await llm.generate(example.input.question);
    return { response };
  },
  evaluators: [
    asEvaluator("relevance", async (params) => {
      return evals.relevance({
        input: params.input.question,
        output: params.output.response,
      });
    }),
  ],
});
```

## Configuration Options

### Model Selection

```typescript
const evals = new Evals({
  model: "gpt-4o",        // Default model
  // or
  model: "claude-sonnet-4-20250514",
  // or
  model: "gpt-4o-mini",   // For cost optimization
});
```

### Custom Model Provider

```typescript
const evals = new Evals({
  modelProvider: async (prompt) => {
    // Use your own LLM call
    const response = await myLLM.generate(prompt);
    return response.text;
  },
});
```

## Evaluation Results

### Result Structure

```typescript
interface EvaluationResult {
  score: number;      // 0.0 to 1.0
  label: string;      // Classification label
  explanation?: string; // Optional explanation
  metadata?: Record<string, unknown>; // Additional data
}
```

### Aggregating Results

```typescript
const results = await evals.evaluateTraces({
  projectName: "my-project",
  evaluators: ["relevance"],
});

// Calculate aggregate metrics
const scores = results.map(r => r.score);
const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

const labels = results.map(r => r.label);
const relevantCount = labels.filter(l => l === "relevant").length;
const relevanceRate = relevantCount / labels.length;

console.log(`Average relevance score: ${avgScore.toFixed(2)}`);
console.log(`Relevance rate: ${(relevanceRate * 100).toFixed(1)}%`);
```

## Best Practices

### 1. Choose Appropriate Evaluators

```typescript
// For RAG applications
const ragEvaluators = ["relevance", "hallucination", "qa_correctness"];

// For chatbots
const chatEvaluators = ["relevance", "toxicity", "helpfulness"];

// For code generation
const codeEvaluators = ["correctness", "syntax_valid", "test_pass"];
```

### 2. Use Reference Data When Available

```typescript
// With reference (more accurate)
const result = await evals.qaCorrectness({
  input: "What is 2+2?",
  output: "The answer is 4.",
  reference: "2+2 equals 4",
});

// Without reference (LLM judgment only)
const result = await evals.relevance({
  input: "What is 2+2?",
  output: "The answer is 4.",
});
```

### 3. Handle Evaluation Errors

```typescript
try {
  const result = await evals.relevance({ input, output });
  console.log(result);
} catch (error) {
  console.error("Evaluation failed:", error);
  // Log or handle gracefully
}
```
