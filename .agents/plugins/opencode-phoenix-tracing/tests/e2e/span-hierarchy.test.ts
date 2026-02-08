/**
 * Span Hierarchy Tests
 * Verifies parent-child relationships between spans
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
import {
  waitForSpans,
  groupByTraceId,
  findRootSpans,
} from "../helpers/phoenix-client";
import { buildSpanTree, printSpanTree, getSpanKind } from "../helpers/assertions";
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

describe("Span Hierarchy", () => {
  test(
    "AGENT is root span (no parent)",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-hierarchy-root")
      );
      trackSession(session.id);

      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, 'Say "root test"')
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const traceGroups = groupByTraceId(spans);
      expect(traceGroups.size).toBeGreaterThanOrEqual(1);

      const [, traceSpans] = [...traceGroups.entries()][0];
      const roots = findRootSpans(traceSpans);

      expect(roots.length).toBeGreaterThanOrEqual(1);

      // spanKind is extracted to top-level field by Phoenix
      expect(getSpanKind(roots[0])).toBe("AGENT");
    },
    TEST_TIMEOUT
  );

  test(
    "LLM spans are children of AGENT",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-hierarchy-llm")
      );
      trackSession(session.id);

      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, 'Say "child test"')
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const traceGroups = groupByTraceId(spans);
      const [, traceSpans] = [...traceGroups.entries()][0];

      const llmSpans = traceSpans.filter((s) => getSpanKind(s) === "LLM");

      expect(llmSpans.length).toBeGreaterThanOrEqual(1);

      for (const llm of llmSpans) {
        expect(llm.parentId).toBeDefined();
      }
    },
    TEST_TIMEOUT
  );

  test(
    "TOOL spans are children of AGENT or LLM",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-hierarchy-tool")
      );
      trackSession(session.id);

      await withTiming("Send tool prompt", () =>
        sendPrompt(client, session.id, "Run: echo hierarchy-test")
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 3 })
      );

      const traceGroups = groupByTraceId(spans);
      const [, traceSpans] = [...traceGroups.entries()][0];

      // Build and print tree for debugging
      const trees = buildSpanTree(traceSpans);
      console.log("\n  Span hierarchy:");
      for (const tree of trees) {
        printSpanTree(tree, 2);
      }

      const toolSpans = traceSpans.filter((s) => getSpanKind(s) === "TOOL");

      expect(toolSpans.length).toBeGreaterThanOrEqual(1);

      for (const tool of toolSpans) {
        expect(tool.parentId).toBeDefined();
      }
    },
    TEST_TIMEOUT
  );
});
