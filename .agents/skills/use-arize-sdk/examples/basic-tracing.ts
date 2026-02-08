/**
 * Basic Tracing Example
 *
 * Demonstrates minimal Phoenix tracing setup with OpenAI.
 *
 * Prerequisites:
 *   1. Phoenix running: docker run -p 6006:6006 arizephoenix/phoenix:latest
 *   2. Set OPENAI_API_KEY environment variable
 *
 * Run:
 *   bun run examples/basic-tracing.ts
 */

// IMPORTANT: Initialize tracing BEFORE importing LLM libraries
import { register } from "@arizeai/phoenix-otel";

// Register OpenTelemetry with Phoenix
register({
  projectName: "basic-tracing-example",
  endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "http://localhost:6006/v1/traces",
});

console.log("Phoenix tracing initialized");

// Now import LLM libraries (after register)
import OpenAI from "openai";

const openai = new OpenAI();

async function main() {
  console.log("\nSending request to OpenAI...\n");

  // This call is automatically traced
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are a helpful assistant." },
      { role: "user", content: "What is the capital of France? Answer in one sentence." },
    ],
    max_tokens: 50,
  });

  console.log("Response:", completion.choices[0].message.content);
  console.log("\nTokens used:", {
    prompt: completion.usage?.prompt_tokens,
    completion: completion.usage?.completion_tokens,
    total: completion.usage?.total_tokens,
  });

  // Make another request to show multiple traces
  console.log("\nSending second request...\n");

  const completion2 = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "user", content: "What is 2 + 2? Answer with just the number." },
    ],
    max_tokens: 10,
  });

  console.log("Response:", completion2.choices[0].message.content);

  // Wait for traces to flush (batch processor sends periodically)
  console.log("\nFlushing traces to Phoenix...");
  await new Promise((r) => setTimeout(r, 2000));

  console.log("\nDone! View traces at: http://localhost:6006");
  console.log("Project: basic-tracing-example");
}

main().catch(async (error) => {
  console.error("Error:", error);
  process.exit(1);
});
