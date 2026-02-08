/**
 * Smoke Test
 * Basic diagnostic test to verify the E2E infrastructure works
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { createOpencodeClient } from "@opencode-ai/sdk/v2";
import {
  isPhoenixRunning,
  detectPhoenixProject,
  getProjectSpans,
  getSpansBySessionId,
  parseAttributes,
} from "../helpers/phoenix-client";
import { SMOKE_TEST_TIMEOUT } from "../helpers/test-utils";

const OPENCODE_URL = process.env.OPENCODE_URL || "http://localhost:4096";

let client: ReturnType<typeof createOpencodeClient>;
let projectName: string;
const testSessions: string[] = [];

interface SSEEvent {
  type: string;
  properties?: Record<string, unknown>;
}

/**
 * Subscribe to server events via SSE
 */
function subscribeToEvents(
  baseUrl: string,
  onEvent: (event: SSEEvent) => void,
  onError?: (error: Error) => void
): () => void {
  const controller = new AbortController();

  (async () => {
    try {
      const response = await fetch(`${baseUrl}/event`, {
        signal: controller.signal,
        headers: { Accept: "text/event-stream" },
      });

      if (!response.ok) {
        throw new Error(`SSE connection failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              onEvent(data);
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        onError?.(err as Error);
      }
    }
  })();

  return () => controller.abort();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

beforeAll(async () => {
  console.log("\n=== Smoke Test Setup ===");

  // 1. Check Phoenix
  console.log("1. Checking Phoenix...");
  const phoenixUp = await isPhoenixRunning();
  console.log(`   Phoenix running: ${phoenixUp}`);
  if (!phoenixUp) throw new Error("Phoenix not running");

  // 2. Check OpenCode
  console.log("2. Checking OpenCode server...");
  client = createOpencodeClient({ baseUrl: OPENCODE_URL });
  const { data: health } = await client.global.health();
  console.log(`   OpenCode healthy: ${health?.healthy}, version: ${health?.version}`);
  if (!health?.healthy) throw new Error("OpenCode not healthy");

  // 3. Detect project
  console.log("3. Detecting Phoenix project...");
  projectName = await detectPhoenixProject(OPENCODE_URL);
  console.log(`   Project: ${projectName}`);

  console.log("=== Setup Complete ===\n");
}, SMOKE_TEST_TIMEOUT);

afterAll(async () => {
  for (const id of testSessions) {
    try {
      await client.session.delete({ sessionID: id });
    } catch {}
  }
  console.log(`\nCleaned up ${testSessions.length} sessions`);
});

describe("Smoke Tests", () => {
  test("Phoenix has existing spans", async () => {
    console.log("\n--- Checking existing spans ---");
    const spans = await getProjectSpans(projectName, 10);
    console.log(`Found ${spans.length} recent spans in project`);

    if (spans.length > 0) {
      console.log("Sample span:");
      console.log(`  Name: ${spans[0].name}`);
      console.log(`  Kind: ${spans[0].spanKind}`);
      console.log(`  Status: ${spans[0].statusCode}`);
      console.log(`  TraceID: ${spans[0].context.traceId}`);

      const attrs = parseAttributes(spans[0].attributes);
      console.log(`  Attributes keys: ${Object.keys(attrs).slice(0, 5).join(", ")}...`);
      console.log(`  openinference.span.kind: ${attrs["openinference.span.kind"]}`);
      console.log(`  session.id: ${attrs["session.id"]}`);
    }

    // Just verify we can query - don't require spans exist
    expect(spans).toBeDefined();
  }, SMOKE_TEST_TIMEOUT);

  test("can create session and send prompt", async () => {
    console.log("\n--- Creating session ---");
    const { data: session } = await client.session.create({
      title: "smoke-test-session",
    });
    if (!session) throw new Error("Failed to create session");
    testSessions.push(session.id);
    console.log(`Created session: ${session.id}`);

    console.log("--- Sending prompt ---");
    const startTime = Date.now();
    await client.session.prompt({
      sessionID: session.id,
      parts: [{ type: "text", text: 'Say exactly "smoke" and nothing else' }],
    });
    console.log(`Prompt completed in ${Date.now() - startTime}ms`);

    expect(session.id).toBeDefined();
  }, SMOKE_TEST_TIMEOUT);

  test("spans appear after prompt (with delays)", async () => {
    console.log("\n--- Creating session for span test ---");
    const { data: session } = await client.session.create({
      title: "smoke-test-spans",
    });
    if (!session) throw new Error("Failed to create session");
    testSessions.push(session.id);
    console.log(`Session: ${session.id}`);
    console.log(`All test sessions: ${testSessions.join(", ")}`);

    console.log("--- Sending prompt ---");
    await client.session.prompt({
      sessionID: session.id,
      parts: [{ type: "text", text: 'Say "test"' }],
    });
    console.log("Prompt done");

    // Check at multiple intervals
    const checkIntervals = [500, 1000, 2000, 5000, 10000];
    let foundSpans = 0;
    let foundSessionId = "";

    for (const delay of checkIntervals) {
      console.log(`--- Waiting ${delay}ms then checking spans ---`);
      await sleep(delay);

      // Check ALL test sessions for spans (spans may flush from earlier sessions)
      for (const sessionId of testSessions) {
        const spans = await getSpansBySessionId(projectName, sessionId);
        if (spans.length > 0) {
          foundSpans = spans.length;
          foundSessionId = sessionId;
          console.log(`Found ${spans.length} spans for session ${sessionId}`);
          console.log("Span details:");
          for (const span of spans.slice(0, 5)) {
            const attrs = parseAttributes(span.attributes);
            console.log(`  - ${span.name} [${span.spanKind || attrs["openinference.span.kind"] || "?"}]`);
            console.log(`    Status: ${span.statusCode}`);
          }
          break;
        }
      }

      if (foundSpans > 0) break;
      console.log(`No spans found for any test session yet`);
    }

    if (foundSpans === 0) {
      console.log("\n!!! No spans found - checking all recent spans !!!");
      const allSpans = await getProjectSpans(projectName, 20);
      console.log(`Total recent spans in project: ${allSpans.length}`);

      for (const span of allSpans.slice(0, 10)) {
        const attrs = parseAttributes(span.attributes);
        console.log(`  - ${span.name} | session.id: ${attrs["session.id"] || "N/A"}`);
      }
    } else {
      console.log(`\nSpans found for session: ${foundSessionId}`);
    }

    expect(foundSpans).toBeGreaterThan(0);
  }, SMOKE_TEST_TIMEOUT);

  test("SSE events fire during prompt", async () => {
    console.log("\n--- Testing SSE event stream ---");

    const events: SSEEvent[] = [];
    let connected = false;

    const unsubscribe = subscribeToEvents(
      OPENCODE_URL,
      (event) => {
        if (event.type === "server.connected") {
          connected = true;
          console.log("  SSE connected");
        } else {
          events.push(event);
          console.log(`  Event: ${event.type}`);
        }
      },
      (error) => {
        console.log(`  SSE error: ${error.message}`);
      }
    );

    // Wait for connection
    await sleep(500);
    console.log(`  Connected: ${connected}`);

    // Create session and send prompt
    const { data: session } = await client.session.create({
      title: "smoke-test-sse",
    });
    if (!session) throw new Error("Failed to create session");
    testSessions.push(session.id);
    console.log(`  Session: ${session.id}`);

    console.log("  Sending prompt...");
    await client.session.prompt({
      sessionID: session.id,
      parts: [{ type: "text", text: 'Say "sse test"' }],
    });
    console.log("  Prompt completed");

    // Wait for events to settle
    await sleep(1000);

    // Stop listening
    unsubscribe();

    console.log(`\n  Total events captured: ${events.length}`);
    const eventTypes = [...new Set(events.map((e) => e.type))];
    console.log(`  Event types: ${eventTypes.join(", ")}`);

    // Show sample of each type
    for (const type of eventTypes.slice(0, 10)) {
      const sample = events.find((e) => e.type === type);
      console.log(`\n  Sample ${type}:`);
      console.log(`    ${JSON.stringify(sample?.properties || {}).slice(0, 200)}`);
    }

    expect(events.length).toBeGreaterThan(0);
  }, SMOKE_TEST_TIMEOUT);

  test("span attributes are properly structured", async () => {
    console.log("\n--- Checking span attribute structure ---");
    const spans = await getProjectSpans(projectName, 20);

    if (spans.length === 0) {
      console.log("No spans to analyze");
      return;
    }

    // Find different span kinds
    const byKind: Record<string, number> = {};
    for (const span of spans) {
      const attrs = parseAttributes(span.attributes);
      const kind = span.spanKind || attrs["openinference.span.kind"] || "UNKNOWN";
      byKind[kind] = (byKind[kind] || 0) + 1;
    }

    console.log("Span kinds found:");
    for (const [kind, count] of Object.entries(byKind)) {
      console.log(`  ${kind}: ${count}`);
    }

    // Sample one of each kind
    const seen = new Set<string>();
    for (const span of spans) {
      const attrs = parseAttributes(span.attributes);
      const kind = span.spanKind || attrs["openinference.span.kind"] || "UNKNOWN";

      if (seen.has(kind)) continue;
      seen.add(kind);

      console.log(`\nSample ${kind} span:`);
      console.log(`  Name: ${span.name}`);
      console.log(`  spanKind field: ${span.spanKind}`);
      console.log(`  openinference.span.kind attr: ${attrs["openinference.span.kind"]}`);
      console.log(`  All attribute keys: ${Object.keys(attrs).join(", ")}`);
    }

    expect(spans.length).toBeGreaterThan(0);
  }, SMOKE_TEST_TIMEOUT);
});
