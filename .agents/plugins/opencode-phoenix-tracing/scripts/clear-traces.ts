/**
 * Clear old traces from Phoenix opencode project
 * Uses @arizeai/phoenix-client
 */

import { createClient } from "@arizeai/phoenix-client";

const PHOENIX_URL = process.env.PHOENIX_ENDPOINT || "http://localhost:19060";

async function main() {
  console.log(`Connecting to Phoenix at ${PHOENIX_URL}...\n`);

  const phoenix = createClient({
    baseUrl: PHOENIX_URL,
  });

  // List projects first
  console.log("=== Projects ===");
  const projects = await phoenix.GET("/v1/projects");

  if (projects.data?.data) {
    for (const project of projects.data.data) {
      console.log(`  - ${project.name} (id: ${project.id})`);
    }
  }

  // Find opencode project
  const opencodeProject = projects.data?.data?.find(p => p.name === "opencode");

  if (!opencodeProject) {
    console.log("\nNo 'opencode' project found.");
    return;
  }

  console.log(`\nClearing traces from 'opencode' project...`);

  // Delete the project (this removes all traces)
  try {
    const deleteResult = await phoenix.DELETE("/v1/projects/{project_name}", {
      params: {
        path: { project_name: "opencode" },
      },
    });

    if (deleteResult.response.ok) {
      console.log("✓ Project 'opencode' deleted successfully.");
      console.log("\nNew traces will create a fresh 'opencode' project automatically.");
    } else {
      console.log(`Delete failed: ${deleteResult.response.status} ${deleteResult.response.statusText}`);
    }
  } catch (e) {
    const error = e as Error;
    console.log("Error deleting project:", error.message);

    // Try alternative: clear spans via POST
    console.log("\nTrying alternative method...");
    try {
      const clearResult = await phoenix.POST("/v1/projects/{project_name}/clear" as any, {
        params: {
          path: { project_name: "opencode" },
        },
      });
      console.log("Clear result:", clearResult);
    } catch (e2) {
      console.log("Alternative method also failed. Project may need manual cleanup.");
    }
  }
}

main().catch(console.error);
