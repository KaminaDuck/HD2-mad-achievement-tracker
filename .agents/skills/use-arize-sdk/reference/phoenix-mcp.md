# @arizeai/phoenix-mcp

Model Context Protocol (MCP) server for integration with AI assistants like Claude Desktop, Cursor, and other MCP clients.

## Features

- **Prompts Management** — Create, list, update prompts via MCP tools
- **Datasets** — Explore and synthesize dataset examples
- **Experiments** — Pull and visualize experiment results
- **Traces** — Query and analyze traces

## Installation

```bash
npm install -g @arizeai/phoenix-mcp
# or
npx @arizeai/phoenix-mcp
```

## Quick Start

### 1. Start Phoenix Server

```bash
docker run -p 6006:6006 arizephoenix/phoenix:latest
```

### 2. Configure MCP Client

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "phoenix": {
      "command": "npx",
      "args": ["@arizeai/phoenix-mcp"],
      "env": {
        "PHOENIX_BASE_URL": "http://localhost:6006"
      }
    }
  }
}
```

### 3. Use Phoenix Tools

Once configured, you can use Phoenix tools in your AI assistant:

- "List all prompts in Phoenix"
- "Show me the latest traces from my-project"
- "Get dataset examples from qa-dataset"

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PHOENIX_BASE_URL` | Phoenix server URL | `http://localhost:6006` |
| `PHOENIX_API_KEY` | API key for authentication | - |

### Claude Desktop Configuration

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "phoenix": {
      "command": "npx",
      "args": ["@arizeai/phoenix-mcp"],
      "env": {
        "PHOENIX_BASE_URL": "http://localhost:6006",
        "PHOENIX_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Cursor Configuration

Add to your Cursor MCP settings:

```json
{
  "phoenix": {
    "command": "npx",
    "args": ["@arizeai/phoenix-mcp"],
    "env": {
      "PHOENIX_BASE_URL": "http://localhost:6006"
    }
  }
}
```

## Available Tools

### Prompts

| Tool | Description |
|------|-------------|
| `phoenix_list_prompts` | List all prompts |
| `phoenix_get_prompt` | Get prompt by name |
| `phoenix_create_prompt` | Create a new prompt |
| `phoenix_update_prompt` | Update existing prompt |

**Example Usage:**
- "Show me all prompts in Phoenix"
- "Get the 'qa-system' prompt"
- "Create a new prompt called 'summarizer' with template..."

### Datasets

| Tool | Description |
|------|-------------|
| `phoenix_list_datasets` | List all datasets |
| `phoenix_get_dataset` | Get dataset with examples |
| `phoenix_get_dataset_examples` | Get specific examples |

**Example Usage:**
- "List all datasets"
- "Show 10 examples from the 'evaluation-data' dataset"
- "Get dataset statistics for 'user-queries'"

### Traces

| Tool | Description |
|------|-------------|
| `phoenix_list_traces` | List traces by project |
| `phoenix_get_trace` | Get trace details |
| `phoenix_get_trace_spans` | Get spans for a trace |

**Example Usage:**
- "Show recent traces from 'production' project"
- "Get details for trace abc123"
- "Show all spans in the latest trace"

### Experiments

| Tool | Description |
|------|-------------|
| `phoenix_list_experiments` | List experiments |
| `phoenix_get_experiment` | Get experiment results |

**Example Usage:**
- "List all experiments"
- "Show results for experiment 'gpt4-eval-v2'"

## Workflow Examples

### Prompt Iteration

1. Ask your AI assistant to fetch the current prompt
2. Review and suggest modifications
3. Update the prompt directly through MCP

```
You: Get the "customer-support" prompt from Phoenix
AI: [Uses phoenix_get_prompt] Here's the current prompt...

You: Update it to be more concise
AI: [Uses phoenix_update_prompt] Updated the prompt...
```

### Trace Analysis

1. Query recent traces for a project
2. Identify problematic traces
3. Drill down into span details

```
You: Show traces from "production" with errors
AI: [Uses phoenix_list_traces] Found 3 traces with errors...

You: Show details for trace xyz789
AI: [Uses phoenix_get_trace_spans] Here are the spans...
```

### Dataset Exploration

1. List available datasets
2. Sample examples from a dataset
3. Analyze patterns

```
You: What datasets do we have?
AI: [Uses phoenix_list_datasets] You have 5 datasets...

You: Show me 5 random examples from "user-queries"
AI: [Uses phoenix_get_dataset_examples] Here are the examples...
```

## Troubleshooting

### Connection Issues

1. Verify Phoenix is running: `curl http://localhost:6006/health`
2. Check `PHOENIX_BASE_URL` is correct
3. Ensure no firewall blocking the connection

### Authentication Errors

1. Verify `PHOENIX_API_KEY` is set correctly
2. Check the API key has proper permissions
3. Ensure the key hasn't expired

### Tool Not Found

1. Restart your MCP client (Claude Desktop, Cursor)
2. Check the MCP configuration is valid JSON
3. Verify the command and args are correct

## Related

- [Phoenix Client](phoenix-client.md) - Programmatic API access
- [Phoenix OTEL](phoenix-otel.md) - Tracing setup
