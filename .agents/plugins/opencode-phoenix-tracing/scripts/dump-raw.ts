/**
 * Dump raw span data from Phoenix to see actual structure
 *
 * Uses @arizeai/phoenix-client SDK instead of raw GraphQL
 */

import { createClient } from "@arizeai/phoenix-client";

const PHOENIX_URL = process.env.PHOENIX_ENDPOINT || "http://localhost:19060";

const phoenix = createClient({
  options: { baseUrl: PHOENIX_URL },
});

async function main() {
  // Get projects using SDK
  const { data: projectsData, error: projectsError } = await phoenix.GET("/v1/projects");
  if (projectsError || !projectsData) {
    console.log("Failed to get projects:", projectsError);
    return;
  }

  console.log("=== Projects ===");
  const projects = projectsData.data;
  for (const project of projects) {
    console.log(`  ${project.name}: (${project.id})`);
  }

  // Check for project by name priority: agentic-engineer first, then others
  const targetNames = ["agentic-engineer", "opencode", "opencode-test", "default"];
  let opencodeProject = null;
  for (const name of targetNames) {
    opencodeProject = projects.find((p) => p.name === name);
    if (opencodeProject) break;
  }
  if (!opencodeProject) {
    opencodeProject = projects[0];
  }
  if (!opencodeProject) {
    console.log("\nNo project found");
    return;
  }

  const projectName = opencodeProject.name;
  console.log(`\n=== Raw Spans for "${projectName}" ===\n`);

  // Get spans using SDK
  const { data: spansData, error: spansError } = await phoenix.GET(
    "/v1/projects/{project_identifier}/spans",
    {
      params: {
        path: { project_identifier: projectName },
        query: { limit: 50 },
      },
    }
  );

  if (spansError || !spansData) {
    console.log("Failed to get spans:", spansError);
    return;
  }

  const spans = spansData.data;
  console.log(`Found ${spans.length} spans\n`);

  for (const span of spans) {
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Name: ${span.name}`);
    console.log(`Kind: ${span.span_kind}`);
    console.log(`Parent: ${span.parent_id || "(ROOT)"}`);
    console.log(`Trace: ${span.context.trace_id}`);
    console.log(`Span ID: ${span.context.span_id}`);
    console.log(`\nAttributes:`);
    console.log(JSON.stringify(span.attributes, null, 2));
    console.log();
  }
}

main().catch(console.error);
