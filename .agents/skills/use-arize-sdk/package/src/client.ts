/**
 * Phoenix client utilities
 *
 * Provides helper functions for interacting with the Phoenix API
 * for prompts, datasets, experiments, and traces.
 */

export interface PhoenixClientConfig {
  baseUrl?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

export interface TraceInfo {
  traceId: string;
  projectName: string;
  rootSpanName: string;
  startTime: string;
  endTime?: string;
  status: "OK" | "ERROR" | "UNSET";
  latencyMs?: number;
}

export interface DatasetExample {
  id: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

/**
 * Create a Phoenix client with default configuration
 *
 * @example
 * ```typescript
 * const phoenix = await getPhoenixClient();
 * const health = await phoenix.GET("/v1/health");
 * ```
 */
export async function getPhoenixClient(config?: PhoenixClientConfig) {
  const { createClient } = await import("@arizeai/phoenix-client");

  return createClient({
    baseUrl: config?.baseUrl ?? process.env.PHOENIX_COLLECTOR_ENDPOINT?.replace("/v1/traces", ""),
    headers: {
      ...(config?.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      ...config?.headers,
    },
  });
}

/**
 * Check Phoenix server health
 */
export async function checkHealth(config?: PhoenixClientConfig): Promise<boolean> {
  try {
    const client = await getPhoenixClient(config);
    const response = await client.GET("/v1/health");
    return response.response.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch recent traces from Phoenix
 *
 * @example
 * ```typescript
 * const traces = await fetchRecentTraces({
 *   projectName: "my-project",
 *   limit: 10,
 * });
 * ```
 */
export async function fetchRecentTraces(options: {
  projectName?: string;
  limit?: number;
  config?: PhoenixClientConfig;
}): Promise<TraceInfo[]> {
  const client = await getPhoenixClient(options.config);

  const response = await client.GET("/v1/traces", {
    params: {
      query: {
        project_name: options.projectName,
        limit: options.limit ?? 20,
      },
    },
  });

  if (!response.data) {
    return [];
  }

  return (response.data as unknown[]).map((trace: unknown) => {
    const t = trace as Record<string, unknown>;
    return {
      traceId: t.trace_id as string,
      projectName: t.project_name as string,
      rootSpanName: t.root_span_name as string,
      startTime: t.start_time as string,
      endTime: t.end_time as string | undefined,
      status: t.status as "OK" | "ERROR" | "UNSET",
      latencyMs: t.latency_ms as number | undefined,
    };
  });
}

/**
 * Get a prompt by name
 *
 * @example
 * ```typescript
 * const prompt = await getPromptByName("my-prompt");
 * ```
 */
export async function getPromptByName(
  name: string,
  options?: {
    version?: string;
    config?: PhoenixClientConfig;
  }
) {
  const { getPrompt } = await import("@arizeai/phoenix-client");

  return getPrompt({
    name,
    version: options?.version,
  });
}

/**
 * Get a dataset by name
 *
 * @example
 * ```typescript
 * const dataset = await getDatasetByName("my-dataset");
 * for await (const example of dataset.examples) {
 *   console.log(example);
 * }
 * ```
 */
export async function getDatasetByName(
  name: string,
  config?: PhoenixClientConfig
) {
  const { getDataset } = await import("@arizeai/phoenix-client");

  return getDataset({ name });
}

/**
 * Upload a new dataset
 *
 * @example
 * ```typescript
 * await uploadDataset({
 *   name: "test-dataset",
 *   examples: [
 *     { input: { query: "What is AI?" }, output: { response: "..." } },
 *   ],
 * });
 * ```
 */
export async function uploadDataset(options: {
  name: string;
  examples: Array<{
    input: Record<string, unknown>;
    output?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }>;
  description?: string;
  config?: PhoenixClientConfig;
}) {
  const client = await getPhoenixClient(options.config);

  const response = await client.POST("/v1/datasets/upload", {
    body: {
      name: options.name,
      description: options.description,
      inputs: options.examples.map((e) => e.input),
      outputs: options.examples.map((e) => e.output ?? {}),
      metadata: options.examples.map((e) => e.metadata ?? {}),
    },
  });

  return response.data;
}

/**
 * List all projects in Phoenix
 */
export async function listProjects(config?: PhoenixClientConfig) {
  const client = await getPhoenixClient(config);
  const response = await client.GET("/v1/projects");
  return response.data;
}

/**
 * Get project details by name
 */
export async function getProject(
  projectName: string,
  config?: PhoenixClientConfig
) {
  const client = await getPhoenixClient(config);
  const response = await client.GET("/v1/projects/{project_name}", {
    params: { path: { project_name: projectName } },
  });
  return response.data;
}
