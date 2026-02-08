/**
 * LLM Span Tests
 * Verifies LLM span attributes including tokens and model info
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
  assertSpanStatusOk,
  assertTokenUsage,
  assertModelInfo,
  assertInputOutput,
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

describe("LLM Spans", () => {
  test(
    "captures input and output token counts",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-llm-tokens")
      );
      trackSession(session.id);

      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, 'Reply with just "ok"')
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const llmSpans = findSpansByKind(spans, "LLM");
      expect(llmSpans.length).toBeGreaterThanOrEqual(1);

      const llmSpan = llmSpans[0];
      assertTokenUsage(llmSpan);

      console.log(
        `  Token usage: input=${llmSpan.attrs["gen_ai.usage.input_tokens"]}, ` +
          `output=${llmSpan.attrs["gen_ai.usage.output_tokens"]}`
      );
    },
    TEST_TIMEOUT
  );

  test(
    "includes request and response model IDs",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-llm-model")
      );
      trackSession(session.id);

      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, 'Say "model test"')
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const llmSpans = findSpansByKind(spans, "LLM");
      expect(llmSpans.length).toBeGreaterThanOrEqual(1);

      const llmSpan = llmSpans[0];
      assertModelInfo(llmSpan);

      console.log(`  Model: ${llmSpan.attrs["gen_ai.request.model"]}`);
    },
    TEST_TIMEOUT
  );

  test(
    "has OK status on completion",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-llm-status")
      );
      trackSession(session.id);

      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, 'Reply "done"')
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const llmSpans = findSpansByKind(spans, "LLM");
      expect(llmSpans.length).toBeGreaterThanOrEqual(1);

      assertSpanStatusOk(llmSpans[0]);
    },
    TEST_TIMEOUT
  );

  test(
    "captures input.value and output.value for Phoenix display",
    async () => {
      const client = getClient();
      const projectName = getProjectName();

      const session = await withTiming("Create session", () =>
        createTestSession(client, "e2e-llm-io")
      );
      trackSession(session.id);

      const testPrompt = 'Reply with exactly: "test response"';
      await withTiming("Send prompt", () =>
        sendPrompt(client, session.id, testPrompt)
      );

      await waitForFlush();

      const spans = await withTiming("Wait for spans", () =>
        waitForSpans(projectName, session.id, { minSpans: 2 })
      );

      const llmSpans = findSpansByKind(spans, "LLM");
      expect(llmSpans.length).toBeGreaterThanOrEqual(1);

      const llmSpan = llmSpans[0];

      // Verify input.value contains the prompt and output.value matches gen_ai.output.text
      assertInputOutput(llmSpan, {
        input: true,
        output: true,
        inputContains: "test response",
      });

      // Verify output.value equals gen_ai.output.text
      const outputValue = llmSpan.attrs["output.value"];
      const genAiOutput = llmSpan.attrs["gen_ai.output.text"];
      expect(outputValue).toBe(genAiOutput);

      console.log(`  input.value: ${(llmSpan.attrs["input.value"] as string).slice(0, 50)}...`);
      console.log(`  output.value: ${(llmSpan.attrs["output.value"] as string).slice(0, 50)}...`);
    },
    TEST_TIMEOUT
  );
});
