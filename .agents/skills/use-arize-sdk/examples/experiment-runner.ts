/**
 * Experiment Runner Example
 *
 * Demonstrates running experiments with Phoenix:
 * - Create a dataset
 * - Run a task against each example
 * - Evaluate with custom evaluators
 *
 * Prerequisites:
 *   1. Phoenix running: docker run -p 6006:6006 arizephoenix/phoenix:latest
 *   2. Set OPENAI_API_KEY environment variable
 *
 * Run:
 *   bun run examples/experiment-runner.ts
 */

import { register } from "@arizeai/phoenix-otel";
import {
  createClient,
  runExperiment,
} from "@arizeai/phoenix-client";
import { asEvaluator } from "@arizeai/phoenix-client/experiments";

// Initialize tracing
register({
  projectName: "experiment-runner-example",
  endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "http://localhost:6006/v1/traces",
});

// Import OpenAI after tracing setup
import OpenAI from "openai";

const openai = new OpenAI();
const phoenix = createClient({
  baseUrl: process.env.PHOENIX_HOST ?? "http://localhost:6006",
});

// Sample Q&A dataset
const qaDataset = [
  {
    input: { question: "What is 2 + 2?" },
    expected: { answer: "4", keywords: ["4", "four"] },
  },
  {
    input: { question: "What is the capital of France?" },
    expected: { answer: "Paris", keywords: ["paris"] },
  },
  {
    input: { question: "What color is the sky on a clear day?" },
    expected: { answer: "Blue", keywords: ["blue"] },
  },
  {
    input: { question: "How many days are in a week?" },
    expected: { answer: "7", keywords: ["7", "seven"] },
  },
  {
    input: { question: "What is H2O commonly known as?" },
    expected: { answer: "Water", keywords: ["water"] },
  },
];

// Upload dataset to Phoenix
async function createDataset() {
  console.log("Creating dataset...");

  try {
    const response = await phoenix.POST("/v1/datasets/upload", {
      body: {
        name: "qa-evaluation-dataset",
        description: "Simple Q&A pairs for evaluation testing",
        inputs: qaDataset.map((d) => d.input),
        outputs: qaDataset.map((d) => d.expected),
      },
    });

    if (response.response.ok) {
      console.log("Dataset created successfully");
      return response.data;
    } else {
      console.log("Dataset may already exist, continuing...");
    }
  } catch (error) {
    console.log("Dataset creation error (may already exist):", error);
  }
}

// Task function: Generate answer using LLM
async function answerQuestion(example: {
  input: { question: string };
  expected?: { answer: string; keywords: string[] };
}) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Answer the question concisely in one sentence or less.",
      },
      { role: "user", content: example.input.question },
    ],
    max_tokens: 50,
  });

  return {
    answer: completion.choices[0].message.content ?? "",
    model: "gpt-4o-mini",
    tokens: completion.usage?.total_tokens ?? 0,
  };
}

// Evaluator: Check if answer contains expected keywords
const keywordMatchEvaluator = asEvaluator(
  "keyword-match",
  async ({ output, expected }) => {
    const answer = (output as { answer: string }).answer.toLowerCase();
    const keywords = (expected as { keywords: string[] })?.keywords ?? [];

    if (keywords.length === 0) {
      return { score: 1.0, label: "no_keywords" };
    }

    const matchedKeywords = keywords.filter((k) =>
      answer.includes(k.toLowerCase())
    );
    const score = matchedKeywords.length / keywords.length;

    return {
      score,
      label: score >= 0.5 ? "match" : "no_match",
      explanation: `Matched ${matchedKeywords.length}/${keywords.length} keywords: [${matchedKeywords.join(", ")}]`,
    };
  }
);

// Evaluator: Check answer length
const lengthEvaluator = asEvaluator("response-length", async ({ output }) => {
  const answer = (output as { answer: string }).answer;
  const wordCount = answer.split(/\s+/).length;

  // Ideal: 1-20 words for concise answers
  let score: number;
  let label: string;

  if (wordCount <= 20) {
    score = 1.0;
    label = "concise";
  } else if (wordCount <= 50) {
    score = 0.7;
    label = "moderate";
  } else {
    score = 0.3;
    label = "verbose";
  }

  return {
    score,
    label,
    explanation: `Response has ${wordCount} words`,
  };
});

// Evaluator: Token efficiency
const tokenEfficiencyEvaluator = asEvaluator(
  "token-efficiency",
  async ({ output }) => {
    const tokens = (output as { tokens: number }).tokens;

    // Score based on token usage (lower is better)
    let score: number;
    let label: string;

    if (tokens <= 50) {
      score = 1.0;
      label = "efficient";
    } else if (tokens <= 100) {
      score = 0.7;
      label = "moderate";
    } else {
      score = 0.4;
      label = "expensive";
    }

    return {
      score,
      label,
      explanation: `Used ${tokens} tokens`,
    };
  }
);

async function main() {
  console.log("Experiment Runner Example");
  console.log("=========================\n");

  // Step 1: Create dataset
  await createDataset();

  // Step 2: Run experiment
  console.log("\nRunning experiment...\n");

  try {
    const results = await runExperiment({
      dataset: { name: "qa-evaluation-dataset" },
      experimentName: `qa-eval-${Date.now()}`,
      task: answerQuestion,
      evaluators: [
        keywordMatchEvaluator,
        lengthEvaluator,
        tokenEfficiencyEvaluator,
      ],
    });

    // Step 3: Display results
    console.log("\n=== Experiment Results ===\n");
    console.log(`Experiment ID: ${results.experimentId}`);
    console.log(`Examples evaluated: ${results.results.length}\n`);

    // Calculate aggregate scores
    const aggregates: Record<string, { sum: number; count: number }> = {};

    for (const result of results.results) {
      console.log(`Question: ${(result as unknown as { input: { question: string } }).input?.question}`);
      console.log(`Answer: ${(result.output as { answer: string })?.answer}`);
      console.log("Evaluations:");

      for (const [evalName, evaluation] of Object.entries(result.evaluations)) {
        console.log(`  - ${evalName}: ${evaluation.score.toFixed(2)} (${evaluation.label})`);

        if (!aggregates[evalName]) {
          aggregates[evalName] = { sum: 0, count: 0 };
        }
        aggregates[evalName].sum += evaluation.score;
        aggregates[evalName].count += 1;
      }
      console.log();
    }

    // Print aggregate scores
    console.log("=== Aggregate Scores ===\n");
    for (const [evalName, agg] of Object.entries(aggregates)) {
      const avgScore = agg.sum / agg.count;
      console.log(`${evalName}: ${(avgScore * 100).toFixed(1)}%`);
    }
  } catch (error) {
    console.error("Experiment failed:", error);

    // Fallback: Run without Phoenix experiment framework
    console.log("\nFalling back to manual evaluation...\n");

    for (const example of qaDataset) {
      console.log(`Question: ${example.input.question}`);
      const result = await answerQuestion(example);
      console.log(`Answer: ${result.answer}\n`);
    }
  }

  // Wait for traces to flush
  console.log("\nFlushing traces to Phoenix...");
  await new Promise((r) => setTimeout(r, 2000));

  console.log("\nDone! View results at: http://localhost:6006");
  console.log("- Check the 'Experiments' tab for evaluation results");
  console.log("- Check the 'Traces' tab for individual LLM calls");
}

main().catch(async (error) => {
  console.error("Error:", error);
  process.exit(1);
});
