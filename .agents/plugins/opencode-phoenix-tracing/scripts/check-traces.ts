/**
 * Check Phoenix traces for the opencode project
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
}

async function main() {
  console.log(`Connecting to Phoenix at ${PHOENIX_URL}...\n`);

  // Get projects using SDK
  console.log("=== Projects ===");
  const { data: projectsData, error: projectsError } = await phoenix.GET("/v1/projects");
  if (projectsError || !projectsData) {
    console.log("Failed to get projects:", projectsError);
    return;
  }

  const projects = projectsData.data;
  for (const project of projects) {
    console.log(`  - ${project.name}: (id: ${project.id})`);
  }

  // Find opencode project
  const opencodeProject = projects.find((p) => p.name === "opencode");
  if (!opencodeProject) {
    console.log("\nNo 'opencode' project found. Run OpenCode with the plugin first.");
    return;
  }

  // Get spans using SDK
  console.log(`\n=== Spans in 'opencode' ===\n`);

  const { data: spansData, error: spansError } = await phoenix.GET(
    "/v1/projects/{project_identifier}/spans",
    {
      params: {
        path: { project_identifier: opencodeProject.name },
        query: { limit: 50 },
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
  }));

  console.log(`Retrieved ${spans.length} spans\n`);

  // Group by trace ID
  const traceMap = new Map<string, SpanData[]>();
  for (const span of spans) {
    const traceId = span.context.traceId;
    if (!traceMap.has(traceId)) {
      traceMap.set(traceId, []);
    }
    traceMap.get(traceId)!.push(span);
  }

  console.log(`=== ${traceMap.size} Unique Traces ===\n`);

  // Display each trace
  for (const [traceId, traceSpans] of traceMap) {
    const rootSpan = traceSpans.find((s) => !s.parentId);
    const childSpans = traceSpans.filter((s) => s.parentId);

    console.log(`Trace: ${traceId.slice(0, 16)}...`);

    if (rootSpan) {
      const attrs = rootSpan.attributes as Record<string, unknown>;
      console.log(`  Root: ${rootSpan.name} (kind: ${rootSpan.spanKind})`);

      // Get nested attributes
      const session = attrs.session as Record<string, unknown> | undefined;
      const genAi = attrs.gen_ai as Record<string, unknown> | undefined;
      const sessionId = session?.id || attrs["session.id"];
      const iteration = (genAi?.agent as Record<string, unknown>)?.iteration || attrs["gen_ai.agent.iteration"];
      const agentId = (genAi?.agent as Record<string, unknown>)?.id;

      if (sessionId) console.log(`    session.id: ${sessionId}`);
      if (iteration) console.log(`    iteration: ${iteration}`);
      if (agentId && !sessionId) console.log(`    agent.id (old model): ${agentId}`);
    }

    for (const child of childSpans.slice(0, 3)) {
      const childAttrs = child.attributes as Record<string, unknown>;
      const genAi = childAttrs.gen_ai as Record<string, unknown> | undefined;
      const toolName = (genAi?.tool as Record<string, unknown>)?.name as string || child.name;
      console.log(`    └─ ${toolName} (${child.spanKind})`);
    }
    if (childSpans.length > 3) {
      console.log(`    └─ ... and ${childSpans.length - 3} more spans`);
    }
    console.log();
  }

  // Summary analysis
  console.log("=== Hierarchy Analysis ===");
  const rootSpans = spans.filter((s) => !s.parentId);
  const agentTurnCount = rootSpans.filter((s) => s.name === "agent.turn").length;
  const agentSessionCount = rootSpans.filter((s) => s.name === "agent.session").length;

  console.log(`Root spans named 'agent.turn': ${agentTurnCount} (NEW model)`);
  console.log(`Root spans named 'agent.session': ${agentSessionCount} (OLD model)`);

  if (agentTurnCount > 0 && agentSessionCount === 0) {
    console.log("\n✓ New turn-based hierarchy is working correctly!");
  } else if (agentTurnCount > 0 && agentSessionCount > 0) {
    console.log("\n⚠ Mixed: Both old and new traces present. New plugin is active.");
  } else if (agentSessionCount > 0) {
    console.log("\n⚠ Only old session-based traces. Restart OpenCode to use the new plugin.");
  } else {
    console.log("\n? No recognized trace patterns found.");
  }
}

main().catch(console.error);
