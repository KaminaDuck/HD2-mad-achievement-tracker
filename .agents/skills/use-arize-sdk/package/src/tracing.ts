/**
 * Tracing setup helpers for Arize Phoenix
 *
 * Provides simplified utilities for initializing OpenTelemetry tracing
 * with Phoenix as the collector endpoint.
 */

import { trace, type Tracer, type Span } from "@opentelemetry/api";

export interface TracingConfig {
  projectName: string;
  endpoint?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

export interface RegisterResult {
  tracer: Tracer;
  provider: unknown;
}

/**
 * Initialize Phoenix tracing with sensible defaults
 *
 * IMPORTANT: Call this BEFORE importing any LLM SDK libraries
 * to ensure auto-instrumentation works correctly.
 *
 * @example
 * ```typescript
 * const { tracer } = await initTracing({
 *   projectName: "my-app",
 *   endpoint: "http://localhost:6006/v1/traces",
 * });
 *
 * // Now import and use LLM libraries
 * import OpenAI from "openai";
 * ```
 */
export async function initTracing(config: TracingConfig): Promise<RegisterResult> {
  const { register } = await import("@arizeai/phoenix-otel");

  const provider = register({
    projectName: config.projectName,
    endpoint: config.endpoint ?? process.env.PHOENIX_COLLECTOR_ENDPOINT,
    headers: config.headers,
  });

  const tracer = trace.getTracer(config.projectName);

  return { tracer, provider };
}

/**
 * Get the default endpoint from environment or use localhost
 */
export function getDefaultEndpoint(): string {
  return process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "http://localhost:6006/v1/traces";
}

/**
 * Check if tracing is properly configured
 */
export function isTracingConfigured(): boolean {
  return !!(
    process.env.PHOENIX_COLLECTOR_ENDPOINT ||
    process.env.PHOENIX_API_KEY
  );
}

/**
 * Create a traced wrapper for async functions
 *
 * @example
 * ```typescript
 * const tracedFetch = withTrace(tracer, "fetch-data", async (url: string) => {
 *   const response = await fetch(url);
 *   return response.json();
 * });
 *
 * const data = await tracedFetch("https://api.example.com/data");
 * ```
 */
export function withTrace<T extends (...args: unknown[]) => Promise<unknown>>(
  tracer: Tracer,
  spanName: string,
  fn: T
): T {
  return (async (...args: Parameters<T>) => {
    return tracer.startActiveSpan(spanName, async (span: Span) => {
      try {
        const result = await fn(...args);
        return result;
      } catch (error) {
        span.recordException(error as Error);
        throw error;
      } finally {
        span.end();
      }
    });
  }) as T;
}

/**
 * Run a function within a traced span
 *
 * @example
 * ```typescript
 * const result = await runInSpan(tracer, "process-data", async (span) => {
 *   span.setAttribute("input.size", data.length);
 *   const processed = await processData(data);
 *   span.setAttribute("output.size", processed.length);
 *   return processed;
 * });
 * ```
 */
export async function runInSpan<T>(
  tracer: Tracer,
  spanName: string,
  fn: (span: Span) => Promise<T>
): Promise<T> {
  return tracer.startActiveSpan(spanName, async (span: Span) => {
    try {
      return await fn(span);
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}
