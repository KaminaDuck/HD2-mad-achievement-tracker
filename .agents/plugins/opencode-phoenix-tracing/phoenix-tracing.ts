/**
 * OpenCode Phoenix Tracing Plugin
 * Integrates Arize Phoenix for LLM observability via OpenTelemetry
 *
 * Creates spans for:
 * - AGENT: Overall turn/conversation
 * - LLM: Model inference (step-start to step-finish)
 * - TOOL: Tool executions
 */

import type { Plugin, PluginEvent } from "@opencode-ai/plugin";
import { register, trace, type NodeTracerProvider } from "@arizeai/phoenix-otel";
import {
  type Span,
  type Context,
  SpanKind,
  SpanStatusCode,
  context as otelContext,
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { BatchSpanProcessor, SimpleSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { appendFileSync } from "fs";

const TRACER_NAME = "opencode-phoenix";
const LOG_FILE = "/tmp/phoenix-tracing.log";
const DEBUG_ENABLED = process.env.OPENCODE_PHOENIX_DEBUG === "true";

// OTLP exporter configuration
const EXPORT_TIMEOUT_MS = 30000;
const BATCH_DELAY_MS = 1000;
const MAX_BATCH_SIZE = 512;

// Attribute truncation limits
const TOOL_ARGS_MAX_LEN = 1000;
const OUTPUT_MAX_LEN = 2000;
const INPUT_MAX_LEN = 2000;

let provider: NodeTracerProvider | null = null;

// Grouped tracing state for cleaner management
interface TracingState {
  sessionId: string | null;
  turnNumber: number;
  agentSpan: Span | null;
  agentContext: Context | null;
  llmSpan: Span | null;
  llmContext: Context | null;
  currentModelId: string | null;
  currentProviderId: string | null;
  accumulatedOutput: string;
  userInput: string;  // Track user prompt per turn for input.value
  pendingUserMessageId: string | null;  // Track user message ID to capture text from parts
}

const state: TracingState = {
  sessionId: null,
  turnNumber: 0,
  agentSpan: null,
  agentContext: null,
  llmSpan: null,
  llmContext: null,
  currentModelId: null,
  currentProviderId: null,
  accumulatedOutput: "",
  userInput: "",
  pendingUserMessageId: null,
};

// Tool span tracking - map toolId to span
const toolSpans = new Map<string, Span>();
// Track generated IDs for tools without IDs (keyed by tool name for fallback lookup)
const pendingToolIds = new Map<string, string>();
let toolIdCounter = 0;

function log(msg: string): void {
  if (!DEBUG_ENABLED) return;
  const ts = new Date().toISOString();
  try {
    appendFileSync(LOG_FILE, `[${ts}] ${msg}\n`);
  } catch {
    // Ignore write errors
  }
}

function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

async function forceFlush(): Promise<void> {
  if (!provider) return;
  try {
    await provider.forceFlush();
    log("forceFlush: complete");
  } catch (err) {
    log(`forceFlush: error - ${err}`);
  }
}

function initTracer(projectName: string): void {
  if (provider) return;

  const endpoint = process.env.PHOENIX_ENDPOINT || "http://localhost:19060";
  const useBatch = process.env.OPENCODE_PHOENIX_BATCH !== "false";

  log(`initTracer: endpoint=${endpoint}, project=${projectName}, batch=${useBatch}`);

  try {
    const exporter = new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
      timeoutMillis: EXPORT_TIMEOUT_MS,
    });

    const spanProcessor = useBatch
      ? new BatchSpanProcessor(exporter, {
          scheduledDelayMillis: BATCH_DELAY_MS,
          maxExportBatchSize: MAX_BATCH_SIZE,
        })
      : new SimpleSpanProcessor(exporter);

    provider = register({
      projectName: projectName,
      spanProcessors: [spanProcessor],
    });
    log("initTracer: provider registered with custom span processor");
  } catch (err) {
    log(`initTracer: error - ${err}`);
  }

  registerShutdownHandlers();
}

async function shutdown(): Promise<void> {
  log("shutdown: flushing");
  try {
    await forceFlush();
    await provider?.shutdown();
  } catch (err) {
    log(`shutdown: error - ${err}`);
  }
}

function registerShutdownHandlers(): void {
  const handleSignal = async () => {
    await shutdown();
    process.exit(0);
  };
  process.on("beforeExit", shutdown);
  process.on("SIGINT", handleSignal);
  process.on("SIGTERM", handleSignal);
}

function startAgentSpan(projectName: string): void {
  if (!state.sessionId || state.agentSpan) return;

  state.turnNumber++;
  log(`startAgentSpan: turn ${state.turnNumber} for session ${state.sessionId}`);
  const tracer = trace.getTracer(TRACER_NAME);

  const attributes: Record<string, string | number> = {
    "openinference.span.kind": "AGENT",
    "gen_ai.operation.name": "invoke_agent",
    "session.id": state.sessionId,
    "gen_ai.conversation.id": state.sessionId,
    "gen_ai.agent.name": "opencode",
    "gen_ai.agent.id": state.sessionId,
    "gen_ai.agent.iteration": state.turnNumber,
    "opencode.project": projectName,
  };

  // Set input.value if user input already captured
  if (state.userInput) {
    attributes["input.value"] = truncate(state.userInput, INPUT_MAX_LEN);
  }

  state.agentSpan = tracer.startSpan("agent.turn", {
    kind: SpanKind.INTERNAL,
    attributes,
  });
  state.agentContext = trace.setSpan(otelContext.active(), state.agentSpan);
  log(`startAgentSpan: created`);
}

function startLlmSpan(): void {
  if (!state.sessionId || state.llmSpan) return;

  log("startLlmSpan: creating LLM span");
  const tracer = trace.getTracer(TRACER_NAME);

  const attributes: Record<string, string | number> = {
    "openinference.span.kind": "LLM",
    "gen_ai.operation.name": "chat",
    "session.id": state.sessionId,
  };

  // Set input.value from user prompt
  if (state.userInput) {
    attributes["input.value"] = truncate(state.userInput, INPUT_MAX_LEN);
  }

  const parentContext = state.agentContext ?? otelContext.active();
  state.llmSpan = tracer.startSpan("llm.chat", {
    kind: SpanKind.INTERNAL,
    attributes,
  }, parentContext);
  state.llmContext = trace.setSpan(parentContext, state.llmSpan);
  state.accumulatedOutput = "";
  log("startLlmSpan: created");
}

interface StepFinishTokens {
  input?: number;
  output?: number;
  reasoning?: number;
  cache?: { read?: number; write?: number };
}

function setIfDefined(span: Span, key: string, value: unknown): void {
  if (value !== undefined) {
    span.setAttribute(key, value as string | number);
  }
}

function endLlmSpan(tokens?: StepFinishTokens, cost?: number, finishReason?: string): void {
  if (!state.llmSpan) {
    log("endLlmSpan: no span to end");
    return;
  }

  log(`endLlmSpan: tokens=${JSON.stringify(tokens)}, cost=${cost}, reason=${finishReason}`);

  const span = state.llmSpan;

  setIfDefined(span, "gen_ai.provider.name", state.currentProviderId);
  if (state.currentModelId) {
    span.setAttribute("gen_ai.request.model", state.currentModelId);
    span.setAttribute("gen_ai.response.model", state.currentModelId);
  }

  if (tokens) {
    setIfDefined(span, "gen_ai.usage.input_tokens", tokens.input);
    setIfDefined(span, "gen_ai.usage.output_tokens", tokens.output);
    if (tokens.reasoning && tokens.reasoning > 0) {
      span.setAttribute("gen_ai.usage.reasoning_tokens", tokens.reasoning);
    }
    setIfDefined(span, "gen_ai.usage.cache_read_tokens", tokens.cache?.read);
    setIfDefined(span, "gen_ai.usage.cache_write_tokens", tokens.cache?.write);
  }

  setIfDefined(span, "llm.cost", cost);

  if (finishReason) {
    span.setAttribute("gen_ai.response.finish_reasons", JSON.stringify([finishReason]));
  }

  if (state.accumulatedOutput) {
    const truncatedOutput = truncate(state.accumulatedOutput, OUTPUT_MAX_LEN);
    span.setAttribute("gen_ai.output.text", truncatedOutput);
    span.setAttribute("output.value", truncatedOutput);
  }

  span.setStatus({ code: SpanStatusCode.OK });
  span.end();

  state.llmSpan = null;
  state.llmContext = null;
  state.currentModelId = null;
  state.currentProviderId = null;
  // Note: Don't reset accumulatedOutput here - endAgentSpan needs it for agent output.value
  log("endLlmSpan: ended");
}

async function endAgentSpan(error?: Error): Promise<void> {
  // Capture accumulated output before potential endLlmSpan (which doesn't reset it anymore, but for safety)
  const agentOutput = state.accumulatedOutput;

  if (state.llmSpan) {
    endLlmSpan();
  }

  if (!state.agentSpan) {
    log("endAgentSpan: no span to end");
    return;
  }

  log(`endAgentSpan: error=${error?.message || "none"}`);

  // Set input.value if captured (may arrive after span start)
  if (state.userInput) {
    state.agentSpan.setAttribute("input.value", truncate(state.userInput, INPUT_MAX_LEN));
  }

  // Set output.value from accumulated assistant output (captured before endLlmSpan reset)
  if (agentOutput) {
    state.agentSpan.setAttribute("output.value", truncate(agentOutput, OUTPUT_MAX_LEN));
  }

  if (error) {
    state.agentSpan.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    state.agentSpan.recordException(error);
  } else {
    state.agentSpan.setStatus({ code: SpanStatusCode.OK });
  }

  state.agentSpan.end();
  state.agentSpan = null;
  state.agentContext = null;
  state.userInput = "";  // Reset for next turn
  state.pendingUserMessageId = null;  // Reset for next turn
  state.accumulatedOutput = "";  // Reset for next turn
  log("endAgentSpan: ended, flushing...");

  await forceFlush();
}

function resetState(): void {
  state.sessionId = null;
  state.agentSpan = null;
  state.agentContext = null;
  state.llmSpan = null;
  state.llmContext = null;
  state.turnNumber = 0;
  state.currentModelId = null;
  state.currentProviderId = null;
  state.accumulatedOutput = "";
  state.userInput = "";
  state.pendingUserMessageId = null;
  toolSpans.clear();
  pendingToolIds.clear();
  toolIdCounter = 0;
  log("resetState: cleared");
}

function createToolSpan(toolName: string, toolId: string, args: unknown): Span {
  log(`createToolSpan: tool=${toolName}, id=${toolId}`);
  const tracer = trace.getTracer(TRACER_NAME);

  const argsJson = truncate(JSON.stringify(args), TOOL_ARGS_MAX_LEN);
  const attributes: Record<string, string | number> = {
    "openinference.span.kind": "TOOL",
    "gen_ai.operation.name": "execute_tool",
    "gen_ai.tool.name": toolName,
    "gen_ai.tool.type": "function",
    "gen_ai.tool.call.id": toolId,
    "gen_ai.tool.call.arguments": argsJson,
    "input.value": argsJson,  // OpenInference standard
  };

  if (state.sessionId) {
    attributes["session.id"] = state.sessionId;
    attributes["gen_ai.conversation.id"] = state.sessionId;
  }

  const parentContext = state.llmContext ?? state.agentContext ?? otelContext.active();
  const span = tracer.startSpan(
    `execute_tool ${toolName}`,
    { kind: SpanKind.INTERNAL, attributes },
    parentContext
  );
  return span;
}

function endToolSpan(span: Span, result: unknown, error?: Error): void {
  if (error) {
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
    span.recordException(error);
  } else {
    span.setStatus({ code: SpanStatusCode.OK });
    if (result !== undefined) {
      const resultJson = truncate(JSON.stringify(result), OUTPUT_MAX_LEN);
      span.setAttribute("gen_ai.tool.call.result", resultJson);
      span.setAttribute("output.value", resultJson);  // OpenInference standard
    }
  }
  span.end();
  // No per-tool flush - batch processor handles it, agent span flush at turn end
}

interface Part {
  type: string;
  id?: string;
  messageID?: string;  // Links part to its parent message
  text?: string;
  reason?: string;
  cost?: number;
  tokens?: StepFinishTokens;
}

interface MessagePart {
  type: string;
  text?: string;
}

interface MessageInfo {
  id?: string;
  sessionID?: string;
  modelID?: string;
  providerID?: string;
  tokens?: StepFinishTokens;
  cost?: number;
  finish?: string;
  role?: string;
  parts?: MessagePart[];
}

function captureSessionId(properties: Record<string, unknown> | undefined): boolean {
  if (state.sessionId) return false;

  const info = properties?.info as { id?: string } | undefined;
  const sessionID = properties?.sessionID as string | undefined;
  const id = info?.id || sessionID;

  if (id) {
    state.sessionId = id;
    log(`captureSessionId: ${id}`);
    return true;
  }
  return false;
}

function generateToolId(toolName: string): string {
  toolIdCounter++;
  return `tool-${toolName}-${toolIdCounter}`;
}

export const PhoenixTracingPlugin: Plugin = async (input) => {
  log("PhoenixTracingPlugin: initializing");

  if (process.env.OPENCODE_PHOENIX_ENABLED === "false") {
    log("PhoenixTracingPlugin: disabled");
    return {};
  }

  // Allow override via env var for testing, otherwise auto-detect from directory
  const projectName = process.env.PHOENIX_PROJECT_NAME
    || input.directory.split("/").pop()
    || input.project.id;
  initTracer(projectName);
  log(`PhoenixTracingPlugin: initialized for project=${projectName}`);

  return {
    event: async ({ event }: { event: PluginEvent }) => {
      const properties = event.properties;
      const propKeys = properties ? Object.keys(properties).join(",") : "none";
      log(`event: ${event.type} [props: ${propKeys}]`);

      switch (event.type) {
        case "session.created": {
          // New session - reset state to track this session
          const info = properties?.info as { id?: string } | undefined;
          const newSessionId = info?.id;
          if (newSessionId && newSessionId !== state.sessionId) {
            log(`session.created: new session ${newSessionId}, resetting state`);
            resetState();
            state.sessionId = newSessionId;
          }
          state.turnNumber = 0;
          break;
        }
        case "session.updated": {
          captureSessionId(properties);
          break;
        }
        case "session.status": {
          captureSessionId(properties);
          const status = properties?.status as { type?: string } | undefined;
          if (status?.type === "busy" && state.sessionId && !state.agentSpan) {
            startAgentSpan(projectName);
          }
          break;
        }
        case "session.idle": {
          captureSessionId(properties);
          await endAgentSpan();
          break;
        }
        case "session.error": {
          await endAgentSpan(properties?.error as Error | undefined);
          resetState();
          break;
        }

        case "message.part.updated": {
          const part = properties?.part as Part | undefined;
          const delta = properties?.delta as string | undefined;

          if (!part?.type) break;

          log(`  part.type=${part.type}, messageID=${part.messageID}`);

          switch (part.type) {
            case "step-start":
              if (!state.agentSpan && state.sessionId) {
                startAgentSpan(projectName);
              }
              startLlmSpan();
              break;

            case "text":
              // Capture user input from user message parts (has part.text, not delta)
              if (part.text && part.messageID === state.pendingUserMessageId && !state.userInput) {
                state.userInput = part.text;
                state.pendingUserMessageId = null;  // Clear after capture
                log(`  captured userInput from part: ${state.userInput.slice(0, 50)}...`);
              }
              // Accumulate assistant output (streamed via delta)
              if (delta) {
                state.accumulatedOutput += delta;
              }
              break;

            case "step-finish":
              endLlmSpan(part.tokens, part.cost, part.reason);
              break;
          }
          break;
        }

        case "message.updated": {
          const info = properties?.info as MessageInfo | undefined;
          if (info) {
            if (info.modelID && !state.currentModelId) {
              state.currentModelId = info.modelID;
              log(`  captured modelID: ${state.currentModelId}`);
            }
            if (info.providerID && !state.currentProviderId) {
              state.currentProviderId = info.providerID;
              log(`  captured providerID: ${state.currentProviderId}`);
            }
            // Track user message ID so we can capture text from message.part.updated
            if (info.role === "user" && info.id && !state.userInput) {
              state.pendingUserMessageId = info.id;
              log(`  tracking user message: ${info.id}`);
            }
          }
          break;
        }
      }
    },

    "tool.execute.before": async (toolInput, toolOutput) => {
      const toolName = toolInput?.tool || "unknown";
      // Generate deterministic ID if missing, store for after hook
      const toolId = toolInput?.id || generateToolId(toolName);
      const args = toolOutput?.args || toolInput?.args || {};

      log(`tool.execute.before: tool=${toolName}, id=${toolId}`);

      // Store generated ID for lookup in after hook (keyed by tool name)
      if (!toolInput?.id) {
        pendingToolIds.set(toolName, toolId);
      }

      if (!state.agentSpan && state.sessionId) {
        startAgentSpan(projectName);
      }

      const span = createToolSpan(toolName, toolId, args);
      toolSpans.set(toolId, span);
    },

    "tool.execute.after": async (toolInput, toolOutput) => {
      const toolName = toolInput?.tool || "unknown";
      // Use provided ID or look up the generated one from before hook
      const toolId = toolInput?.id || pendingToolIds.get(toolName);
      log(`tool.execute.after: id=${toolId}`);

      if (!toolId) {
        log(`tool.execute.after: no tool ID found for ${toolName}`);
        return;
      }

      const span = toolSpans.get(toolId);
      if (span) {
        // Tool result is in output, not result
        endToolSpan(span, toolOutput?.output, toolOutput?.error);
        toolSpans.delete(toolId);
      }

      // Clean up pending ID
      if (!toolInput?.id) {
        pendingToolIds.delete(toolName);
      }
    },
  };
};

export default PhoenixTracingPlugin;
