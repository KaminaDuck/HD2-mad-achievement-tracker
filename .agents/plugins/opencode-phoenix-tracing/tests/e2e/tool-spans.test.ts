/**
 * TOOL Span Tests
 * Verifies TOOL span creation for tool executions
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
  assertSpanAttributeContains,
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

describe("TOOL Spans", () => {
  test(
    "created for Bash tool with name and arguments",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-tool-bash")
      );
      trackSession(session.id);

      await withTiming("Send tool prompt", () =>
        sendPrompt(client, session.id, "Run the bash command: echo hello")
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 3 })
      );

      const toolSpans = findSpansByKind(spans, "TOOL");
      expect(toolSpans.length).toBeGreaterThanOrEqual(1);

      const toolSpan = toolSpans[0];
      // spanKind is extracted to top-level field by Phoenix
      expect(getSpanKind(toolSpan.span)).toBe("TOOL");

      expect((toolSpan.attrs["gen_ai.tool.name"] as string).toLowerCase()).toBe("bash");
      assertSpanAttributeContains(toolSpan, "gen_ai.tool.call.arguments", "echo hello");
    },
    TEST_TIMEOUT
  );

  test(
    "captures tool result on success",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-tool-result")
      );
      trackSession(session.id);

      await withTiming("Send tool prompt", () =>
        sendPrompt(client, session.id, "Run: echo success-marker")
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 3 })
      );

      const toolSpans = findSpansByKind(spans, "TOOL");
      expect(toolSpans.length).toBeGreaterThanOrEqual(1);

      assertSpanStatusOk(toolSpans[0]);
    },
    TEST_TIMEOUT
  );

  test(
    "captures input.value and output.value for Phoenix display",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-tool-io")
      );
      trackSession(session.id);

      await withTiming("Send tool prompt", () =>
        sendPrompt(client, session.id, "Run: echo io-test-marker")
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 3 })
      );

      const toolSpans = findSpansByKind(spans, "TOOL");
      expect(toolSpans.length).toBeGreaterThanOrEqual(1);

      const toolSpan = toolSpans[0];

      // Verify input.value contains the tool arguments
      assertInputOutput(toolSpan, {
        input: true,
        output: true,
        inputContains: "io-test-marker",
      });

      // Verify input.value matches gen_ai.tool.call.arguments
      const inputValue = toolSpan.attrs["input.value"];
      const toolArgs = toolSpan.attrs["gen_ai.tool.call.arguments"];
      expect(inputValue).toBe(toolArgs);

      // Verify output.value matches gen_ai.tool.call.result
      const outputValue = toolSpan.attrs["output.value"];
      const toolResult = toolSpan.attrs["gen_ai.tool.call.result"];
      expect(outputValue).toBe(toolResult);

      console.log(`  input.value: ${(inputValue as string).slice(0, 50)}...`);
      console.log(`  output.value: ${(outputValue as string).slice(0, 50)}...`);
    },
    TEST_TIMEOUT
  );
});
