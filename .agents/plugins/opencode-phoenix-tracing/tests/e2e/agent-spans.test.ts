/**
 * AGENT Span Tests
 * Verifies AGENT span lifecycle, attributes, and iteration tracking
 */

import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import {
  setup,
  teardown,
  getClient,
  getProjectName,
  trackSession,
  TEST_TIMEOUT,
} from "../setup";
import { waitForSpans } from "../helpers/phoenix-client";
import {
  findSpansByKind,
  assertSpanAttributes,
  assertSpanStatusOk,
  assertInputOutput,
  getSpanKind,
} from "../helpers/assertions";
import {
  createTestSession,
  sendPrompt,
  waitForFlush,
  withTiming,
} from "../helpers/test-utils";

beforeAll(async () => {
  await setup();
}, TEST_TIMEOUT);

afterAll(async () => {
  await teardown();
});

describe("AGENT Spans", () => {
  test(
    "created on session.busy with correct attributes",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-agent-attrs")
      );
      trackSession(session.id);

      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, 'Say exactly: "test" and nothing else')
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const agentSpans = findSpansByKind(spans, "AGENT");
      expect(agentSpans.length).toBeGreaterThanOrEqual(1);

      const agentSpan = agentSpans[0];
      // spanKind is extracted to top-level field by Phoenix
      expect(getSpanKind(agentSpan.span)).toBe("AGENT");
      assertSpanAttributes(agentSpan, {
        "session.id": session.id,
      });
      expect(agentSpan.attrs["gen_ai.agent.iteration"]).toBe(1);
    },
    TEST_TIMEOUT
  );

  test(
    "ends on session.idle with OK status",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-agent-status")
      );
      trackSession(session.id);

      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, 'Reply with "ok"')
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const agentSpans = findSpansByKind(spans, "AGENT");
      expect(agentSpans.length).toBeGreaterThanOrEqual(1);

      assertSpanStatusOk(agentSpans[0]);
    },
    TEST_TIMEOUT
  );

  test(
    "iteration increments across turns",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-agent-iteration")
      );
      trackSession(session.id);

      await withTiming("First turn", () =>
        sendPrompt(client, session.id, 'First turn: say "one"')
      );

      await withTiming("Second turn", () =>
        sendPrompt(client, session.id, 'Second turn: say "two"')
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 4 })
      );

      const agentSpans = findSpansByKind(spans, "AGENT");
      expect(agentSpans.length).toBeGreaterThanOrEqual(2);

      const iterations = agentSpans
        .map((s) => s.attrs["gen_ai.agent.iteration"])
        .filter((i): i is number => typeof i === "number")
        .sort((a, b) => a - b);

      expect(iterations).toContain(1);
      expect(iterations).toContain(2);
    },
    TEST_TIMEOUT
  );

  test(
    "captures input.value and output.value for Phoenix display",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-agent-io")
      );
      trackSession(session.id);

      const testPrompt = 'Say exactly: "hello world"';
      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, testPrompt)
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const agentSpans = findSpansByKind(spans, "AGENT");
      expect(agentSpans.length).toBeGreaterThanOrEqual(1);

      const agentSpan = agentSpans[0];

      // Verify input.value contains the user prompt
      assertInputOutput(agentSpan, {
        input: true,
        output: true,
        inputContains: "hello world",
      });

      console.log(`  input.value: ${(agentSpan.attrs["input.value"] as string).slice(0, 50)}...`);
      console.log(`  output.value: ${(agentSpan.attrs["output.value"] as string).slice(0, 50)}...`);
    },
    TEST_TIMEOUT
  );
});
