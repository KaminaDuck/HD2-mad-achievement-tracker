/**
 * Test Utilities
 * Shared timing, session helpers, and test configuration
 */

import type { createOpencodeClient } from "@opencode-ai/sdk/v2";

// Test configuration - optimized for fast execution
export const TEST_TIMEOUT = 30000; // Down from 120000
export const SMOKE_TEST_TIMEOUT = 60000; // Longer timeout for smoke tests with multiple delays
export const FLUSH_DELAY = 500; // Down from 2000
export const POLL_INTERVAL = 200; // Down from 1000

type OpencodeClient = ReturnType<typeof createOpencodeClient>;

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with timing output
 */
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const elapsed = Date.now() - start;
    console.log(`  ${name} (${elapsed}ms)`);
    return result;
  } catch (error) {
    const elapsed = Date.now() - start;
    console.log(`  ${name} FAILED (${elapsed}ms)`);
    throw error;
  }
}

/**
 * Create a test session with tracking
 */
export async function createTestSession(
  client: OpencodeClient,
  title: string,
  trackingList?: string[]
): Promise<{ id: string; title: string }> {
  const { data: session } = await client.session.create({ title });
  if (!session) throw new Error(`Failed to create session: ${title}`);
  if (trackingList) trackingList.push(session.id);
  return { id: session.id, title: session.title || title };
}

/**
 * Cleanup a session (ignores errors)
 */
export async function cleanupSession(
  client: OpencodeClient,
  sessionId: string
): Promise<void> {
  try {
    await client.session.delete({ sessionID: sessionId });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Cleanup multiple sessions
 */
export async function cleanupSessions(
  client: OpencodeClient,
  sessionIds: string[]
): Promise<number> {
  let cleaned = 0;
  for (const id of sessionIds) {
    await cleanupSession(client, id);
    cleaned++;
  }
  return cleaned;
}

/**
 * Send a prompt and wait for completion
 */
export async function sendPrompt(
  client: OpencodeClient,
  sessionId: string,
  text: string
): Promise<void> {
  await client.session.prompt({
    sessionID: sessionId,
    parts: [{ type: "text", text }],
  });
}

/**
 * Wait for spans to flush after prompt completion
 */
export async function waitForFlush(): Promise<void> {
  await sleep(FLUSH_DELAY);
}
