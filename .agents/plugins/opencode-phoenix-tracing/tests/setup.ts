/**
 * Shared Test Setup
 * Common configuration and utilities for all E2E tests
 */

import type { Subprocess } from "bun";
import { createOpencodeClient } from "@opencode-ai/sdk/v2";
import {
  isPhoenixRunning,
  detectPhoenixProject,
  ensureTestProject,
} from "./helpers/phoenix-client";
import { TEST_TIMEOUT, sleep, cleanupSessions } from "./helpers/test-utils";

export const OPENCODE_URL = process.env.OPENCODE_URL || "http://localhost:4096";

// Shared state
let serverProcess: Subprocess | null = null;
let projectName: string | null = null;
let client: ReturnType<typeof createOpencodeClient> | null = null;
const testSessions: string[] = [];

export type OpencodeClient = ReturnType<typeof createOpencodeClient>;

/**
 * Get the SDK client (must call setup first)
 */
export function getClient(): OpencodeClient {
  if (!client) throw new Error("Client not initialized. Call setup() first.");
  return client;
}

/**
 * Get the Phoenix project name (must call setup first)
 */
export function getProjectName(): string {
  if (!projectName) throw new Error("Project not initialized. Call setup() first.");
  return projectName;
}

/**
 * Track a session for cleanup
 */
export function trackSession(sessionId: string): void {
  testSessions.push(sessionId);
}

/**
 * Get all tracked sessions
 */
export function getTrackedSessions(): string[] {
  return testSessions;
}

/**
 * Check if OpenCode server is running
 */
async function isServerRunning(): Promise<boolean> {
  try {
    const tempClient = createOpencodeClient({ baseUrl: OPENCODE_URL });
    const { data: health } = await tempClient.global.health();
    return health?.healthy === true;
  } catch {
    return false;
  }
}

/**
 * Wait for server to be ready
 */
async function waitForServerReady(timeout = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await isServerRunning()) return;
    await sleep(500);
  }
  throw new Error("Timeout waiting for server");
}

/**
 * Global setup - call in beforeAll
 */
export async function setup(): Promise<void> {
  console.log("\n=== E2E Test Setup ===");
  console.log(`OpenCode URL: ${OPENCODE_URL}`);

  // Check Phoenix is running
  const phoenixUp = await isPhoenixRunning();
  if (!phoenixUp) {
    throw new Error(
      "Phoenix is not running. Start it with: make phoenix-start"
    );
  }
  console.log("✓ Phoenix is running");

  // Check if OpenCode server is already running
  const serverUp = await isServerRunning();

  if (!serverUp) {
    console.log("Starting OpenCode server...");

    serverProcess = Bun.spawn(["opencode", "serve"], {
      env: {
        ...process.env,
        OPENCODE_PHOENIX_DEBUG: "true",
      },
      stdout: "pipe",
      stderr: "pipe",
    });

    await waitForServerReady();
    console.log("✓ OpenCode server started");
  } else {
    console.log("✓ OpenCode server already running");
  }

  // Initialize SDK client
  client = createOpencodeClient({
    baseUrl: OPENCODE_URL,
  });

  // Verify client connectivity
  try {
    const { data: health } = await client.global.health();
    if (!health) throw new Error("No health data returned");
    console.log(`✓ SDK connected (version: ${health.version})`);
  } catch (err) {
    throw new Error(`Failed to connect SDK: ${err}`);
  }

  // Detect Phoenix project name
  const detectedProject = await detectPhoenixProject(OPENCODE_URL);
  console.log(`✓ Phoenix project: ${detectedProject}`);

  // Ensure test project exists
  const project = await ensureTestProject();
  projectName = project.name;
  console.log(`✓ Project ready: ${project.name} (${project.id})`);

  console.log("=== Setup Complete ===\n");
}

/**
 * Global teardown - call in afterAll
 */
export async function teardown(): Promise<void> {
  console.log("\n=== E2E Test Cleanup ===");

  // Cleanup test sessions
  if (client && testSessions.length > 0) {
    const cleaned = await cleanupSessions(client, testSessions);
    console.log(`Cleaned up ${cleaned} test sessions`);
    testSessions.length = 0;
  }

  // Stop server if we started it
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
    console.log("Stopped OpenCode server");
  }

  console.log("=== Cleanup Complete ===\n");
}

// Export timeout for test files
export { TEST_TIMEOUT };
