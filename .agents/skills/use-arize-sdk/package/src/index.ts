/**
 * Arize Phoenix SDK Helpers
 *
 * A collection of utilities for working with the Arize Phoenix
 * observability platform in TypeScript/Node.js applications.
 */

// Tracing utilities
export {
  initTracing,
  getDefaultEndpoint,
  isTracingConfigured,
  withTrace,
  runInSpan,
  type TracingConfig,
  type RegisterResult,
} from "./tracing";

// Phoenix client utilities
export {
  getPhoenixClient,
  checkHealth,
  fetchRecentTraces,
  getPromptByName,
  getDatasetByName,
  uploadDataset,
  listProjects,
  getProject,
  type PhoenixClientConfig,
  type TraceInfo,
  type DatasetExample,
} from "./client";

// Evaluation utilities
export {
  createEvaluator,
  runExperiment,
  keywordEvaluator,
  lengthEvaluator,
  jsonEvaluator,
  createLLMEvaluator,
  type EvaluationResult,
  type ExperimentResult,
  type EvaluatorFn,
} from "./evals";
