/**
 * Verify Phoenix trace hierarchy for opencode-test project
 * Checks sessions, traces, and spans structure
 *
 * Uses @arizeai/phoenix-client SDK instead of raw GraphQL
 */

import { createClient } from "@arizeai/phoenix-client";

const PHOENIX_URL = process.env.PHOENIX_ENDPOINT || "http://localhost:19060";

const phoenix = createClient({
  options: { baseUrl: PHOENIX_URL },
});

interface SpanData {
  name: string;
  spanKind: string;
  parentId: string | null;
  context: { traceId: string; spanId: string };
  attributes: Record<string, unknown>;
  latencyMs?: number;
}

async function main() {
  console.log("=== Phoenix Hierarchy Verification ===\n");

  // Get projects using SDK
  const { data: projectsData, error: projectsError } = await phoenix.GET("/v1/projects");
  if (projectsError || !projectsData) {
    console.log("Failed to get projects:", projectsError);
    return;
  }

  const projects = projectsData.data;
  const project = projects.find((p) => p.name === "opencode-test");

  if (!project) {
    console.log("No opencode-test project found");
    return;
  }

  console.log(`Project: opencode-test (traces available)\n`);

  // Get spans using SDK
  const { data: spansData, error: spansError } = await phoenix.GET(
    "/v1/projects/{project_identifier}/spans",
    {
      params: {
        path: { project_identifier: project.name },
        query: { limit: 100 },
      },
    }
  );

  if (spansError || !spansData) {
    console.log("Failed to get spans:", spansError);
    return;
  }

  const spans: SpanData[] = spansData.data.map((s) => ({
    name: s.name,
    spanKind: s.span_kind || "",
    parentId: s.parent_id || null,
    context: {
      traceId: s.context.trace_id || "",
      spanId: s.context.span_id || "",
    },
    attributes: (s.attributes || {}) as Record<string, unknown>,
    latencyMs: s.latency_ms,
  }));

  // Group by trace
  const traceMap = new Map<string, SpanData[]>();
  for (const span of spans) {
    const traceId = span.context.traceId;
    if (!traceMap.has(traceId)) {
      traceMap.set(traceId, []);
    }
    traceMap.get(traceId)!.push(span);
  }

  // Group by session
  const sessionMap = new Map<string, string[]>();
  for (const span of spans) {
    const attrs = span.attributes as Record<string, unknown>;
    const sessionId = (attrs.session as Record<string, unknown>)?.id as string | undefined;
    if (sessionId) {
      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, []);
      }
      const traceId = span.context.traceId;
      if (!sessionMap.get(sessionId)!.includes(traceId)) {
        sessionMap.get(sessionId)!.push(traceId);
      }
    }
  }

  // Report
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("SESSIONS (grouped by session.id attribute)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  for (const [sessionId, traceIds] of sessionMap) {
    console.log(`\nSession: ${sessionId}`);
    console.log(`  Contains ${traceIds.length} trace(s)`);
  }

  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("TRACES (each agent.turn = one trace)");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  for (const [traceId, traceSpans] of traceMap) {
    const rootSpan = traceSpans.find((s) => !s.parentId);
    const childSpans = traceSpans.filter((s) => s.parentId);

    const rootAttrs = rootSpan?.attributes as Record<string, unknown> || {};
    const genAi = rootAttrs.gen_ai as Record<string, unknown> | undefined;
    const iteration = (genAi?.agent as Record<string, unknown>)?.iteration || "?";
    const session = rootAttrs.session as Record<string, unknown> | undefined;
    const sessionId = session?.id as string || "?";

    console.log(`\nTrace: ${traceId.slice(0, 16)}...`);
    console.log(`  Session: ${sessionId.slice(0, 20)}...`);

    if (rootSpan) {
      console.log(`  Root: ${rootSpan.name} (iteration=${iteration}, ${rootSpan.latencyMs?.toFixed(0) || "?"}ms)`);
    }

    console.log(`  SPANS (${childSpans.length} tool calls):`);
    for (const child of childSpans) {
      const childAttrs = child.attributes as Record<string, unknown>;
      const genAiChild = childAttrs.gen_ai as Record<string, unknown> | undefined;
      const toolName = (genAiChild?.tool as Record<string, unknown>)?.name as string || child.name;
      console.log(`    └─ ${toolName} (${child.latencyMs?.toFixed(0) || "?"}ms)`);
    }
    if (childSpans.length === 0) {
      console.log(`    (no tool spans yet)`);
    }
  }

  // Summary
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("SUMMARY");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`Total sessions: ${sessionMap.size}`);
  console.log(`Total traces: ${traceMap.size}`);
  console.log(`Total spans: ${spans.length}`);

  const rootSpans = spans.filter((s) => !s.parentId);
  const turnCount = rootSpans.filter((s) => s.name === "agent.turn").length;
  const sessionCount = rootSpans.filter((s) => s.name === "agent.session").length;

  console.log(`\nRoot span types:`);
  console.log(`  agent.turn: ${turnCount} (NEW model) ✓`);
  console.log(`  agent.session: ${sessionCount} (OLD model)`);

  if (turnCount > 0 && sessionCount === 0) {
    console.log("\n✓ Hierarchy is correct!");
  }
}

main().catch(console.error);
