/**
 * Phoenix Client Helper
 * Uses the @arizeai/phoenix-client SDK for querying traces
 */

import { createClient } from "@arizeai/phoenix-client";
import { sleep } from "./test-utils";

const PHOENIX_URL = process.env.PHOENIX_ENDPOINT || "http://localhost:19060";

// Will be set by detectPhoenixProject() after querying OpenCode
let PHOENIX_PROJECT = process.env.PHOENIX_PROJECT_NAME || "";

// Create Phoenix client
const phoenix = createClient({
  options: {
    baseUrl: PHOENIX_URL,
  },
});

/**
 * Detect Phoenix project name from OpenCode's current project directory.
 * Must be called before using PHOENIX_PROJECT if env var is not set.
 */
export async function detectPhoenixProject(opencodeUrl: string): Promise<string> {
  if (PHOENIX_PROJECT) {
    return PHOENIX_PROJECT;
  }

  // Import OpenCode SDK dynamically to avoid circular deps
  const { createOpencodeClient } = await import("@opencode-ai/sdk/v2");
  const client = createOpencodeClient({ baseUrl: opencodeUrl });

  const { data: project } = await client.project.current();
  if (!project?.worktree) {
    throw new Error("Could not get current project from OpenCode");
  }

  // Match plugin behavior: extract directory name from path
  PHOENIX_PROJECT = project.worktree.split("/").pop() || "default";
  return PHOENIX_PROJECT;
}

/**
 * Get the current Phoenix project name (must call detectPhoenixProject first if env var not set)
 */
export function getPhoenixProject(): string {
  if (!PHOENIX_PROJECT) {
    throw new Error("PHOENIX_PROJECT not set. Call detectPhoenixProject() first or set PHOENIX_PROJECT_NAME env var");
  }
  return PHOENIX_PROJECT;
}

export interface SpanNode {
  name: string;
  spanKind: string;
  parentId: string | null;
  context: { traceId: string; spanId: string };
  attributes: string;
  statusCode: string;
  startTime: string;
  endTime: string;
}

export interface ParsedAttributes {
  "openinference.span.kind"?: string;
  "session.id"?: string;
  "gen_ai.agent.iteration"?: number;
  "gen_ai.tool.name"?: string;
  "gen_ai.tool.call.arguments"?: string;
  "gen_ai.tool.call.result"?: string;
  "gen_ai.usage.input_tokens"?: number;
  "gen_ai.usage.output_tokens"?: number;
  "gen_ai.request.model"?: string;
  "gen_ai.response.model"?: string;
  "gen_ai.output.text"?: string;
  "input.value"?: string;
  "output.value"?: string;
  [key: string]: unknown;
}

export interface ProjectInfo {
  id: string;
  name: string;
}

/**
 * Check if Phoenix is running
 */
export async function isPhoenixRunning(): Promise<boolean> {
  try {
    const { data, error } = await phoenix.GET("/v1/projects");
    return !error && data !== undefined;
  } catch {
    return false;
  }
}

/**
 * Get all projects
 */
export async function getProjects(): Promise<ProjectInfo[]> {
  const { data, error } = await phoenix.GET("/v1/projects");
  if (error || !data) {
    throw new Error(`Failed to get projects: ${error}`);
  }
  return data.data.map((p) => ({
    id: p.id,
    name: p.name,
  }));
}

/**
 * Ensure the test project exists, create if not
 */
export async function ensureTestProject(): Promise<ProjectInfo> {
  const projectName = getPhoenixProject();
  const projects = await getProjects();
  const existing = projects.find((p) => p.name === projectName);

  if (existing) {
    return existing;
  }

  // Create the project
  const { data, error } = await phoenix.POST("/v1/projects", {
    body: {
      name: projectName,
      description: "OpenCode Phoenix tracing project",
    },
  });

  if (error || !data) {
    throw new Error(`Failed to create project: ${error}`);
  }

  return {
    id: data.data.id,
    name: data.data.name,
  };
}

/**
 * Get the test project (must exist)
 */
export async function getTestProject(): Promise<ProjectInfo | null> {
  const projectName = getPhoenixProject();
  const projects = await getProjects();
  return projects.find((p) => p.name === projectName) || null;
}

/**
 * Get spans for a project
 */
export async function getProjectSpans(
  projectName: string,
  limit = 100
): Promise<SpanNode[]> {
  const { data, error } = await phoenix.GET("/v1/projects/{project_identifier}/spans", {
    params: {
      path: { project_identifier: projectName },
      query: { limit },
    },
  });

  if (error || !data) {
    console.error("Failed to get spans:", error);
    return [];
  }

  return data.data.map((span) => ({
    name: span.name,
    spanKind: span.span_kind || "",
    parentId: span.parent_id || null,
    context: {
      traceId: span.context.trace_id || "",
      spanId: span.context.span_id || "",
    },
    attributes: JSON.stringify(span.attributes || {}),
    statusCode: span.status_code || "UNSET",
    startTime: span.start_time || "",
    endTime: span.end_time || "",
  }));
}

/**
 * Get spans filtered by session ID
 */
export async function getSpansBySessionId(
  projectName: string,
  sessionId: string
): Promise<SpanNode[]> {
  const allSpans = await getProjectSpans(projectName, 500);

  return allSpans.filter((span) => {
    const attrs = parseAttributes(span.attributes);
    return attrs["session.id"] === sessionId;
  });
}

/**
 * Parse span attributes from JSON string
 */
export function parseAttributes(attributesJson: string): ParsedAttributes {
  try {
    const parsed = JSON.parse(attributesJson || "{}");

    // Flatten nested attributes
    const flattened: ParsedAttributes = {};

    function flatten(obj: Record<string, unknown>, prefix = ""): void {
      for (const [key, value] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        if (value && typeof value === "object" && !Array.isArray(value)) {
          flatten(value as Record<string, unknown>, fullKey);
        } else {
          flattened[fullKey] = value;
        }
      }
    }

    flatten(parsed);
    return flattened;
  } catch {
    return {};
  }
}

/**
 * Group spans by trace ID
 */
export function groupByTraceId(spans: SpanNode[]): Map<string, SpanNode[]> {
  const groups = new Map<string, SpanNode[]>();

  for (const span of spans) {
    const traceId = span.context.traceId;
    if (!groups.has(traceId)) {
      groups.set(traceId, []);
    }
    groups.get(traceId)!.push(span);
  }

  return groups;
}

/**
 * Find root spans (no parent)
 */
export function findRootSpans(spans: SpanNode[]): SpanNode[] {
  return spans.filter((s) => !s.parentId);
}

/**
 * Find children of a span
 */
export function findChildren(spans: SpanNode[], parentSpanId: string): SpanNode[] {
  return spans.filter((s) => s.parentId === parentSpanId);
}

/**
 * Wait for spans to appear for a session
 * Default polling interval optimized for fast test execution
 */
export async function waitForSpans(
  projectName: string,
  sessionId: string,
  options: { minSpans?: number; timeout?: number; pollInterval?: number } = {}
): Promise<SpanNode[]> {
  const { minSpans = 1, timeout = 30000, pollInterval = 200 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const spans = await getSpansBySessionId(projectName, sessionId);
    if (spans.length >= minSpans) {
      return spans;
    }
    await sleep(pollInterval);
  }

  const finalSpans = await getSpansBySessionId(projectName, sessionId);
  throw new Error(
    `Timeout waiting for ${minSpans} spans for session ${sessionId} ` +
      `(got ${finalSpans.length})`
  );
}

export { PHOENIX_URL, PHOENIX_PROJECT };
