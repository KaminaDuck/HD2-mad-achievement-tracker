#!/usr/bin/env bun
/**
 * Fetch Traces Script
 *
 * Fetches and displays recent traces from Phoenix.
 *
 * Usage:
 *   bun run skills/observability/use-arize-sdk/scripts/fetch-traces.ts [options]
 *
 * Options:
 *   --project <name>    Filter by project name
 *   --limit <n>         Number of traces to fetch (default: 10)
 *   --endpoint <url>    Phoenix base URL
 *   --json              Output as JSON
 */

import { parseArgs } from "node:util";

interface FetchOptions {
  project?: string;
  limit: number;
  endpoint: string;
  json: boolean;
}

interface TraceData {
  trace_id: string;
  project_name: string;
  name?: string;
  start_time: string;
  end_time?: string;
  status_code?: string;
  latency_ms?: number;
  num_spans?: number;
}

function parseCliArgs(): FetchOptions {
  const { values } = parseArgs({
    options: {
      project: { type: "string", short: "p" },
      limit: { type: "string", short: "l" },
      endpoint: { type: "string", short: "e" },
      json: { type: "boolean", short: "j", default: false },
    },
  });

  const defaultEndpoint =
    process.env.PHOENIX_COLLECTOR_ENDPOINT?.replace("/v1/traces", "") ??
    "http://localhost:6006";

  return {
    project: values.project ?? process.env.PHOENIX_PROJECT_NAME,
    limit: values.limit ? parseInt(values.limit, 10) : 10,
    endpoint: values.endpoint ?? defaultEndpoint,
    json: values.json ?? false,
  };
}

async function fetchTraces(options: FetchOptions): Promise<TraceData[]> {
  // Phoenix uses GraphQL for trace queries. Use the REST project endpoint
  // to get project info and verify connectivity.
  const projectsResponse = await fetch(`${options.endpoint}/v1/projects`);

  if (!projectsResponse.ok) {
    throw new Error(`Failed to fetch projects: ${projectsResponse.statusText}`);
  }

  const projectsData = (await projectsResponse.json()) as {
    data?: Array<{ name: string; id: string }>;
  };

  // Find the requested project
  const targetProject = options.project
    ? projectsData.data?.find((p) => p.name === options.project)
    : projectsData.data?.[0];

  if (!targetProject) {
    console.log(`Project "${options.project ?? "default"}" not found.`);
    console.log("Available projects:", projectsData.data?.map((p) => p.name).join(", "));
    return [];
  }

  // Use GraphQL to fetch traces (Phoenix's native query interface)
  const graphqlQuery = {
    query: `
      query GetTraces($projectId: GlobalID!, $first: Int) {
        node(id: $projectId) {
          ... on Project {
            traces(first: $first) {
              edges {
                node {
                  id
                  traceId
                  startTime
                  endTime
                  latencyMs
                  status {
                    code
                  }
                  rootSpan {
                    name
                  }
                }
              }
            }
          }
        }
      }
    `,
    variables: {
      projectId: targetProject.id,
      first: options.limit,
    },
  };

  const graphqlResponse = await fetch(`${options.endpoint}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(graphqlQuery),
  });

  if (!graphqlResponse.ok) {
    throw new Error(`GraphQL query failed: ${graphqlResponse.statusText}`);
  }

  const graphqlData = (await graphqlResponse.json()) as {
    data?: {
      node?: {
        traces?: {
          edges?: Array<{
            node: {
              id: string;
              traceId: string;
              startTime: string;
              endTime?: string;
              latencyMs?: number;
              status?: { code: string };
              rootSpan?: { name: string };
            };
          }>;
        };
      };
    };
  };

  const edges = graphqlData.data?.node?.traces?.edges ?? [];

  return edges.map((edge) => ({
    trace_id: edge.node.traceId,
    project_name: targetProject.name,
    name: edge.node.rootSpan?.name,
    start_time: edge.node.startTime,
    end_time: edge.node.endTime,
    status_code: edge.node.status?.code,
    latency_ms: edge.node.latencyMs,
  }));
}

function formatDuration(ms?: number): string {
  if (ms === undefined) return "N/A";
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  return `${(ms / 60000).toFixed(2)}m`;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString();
}

function displayTraces(traces: TraceData[]): void {
  if (traces.length === 0) {
    console.log("No traces found.");
    return;
  }

  console.log(`\nFound ${traces.length} trace(s):\n`);
  console.log("-".repeat(100));

  for (const trace of traces) {
    const status = trace.status_code ?? "UNKNOWN";
    const statusIcon = status === "OK" ? "✓" : status === "ERROR" ? "✗" : "?";

    console.log(`${statusIcon} ${trace.name ?? trace.trace_id}`);
    console.log(`  ID:       ${trace.trace_id}`);
    console.log(`  Project:  ${trace.project_name}`);
    console.log(`  Started:  ${formatTimestamp(trace.start_time)}`);
    console.log(`  Duration: ${formatDuration(trace.latency_ms)}`);
    console.log(`  Status:   ${status}`);
    if (trace.num_spans) {
      console.log(`  Spans:    ${trace.num_spans}`);
    }
    console.log("-".repeat(100));
  }
}

async function main() {
  const options = parseCliArgs();

  if (!options.json) {
    console.log("\n=== Phoenix Traces ===");
    console.log(`Endpoint: ${options.endpoint}`);
    if (options.project) {
      console.log(`Project: ${options.project}`);
    }
    console.log(`Limit: ${options.limit}`);
  }

  try {
    const traces = await fetchTraces(options);

    if (options.json) {
      console.log(JSON.stringify(traces, null, 2));
    } else {
      displayTraces(traces);
    }
  } catch (error) {
    console.error(
      "\nError fetching traces:",
      error instanceof Error ? error.message : error
    );
    console.log("\nTips:");
    console.log("  - Ensure Phoenix is running");
    console.log("  - Check the endpoint URL");
    console.log("  - Verify traces exist for the project");
    process.exit(1);
  }
}

main().catch(console.error);
