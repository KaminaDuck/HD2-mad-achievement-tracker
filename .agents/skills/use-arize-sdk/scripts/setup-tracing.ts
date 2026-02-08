#!/usr/bin/env bun
/**
 * Setup Tracing Script
 *
 * Initializes Phoenix tracing configuration in a project.
 * Creates/updates environment files and installs dependencies.
 *
 * Usage:
 *   bun run skills/observability/use-arize-sdk/scripts/setup-tracing.ts [options]
 *
 * Options:
 *   --project <name>    Project name for traces (default: basename of cwd)
 *   --endpoint <url>    Phoenix collector endpoint
 *   --env-file <path>   Path to .env file (default: .env)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { parseArgs } from "node:util";

interface SetupOptions {
  project: string;
  endpoint: string;
  envFile: string;
}

function parseCliArgs(): SetupOptions {
  const { values } = parseArgs({
    options: {
      project: { type: "string", short: "p" },
      endpoint: { type: "string", short: "e" },
      "env-file": { type: "string" },
    },
  });

  return {
    project: values.project ?? basename(process.cwd()),
    endpoint: values.endpoint ?? "http://localhost:6006/v1/traces",
    envFile: values["env-file"] ?? ".env",
  };
}

function updateEnvFile(options: SetupOptions): void {
  const envPath = resolve(process.cwd(), options.envFile);
  let content = "";

  if (existsSync(envPath)) {
    content = readFileSync(envPath, "utf-8");
  }

  const envVars: Record<string, string> = {
    PHOENIX_COLLECTOR_ENDPOINT: options.endpoint,
    PHOENIX_PROJECT_NAME: options.project,
  };

  for (const [key, value] of Object.entries(envVars)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    const line = `${key}=${value}`;

    if (regex.test(content)) {
      content = content.replace(regex, line);
    } else {
      content = content.trim() + "\n" + line + "\n";
    }
  }

  writeFileSync(envPath, content.trim() + "\n");
  console.log(`Updated ${options.envFile} with Phoenix configuration`);
}

function generateTracingSetup(options: SetupOptions): string {
  return `// Phoenix Tracing Setup
// Add this to the top of your application entry point (before importing LLM libraries)

import { register } from "@arizeai/phoenix-otel";

// Initialize tracing
register({
  projectName: "${options.project}",
  endpoint: process.env.PHOENIX_COLLECTOR_ENDPOINT ?? "${options.endpoint}",
});

// Now import your LLM libraries
// import OpenAI from "openai";
// import Anthropic from "@anthropic-ai/sdk";
// import { generateText } from "ai";
`;
}

function printInstructions(options: SetupOptions): void {
  console.log("\n=== Phoenix Tracing Setup ===\n");

  console.log("1. Install dependencies:");
  console.log("   bun add @arizeai/phoenix-otel @opentelemetry/api\n");

  console.log("2. Add to your entry point (BEFORE importing LLM libraries):\n");
  console.log(generateTracingSetup(options));

  console.log("\n3. Environment variables set:");
  console.log(`   PHOENIX_COLLECTOR_ENDPOINT=${options.endpoint}`);
  console.log(`   PHOENIX_PROJECT_NAME=${options.project}\n`);

  console.log("4. Start Phoenix (if self-hosted):");
  console.log("   docker run -p 6006:6006 arizephoenix/phoenix:latest\n");

  console.log("5. View traces at:");
  console.log(`   ${options.endpoint.replace("/v1/traces", "")}\n`);
}

async function main() {
  const options = parseCliArgs();

  console.log(`Setting up Phoenix tracing for: ${options.project}`);
  console.log(`Endpoint: ${options.endpoint}`);

  updateEnvFile(options);
  printInstructions(options);
}

main().catch(console.error);
