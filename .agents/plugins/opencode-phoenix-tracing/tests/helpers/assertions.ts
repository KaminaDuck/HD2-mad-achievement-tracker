/**
 * Span Assertions
 * Custom assertion helpers for validating Phoenix spans
 */

import type { SpanNode, ParsedAttributes } from "./phoenix-client";
import { parseAttributes, findChildren } from "./phoenix-client";

export interface SpanAssertion {
  span: SpanNode;
  attrs: ParsedAttributes;
}

/**
 * Find a span by name
 */
export function findSpanByName(spans: SpanNode[], name: string): SpanAssertion | null {
  const span = spans.find((s) => s.name === name);
  if (!span) return null;
  return { span, attrs: parseAttributes(span.attributes) };
}

/**
 * Find spans by OpenInference span kind
 * Checks both the top-level spanKind field (where Phoenix extracts it)
 * and the openinference.span.kind attribute as fallback
 */
export function findSpansByKind(
  spans: SpanNode[],
  kind: "AGENT" | "LLM" | "TOOL"
): SpanAssertion[] {
  return spans
    .map((span) => ({ span, attrs: parseAttributes(span.attributes) }))
    .filter((s) => {
      // Phoenix extracts openinference.span.kind to the top-level spanKind field
      if (s.span.spanKind === kind) return true;
      // Fallback to attribute check
      return s.attrs["openinference.span.kind"] === kind;
    });
}

/**
 * Assert span has expected attributes
 */
export function assertSpanAttributes(
  assertion: SpanAssertion,
  expected: Partial<ParsedAttributes>
): void {
  for (const [key, value] of Object.entries(expected)) {
    const actual = assertion.attrs[key];
    if (actual !== value) {
      throw new Error(
        `Span "${assertion.span.name}" attribute "${key}": ` +
          `expected ${JSON.stringify(value)}, got ${JSON.stringify(actual)}`
      );
    }
  }
}

/**
 * Assert span attribute contains substring
 */
export function assertSpanAttributeContains(
  assertion: SpanAssertion,
  key: string,
  substring: string
): void {
  const value = assertion.attrs[key];
  if (typeof value !== "string") {
    throw new Error(
      `Span "${assertion.span.name}" attribute "${key}": ` +
        `expected string containing "${substring}", got ${typeof value}`
    );
  }
  if (!value.includes(substring)) {
    throw new Error(
      `Span "${assertion.span.name}" attribute "${key}": ` +
        `expected to contain "${substring}", got "${value.slice(0, 100)}..."`
    );
  }
}

/**
 * Assert span has status OK
 */
export function assertSpanStatusOk(assertion: SpanAssertion): void {
  if (assertion.span.statusCode !== "OK") {
    throw new Error(
      `Span "${assertion.span.name}": expected status OK, got ${assertion.span.statusCode}`
    );
  }
}

/**
 * Get the span kind from either the top-level field or attribute
 */
export function getSpanKind(span: SpanNode): string | undefined {
  if (span.spanKind) return span.spanKind;
  const attrs = parseAttributes(span.attributes);
  return attrs["openinference.span.kind"] as string | undefined;
}

/**
 * Assert input.value and/or output.value are present
 */
export function assertInputOutput(
  assertion: SpanAssertion,
  options: { input?: boolean; output?: boolean; inputContains?: string; outputContains?: string } = {}
): void {
  const { input = true, output = true, inputContains, outputContains } = options;

  if (input) {
    const inputValue = assertion.attrs["input.value"];
    if (!inputValue || typeof inputValue !== "string") {
      throw new Error(
        `Span "${assertion.span.name}": expected input.value to be set, got ${typeof inputValue}`
      );
    }
    if (inputContains && !inputValue.includes(inputContains)) {
      throw new Error(
        `Span "${assertion.span.name}": expected input.value to contain "${inputContains}", ` +
          `got "${inputValue.slice(0, 100)}..."`
      );
    }
  }

  if (output) {
    const outputValue = assertion.attrs["output.value"];
    if (!outputValue || typeof outputValue !== "string") {
      throw new Error(
        `Span "${assertion.span.name}": expected output.value to be set, got ${typeof outputValue}`
      );
    }
    if (outputContains && !outputValue.includes(outputContains)) {
      throw new Error(
        `Span "${assertion.span.name}": expected output.value to contain "${outputContains}", ` +
          `got "${outputValue.slice(0, 100)}..."`
      );
    }
  }
}

/**
 * Assert token usage is present and valid
 */
export function assertTokenUsage(assertion: SpanAssertion): void {
  const inputTokens = assertion.attrs["gen_ai.usage.input_tokens"];
  const outputTokens = assertion.attrs["gen_ai.usage.output_tokens"];

  if (typeof inputTokens !== "number" || inputTokens <= 0) {
    throw new Error(
      `Span "${assertion.span.name}": expected input_tokens > 0, got ${inputTokens}`
    );
  }
  if (typeof outputTokens !== "number" || outputTokens <= 0) {
    throw new Error(
      `Span "${assertion.span.name}": expected output_tokens > 0, got ${outputTokens}`
    );
  }
}

/**
 * Assert model info is present
 */
export function assertModelInfo(assertion: SpanAssertion): void {
  const requestModel = assertion.attrs["gen_ai.request.model"];
  const responseModel = assertion.attrs["gen_ai.response.model"];

  if (!requestModel || typeof requestModel !== "string") {
    throw new Error(
      `Span "${assertion.span.name}": expected gen_ai.request.model to be set`
    );
  }
  if (!responseModel || typeof responseModel !== "string") {
    throw new Error(
      `Span "${assertion.span.name}": expected gen_ai.response.model to be set`
    );
  }
}

/**
 * Build a span tree for visualization
 */
export interface SpanTree {
  span: SpanAssertion;
  children: SpanTree[];
}

export function buildSpanTree(spans: SpanNode[]): SpanTree[] {
  const rootSpans = spans.filter((s) => !s.parentId);
  const trees: SpanTree[] = [];

  function buildTree(span: SpanNode): SpanTree {
    const children = findChildren(spans, span.context.spanId);
    return {
      span: { span, attrs: parseAttributes(span.attributes) },
      children: children.map(buildTree),
    };
  }

  for (const root of rootSpans) {
    trees.push(buildTree(root));
  }

  return trees;
}

/**
 * Print span tree for debugging
 */
export function printSpanTree(tree: SpanTree, indent = 0): void {
  const prefix = "  ".repeat(indent);
  const kind = getSpanKind(tree.span.span) || "?";
  console.log(`${prefix}${tree.span.span.name} [${kind}]`);

  for (const child of tree.children) {
    printSpanTree(child, indent + 1);
  }
}
