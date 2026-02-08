#!/usr/bin/env bun
/**
 * Check Phoenix Connection Script
 *
 * Verifies connectivity to a Phoenix instance and displays server info.
 *
 * Usage:
 *   bun run skills/observability/use-arize-sdk/scripts/check-connection.ts [options]
 *
 * Options:
 *   --endpoint <url>    Phoenix base URL (default: from env or localhost:6006)
 *   --verbose           Show detailed response
 */

import { parseArgs } from "node:util";

interface CheckOptions {
  endpoint: string;
  verbose: boolean;
}

function parseCliArgs(): CheckOptions {
  const { values } = parseArgs({
    options: {
      endpoint: { type: "string", short: "e" },
      verbose: { type: "boolean", short: "v", default: false },
    },
  });

  const defaultEndpoint =
    process.env.PHOENIX_COLLECTOR_ENDPOINT?.replace("/v1/traces", "") ??
    "http://localhost:6006";

  return {
    endpoint: values.endpoint ?? defaultEndpoint,
    verbose: values.verbose ?? false,
  };
}

async function checkHealth(baseUrl: string): Promise<{
  healthy: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    const response = await fetch(`${baseUrl}/healthz`, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return { healthy: true, data };
    }

    return {
      healthy: false,
      error: `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function getProjects(baseUrl: string): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/v1/projects`);
    if (response.ok) {
      const data = (await response.json()) as { data?: Array<{ name: string }> };
      return data.data?.map((p) => p.name) ?? [];
    }
    return [];
  } catch {
    return [];
  }
}

async function main() {
  const options = parseCliArgs();

  console.log(`\n=== Phoenix Connection Check ===\n`);
  console.log(`Endpoint: ${options.endpoint}\n`);

  // Check health
  console.log("Checking health...");
  const health = await checkHealth(options.endpoint);

  if (health.healthy) {
    console.log("  Status: HEALTHY\n");

    if (options.verbose && health.data) {
      console.log("  Response:", JSON.stringify(health.data, null, 2), "\n");
    }

    // List projects
    console.log("Fetching projects...");
    const projects = await getProjects(options.endpoint);

    if (projects.length > 0) {
      console.log(`  Found ${projects.length} project(s):`);
      for (const project of projects) {
        console.log(`    - ${project}`);
      }
    } else {
      console.log("  No projects found (this is normal for a new instance)");
    }

    console.log("\n  Phoenix is ready for tracing!");
    console.log(`  UI: ${options.endpoint}`);
    console.log(`  OTLP endpoint: ${options.endpoint}/v1/traces\n`);
  } else {
    console.log("  Status: UNHEALTHY");
    console.log(`  Error: ${health.error}\n`);

    console.log("Troubleshooting tips:");
    console.log("  1. Ensure Phoenix is running:");
    console.log("     docker run -p 6006:6006 arizephoenix/phoenix:latest");
    console.log("  2. Check if the endpoint is correct");
    console.log("  3. Verify no firewall is blocking the connection");
    console.log("  4. If using authentication, set PHOENIX_API_KEY\n");

    process.exit(1);
  }
}

main().catch(console.error);
