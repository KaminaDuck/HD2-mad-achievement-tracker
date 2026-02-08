/**
 * Evaluation helpers for Phoenix
 *
 * Provides utilities for running LLM-as-judge evaluations
 * and experiments against datasets.
 */

export interface EvaluationResult {
  score: number;
  label?: string;
  explanation?: string;
}

export interface ExperimentResult {
  experimentId: string;
  datasetName: string;
  results: Array<{
    exampleId: string;
    output: unknown;
    evaluations: Record<string, EvaluationResult>;
  }>;
}

export type EvaluatorFn = (params: {
  input: Record<string, unknown>;
  output: unknown;
  expected?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}) => Promise<EvaluationResult>;

/**
 * Create a simple evaluator function
 *
 * @example
 * ```typescript
 * const lengthEvaluator = createEvaluator("length-check", async ({ output }) => {
 *   const text = String(output);
 *   return {
 *     score: text.length > 100 ? 1.0 : 0.5,
 *     label: text.length > 100 ? "sufficient" : "too_short",
 *   };
 * });
 * ```
 */
export function createEvaluator(
  name: string,
  fn: EvaluatorFn
): { name: string; evaluate: EvaluatorFn } {
  return { name, evaluate: fn };
}

/**
 * Run an experiment with a task function and evaluators
 *
 * @example
 * ```typescript
 * const results = await runExperiment({
 *   datasetName: "qa-dataset",
 *   task: async (example) => {
 *     const response = await llm.generate(example.input.question);
 *     return response;
 *   },
 *   evaluators: [
 *     createEvaluator("relevance", async ({ input, output }) => {
 *       // Check if output is relevant to input
 *       return { score: 0.9, label: "relevant" };
 *     }),
 *   ],
 * });
 * ```
 */
export async function runExperiment(options: {
  datasetName: string;
  task: (example: {
    input: Record<string, unknown>;
    expected?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }) => Promise<unknown>;
  evaluators: Array<{ name: string; evaluate: EvaluatorFn }>;
  experimentName?: string;
}): Promise<ExperimentResult> {
  const { runExperiment: phoenixRunExperiment } = await import(
    "@arizeai/phoenix-client"
  );
  const { asEvaluator } = await import("@arizeai/phoenix-client/experiments");

  const phoenixEvaluators = options.evaluators.map((e) =>
    asEvaluator(e.name, e.evaluate)
  );

  const result = await phoenixRunExperiment({
    dataset: { name: options.datasetName },
    task: options.task,
    evaluators: phoenixEvaluators,
    experimentName: options.experimentName,
  });

  return {
    experimentId: result.experimentId,
    datasetName: options.datasetName,
    results: result.results,
  };
}

/**
 * Built-in evaluator: Check if output contains expected keywords
 */
export const keywordEvaluator = createEvaluator(
  "keyword-match",
  async ({ output, expected }) => {
    const outputStr = String(output).toLowerCase();
    const keywords = (expected?.keywords as string[]) ?? [];

    if (keywords.length === 0) {
      return { score: 1.0, label: "no_keywords" };
    }

    const matchCount = keywords.filter((k) =>
      outputStr.includes(k.toLowerCase())
    ).length;

    const score = matchCount / keywords.length;
    return {
      score,
      label: score >= 0.8 ? "pass" : score >= 0.5 ? "partial" : "fail",
      explanation: `Matched ${matchCount}/${keywords.length} keywords`,
    };
  }
);

/**
 * Built-in evaluator: Check output length constraints
 */
export const lengthEvaluator = createEvaluator(
  "length-check",
  async ({ output, expected }) => {
    const text = String(output);
    const minLength = (expected?.minLength as number) ?? 0;
    const maxLength = (expected?.maxLength as number) ?? Infinity;

    const withinBounds = text.length >= minLength && text.length <= maxLength;

    return {
      score: withinBounds ? 1.0 : 0.0,
      label: withinBounds ? "valid" : "invalid",
      explanation: `Length: ${text.length} (min: ${minLength}, max: ${maxLength})`,
    };
  }
);

/**
 * Built-in evaluator: Check for valid JSON output
 */
export const jsonEvaluator = createEvaluator(
  "json-valid",
  async ({ output }) => {
    try {
      if (typeof output === "string") {
        JSON.parse(output);
      } else if (typeof output === "object") {
        JSON.stringify(output);
      }
      return { score: 1.0, label: "valid_json" };
    } catch {
      return { score: 0.0, label: "invalid_json" };
    }
  }
);

/**
 * Create an LLM-as-judge evaluator using Phoenix evals
 *
 * @example
 * ```typescript
 * const relevanceEval = await createLLMEvaluator({
 *   name: "relevance",
 *   model: "gpt-4o",
 *   template: `
 *     Given the question and answer, rate the relevance from 0 to 1.
 *     Question: {input.question}
 *     Answer: {output}
 *     Score (0-1):
 *   `,
 * });
 * ```
 */
export async function createLLMEvaluator(options: {
  name: string;
  model: string;
  template: string;
  parseScore?: (response: string) => number;
}): Promise<{ name: string; evaluate: EvaluatorFn }> {
  return createEvaluator(options.name, async ({ input, output, expected }) => {
    // This is a placeholder - actual implementation would use phoenix-evals
    // or direct LLM calls to evaluate
    const prompt = options.template
      .replace("{input}", JSON.stringify(input))
      .replace("{output}", JSON.stringify(output))
      .replace("{expected}", JSON.stringify(expected ?? {}));

    // In production, this would call the LLM and parse the response
    console.log(`[LLM Eval] ${options.name}: ${prompt.slice(0, 100)}...`);

    return {
      score: 0.5,
      label: "pending",
      explanation: "LLM evaluation placeholder",
    };
  });
}
