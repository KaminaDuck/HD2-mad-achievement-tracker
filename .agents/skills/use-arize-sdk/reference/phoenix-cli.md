# @arizeai/phoenix-cli

Command-line interface for interacting with Arize Phoenix. Query traces, manage prompts, run evaluations, and more from the terminal.

## Installation

```bash
npm install -g @arizeai/phoenix-cli
# or
npx @arizeai/phoenix-cli
```

## Quick Start

```bash
# Set Phoenix endpoint
export PHOENIX_HOST=http://localhost:6006

# List projects
phoenix projects list

# Get recent traces
phoenix traces list --project my-app

# Get prompt
phoenix prompts get my-prompt
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PHOENIX_HOST` | Phoenix server URL | `http://localhost:6006` |
| `PHOENIX_API_KEY` | API key for authentication | - |

### Config File

Create `~/.phoenix/config.yaml`:

```yaml
host: http://localhost:6006
api_key: your-api-key
default_project: my-app
```

## Commands

### Projects

```bash
# List all projects
phoenix projects list

# Get project details
phoenix projects get <project-name>

# Create project
phoenix projects create <project-name>
```

### Traces

```bash
# List traces
phoenix traces list [options]

Options:
  --project, -p    Project name
  --limit, -n      Number of traces (default: 20)
  --status         Filter by status (ok, error)
  --json           Output as JSON

# Examples
phoenix traces list --project my-app --limit 10
phoenix traces list -p my-app --status error
phoenix traces list -p my-app --json | jq '.[] | .trace_id'
```

```bash
# Get trace details
phoenix traces get <trace-id>

# Get trace spans
phoenix traces spans <trace-id>
```

### Prompts

```bash
# List prompts
phoenix prompts list

# Get prompt
phoenix prompts get <prompt-name> [--version <version>]

# Create prompt
phoenix prompts create <name> --template <template>

# Update prompt
phoenix prompts update <name> --template <template>
```

### Datasets

```bash
# List datasets
phoenix datasets list

# Get dataset info
phoenix datasets get <dataset-name>

# Get dataset examples
phoenix datasets examples <dataset-name> [--limit 10]

# Upload dataset from file
phoenix datasets upload <name> --file <path.json>
```

### Experiments

```bash
# List experiments
phoenix experiments list

# Get experiment details
phoenix experiments get <experiment-id>

# Get experiment results
phoenix experiments results <experiment-id>
```

### Health

```bash
# Check Phoenix server health
phoenix health
```

## Output Formats

### Table (default)

```bash
$ phoenix traces list --project my-app

TRACE_ID                              STATUS   DURATION   ROOT_SPAN
abc123...                             OK       1.23s      chat-completion
def456...                             ERROR    0.45s      rag-query
```

### JSON

```bash
$ phoenix traces list --project my-app --json
[
  {
    "trace_id": "abc123...",
    "status": "OK",
    "duration_ms": 1230,
    "root_span_name": "chat-completion"
  }
]
```

### Quiet

```bash
$ phoenix traces list --project my-app --quiet
abc123
def456
```

## Examples

### Debug a Failed Trace

```bash
# Find error traces
phoenix traces list -p production --status error --limit 5

# Get trace details
phoenix traces get abc123

# View all spans
phoenix traces spans abc123
```

### Export Traces for Analysis

```bash
# Export recent traces as JSON
phoenix traces list -p my-app --limit 100 --json > traces.json

# Process with jq
cat traces.json | jq '.[] | select(.status == "ERROR") | .trace_id'
```

### Prompt Version Control

```bash
# Get current prompt
phoenix prompts get customer-support > prompt-v1.txt

# Update prompt
phoenix prompts update customer-support --template "$(cat prompt-v2.txt)"

# Get specific version
phoenix prompts get customer-support --version 1
```

### Dataset Management

```bash
# Create dataset from JSON file
cat > dataset.json << 'EOF'
{
  "name": "qa-examples",
  "inputs": [
    {"question": "What is AI?"},
    {"question": "Explain ML"}
  ],
  "outputs": [
    {"answer": "AI is..."},
    {"answer": "ML is..."}
  ]
}
EOF

phoenix datasets upload qa-examples --file dataset.json

# Verify
phoenix datasets get qa-examples
phoenix datasets examples qa-examples --limit 5
```

## Scripting

### Bash Integration

```bash
#!/bin/bash
# monitor-errors.sh - Monitor for new error traces

PROJECT="production"
LAST_CHECK=$(date -u +%Y-%m-%dT%H:%M:%SZ)

while true; do
  errors=$(phoenix traces list -p $PROJECT --status error --since $LAST_CHECK --json)
  count=$(echo "$errors" | jq '. | length')

  if [ "$count" -gt 0 ]; then
    echo "Found $count new error traces!"
    echo "$errors" | jq '.[].trace_id'
  fi

  LAST_CHECK=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  sleep 60
done
```

### CI/CD Integration

```bash
# .github/workflows/eval.yml
- name: Run Evaluations
  run: |
    export PHOENIX_HOST=${{ secrets.PHOENIX_HOST }}
    export PHOENIX_API_KEY=${{ secrets.PHOENIX_API_KEY }}

    # Upload test dataset
    phoenix datasets upload ci-test --file tests/dataset.json

    # Run experiment (via phoenix-client script)
    npm run evaluate

    # Check results
    phoenix experiments results $EXPERIMENT_ID --json > results.json
    score=$(cat results.json | jq '.avg_score')

    if (( $(echo "$score < 0.8" | bc -l) )); then
      echo "Evaluation score too low: $score"
      exit 1
    fi
```

## Troubleshooting

### Connection Refused

```bash
# Check if Phoenix is running
curl -s http://localhost:6006/health

# Try with explicit host
phoenix --host http://localhost:6006 health
```

### Authentication Failed

```bash
# Verify API key
echo $PHOENIX_API_KEY

# Test with explicit key
phoenix --api-key your-key health
```

### Command Not Found

```bash
# If installed globally
which phoenix

# Use npx
npx @arizeai/phoenix-cli health
```

## Related

- [Phoenix Client](phoenix-client.md) - Programmatic API access
- [Phoenix OTEL](phoenix-otel.md) - Tracing setup
