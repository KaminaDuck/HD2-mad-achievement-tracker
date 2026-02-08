/**
 * RAG Pipeline Tracing Example
 *
 * Demonstrates tracing a Retrieval-Augmented Generation (RAG) pipeline
 * with custom spans for each step: retrieve, augment, generate.
 *
 * Prerequisites:
 *   1. Phoenix running: docker run -p 6006:6006 arizephoenix/phoenix:latest
 *   2. Set OPENAI_API_KEY environment variable
 *
 * Run:
 *   bun run examples/rag-pipeline.ts
 */

// Initialize tracing BEFORE importing LLM libraries
import { register, trace } from "@arizeai/phoenix-otel";
import {
  OpenInferenceSpanKind,
  setSpan,
} from "@arizeai/openinference-core";

register({
  projectName: "rag-pipeline-example",
  endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "http://localhost:6006/v1/traces",
});

// Import after tracing is registered
import OpenAI from "openai";

const openai = new OpenAI();
const tracer = trace.getTracer("rag-pipeline");

// Simulated document store
const documents = [
  {
    id: "doc-1",
    content: "Paris is the capital and largest city of France. It has a population of over 2 million.",
    title: "About Paris",
  },
  {
    id: "doc-2",
    content: "The Eiffel Tower is a wrought-iron lattice tower in Paris, built in 1889.",
    title: "Eiffel Tower",
  },
  {
    id: "doc-3",
    content: "French cuisine is renowned worldwide. Popular dishes include croissants, baguettes, and coq au vin.",
    title: "French Cuisine",
  },
];

// Simulate vector search with scoring
async function retrieve(query: string, topK: number = 2) {
  return tracer.startActiveSpan("retrieve", async (span) => {
    setSpan(span, {
      openInferenceSpanKind: OpenInferenceSpanKind.RETRIEVER,
      input: { value: query },
    });

    span.setAttribute("retriever.top_k", topK);
    span.setAttribute("retriever.document_count", documents.length);

    // Simulate search delay
    await new Promise((r) => setTimeout(r, 100));

    // Simple keyword matching (in real app, use vector similarity)
    const results = documents
      .map((doc) => ({
        ...doc,
        score: query.toLowerCase().includes("paris")
          ? doc.content.toLowerCase().includes("paris") ? 0.95 : 0.3
          : 0.5,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);

    // Set retriever output attributes
    span.setAttribute("retriever.results_count", results.length);
    setSpan(span, {
      output: {
        value: JSON.stringify(results.map((r) => ({
          id: r.id,
          title: r.title,
          score: r.score,
        }))),
      },
    });

    span.end();
    return results;
  });
}

// Format context from retrieved documents
function formatContext(docs: typeof documents): string {
  return docs
    .map((doc, i) => `[${i + 1}] ${doc.title}:\n${doc.content}`)
    .join("\n\n");
}

// Generate response using LLM
async function generate(query: string, context: string) {
  return tracer.startActiveSpan("generate", async (span) => {
    setSpan(span, {
      openInferenceSpanKind: OpenInferenceSpanKind.LLM,
      input: { value: query },
    });

    span.setAttribute("llm.context_length", context.length);

    const systemPrompt = `You are a helpful assistant. Answer questions based on the provided context.
If the context doesn't contain relevant information, say so.

Context:
${context}`;

    // This call is also auto-instrumented, creating a child span
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query },
      ],
      max_tokens: 200,
    });

    const response = completion.choices[0].message.content ?? "";

    setSpan(span, {
      output: { value: response },
    });

    span.setAttribute("llm.token_count.prompt", completion.usage?.prompt_tokens ?? 0);
    span.setAttribute("llm.token_count.completion", completion.usage?.completion_tokens ?? 0);

    span.end();
    return response;
  });
}

// Main RAG pipeline
async function ragQuery(query: string) {
  return tracer.startActiveSpan("rag-query", async (span) => {
    setSpan(span, {
      openInferenceSpanKind: OpenInferenceSpanKind.CHAIN,
      input: { value: query },
    });

    console.log(`\nQuery: "${query}"`);

    // Step 1: Retrieve relevant documents
    console.log("  [1] Retrieving documents...");
    const docs = await retrieve(query, 2);
    console.log(`      Found ${docs.length} documents`);

    // Step 2: Format context
    console.log("  [2] Formatting context...");
    const context = formatContext(docs);

    // Step 3: Generate response
    console.log("  [3] Generating response...");
    const response = await generate(query, context);

    setSpan(span, {
      output: { value: response },
    });

    span.setAttribute("rag.documents_used", docs.length);
    span.end();

    return response;
  });
}

async function main() {
  console.log("RAG Pipeline Example");
  console.log("====================");

  // Run a few queries
  const queries = [
    "What is the capital of France?",
    "Tell me about the Eiffel Tower",
    "What is the population of Tokyo?", // Not in our docs
  ];

  for (const query of queries) {
    const response = await ragQuery(query);
    console.log(`\n  Response: ${response}\n`);
    console.log("-".repeat(50));
  }

  // Wait for traces to flush
  console.log("\nFlushing traces to Phoenix...");
  await new Promise((r) => setTimeout(r, 2000));

  console.log("\nDone! View traces at: http://localhost:6006");
  console.log("Project: rag-pipeline-example");
  console.log("\nYou should see:");
  console.log("  - Chain spans (rag-query) containing");
  console.log("  - Retriever spans (retrieve) and");
  console.log("  - LLM spans (generate + auto-instrumented OpenAI calls)");
}

main().catch(async (error) => {
  console.error("Error:", error);
  process.exit(1);
});
