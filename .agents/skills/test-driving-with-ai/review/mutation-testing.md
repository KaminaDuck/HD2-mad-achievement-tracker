# Mutation Testing Guide

## Overview

Mutation testing reveals the gap between coverage and quality. Line coverage tells you code was executed; mutation testing tells you whether tests would catch bugs in that code.

**Key statistic**: A test suite with **84%** coverage but only **46%** mutation score means roughly half of potential bugs would reach production undetected.

## How It Works

Mutation testing introduces deliberate faults (mutants) into source code, then runs your test suite against each mutation:

- **Killed mutant**: Tests failed (detected the fault)
- **Survived mutant**: Tests passed (missed the fault)

### Example

Original code:
```python
if day < 1 or day > 30: return False
```

Mutant (< changed to <=):
```python
if day <= 1 or day > 30: return False
```

A test checking `day=0` passes on both versions (mutant survives).
A test checking `day=1` fails on the mutant but passes on original (mutant killed).

### Mutation Score

```
Mutation Score = (Killed Mutants + Timed Out) / Total Mutants
```

## Common Mutation Operators

| Operator Type | Example Mutation | What It Tests |
|---------------|------------------|---------------|
| Arithmetic | `+` to `-` | Mathematical correctness |
| Boundary | `<` to `<=` | Off-by-one errors |
| Logical | `and` to `or` | Boolean logic |
| Return value | `return x` to `return 0` | Return value handling |
| Constant | `100` to `101` | Magic number dependencies |
| Statement deletion | Remove a line | Dead code detection |

## Target Thresholds

| Context | Minimum Score | Notes |
|---------|---------------|-------|
| New adoption | 50% | Baseline measurement |
| Standard code | 70% | Reasonable target |
| Complex business logic | 80% | Higher assurance |
| Security-adjacent | 90% | Manual review of survivors |

## Tools

### mutmut (Python)

```bash
# Install
pip install mutmut

# Run mutation testing
mutmut run

# View results
mutmut results

# Interactive browser
mutmut html
```

Configuration in `pyproject.toml`:
```toml
[tool.mutmut]
paths_to_mutate = "src/"
tests_dir = "tests/"
```

### Stryker (JavaScript/TypeScript)

```bash
# Install
npm install @stryker-mutator/core

# Initialize config
npx stryker init

# Run
npx stryker run
```

Configuration in `stryker.conf.js`:
```javascript
module.exports = {
  mutate: ['src/**/*.ts'],
  testRunner: 'jest',
  reporters: ['html', 'clear-text'],
  thresholds: { high: 80, low: 70, break: 60 }
};
```

### pitest (Java/JVM)

Maven:
```xml
<plugin>
  <groupId>org.pitest</groupId>
  <artifactId>pitest-maven</artifactId>
  <version>1.15.0</version>
  <configuration>
    <targetClasses>com.example.*</targetClasses>
    <targetTests>com.example.*Test</targetTests>
  </configuration>
</plugin>
```

Run with: `mvn pitest:mutationCoverage`

## Workflow: AI-Assisted Mutation Loop

1. **Generate initial tests** from behavioral specifications
2. **Run mutation testing**
3. **Feed surviving mutants to AI** for targeted test generation
4. **Iterate** until mutation score exceeds 70%
5. **Human review** of surviving mutants

### Prompt for Generating Tests from Survivors

```
Mutation testing found these surviving mutants:

[paste mutation report]

For each surviving mutant, generate a test case that would kill it.
Focus on the specific condition or logic that the mutation changes.

Current test suite:
[paste relevant tests]

Generate only the new tests needed to kill these mutants.
```

### Prompt for Analyzing Mutation Reports

```
Here is a mutation testing report showing surviving mutants:

[paste report]

For each surviving mutant:
1. Explain why existing tests don't catch this mutation
2. Describe what behavior change the mutation introduces
3. Suggest the minimal test case that would detect it

Focus on behavioral differences, not implementation details.
```

## CI/CD Integration

### On Every PR (Changed Files Only)

```yaml
mutation-test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run mutation tests
      run: |
        mutmut run --paths-to-mutate=$(git diff --name-only HEAD~1 | grep '\.py$' | tr '\n' ',')
    - name: Check threshold
      run: |
        score=$(mutmut results --json | jq '.mutation_score')
        if (( $(echo "$score < 0.70" | bc -l) )); then
          echo "Mutation score $score below 70% threshold"
          exit 1
        fi
```

### Nightly Full Analysis

```yaml
mutation-full:
  schedule:
    - cron: '0 2 * * *'
  steps:
    - name: Full mutation analysis
      run: mutmut run
    - name: Upload report
      uses: actions/upload-artifact@v4
      with:
        name: mutation-report
        path: html/
```

## Handling Surviving Mutants

### Prioritizing by Risk

Not all surviving mutants are equal. Categorize them:

| Priority | Category | Action |
|----------|----------|--------|
| Critical | Security, data integrity, financial | Must fix |
| High | Core business logic | Should fix |
| Medium | Utilities, helpers | Consider fixing |
| Low | Logging, formatting | Optional |

### Equivalent Mutants

Some mutants look different but behave identically:

```python
# Original
if x >= 1:

# Mutant - equivalent for integer x
if x > 0:
```

If a mutant cannot be killed because it's functionally equivalent, document it and move on.

### Prompt for Prioritization

```
These mutants survived in our test suite:

[list mutants with locations]

Categorize each mutant by:
1. CRITICAL: Security, data integrity, financial calculations
2. HIGH: Core business logic, user-facing features
3. MEDIUM: Internal utilities, helper functions
4. LOW: Logging, formatting, non-critical paths

For CRITICAL and HIGH mutants, suggest specific test cases.
For MEDIUM and LOW, recommend whether to test or suppress.
```

## Performance Optimization

Mutation testing is computationally expensive. Strategies:

| Strategy | When to Use | Overhead |
|----------|-------------|----------|
| Changed files only | Every PR | Low |
| Critical paths only | Every PR | Medium |
| Full codebase | Nightly | High |

### Incremental Analysis

Most tools support incremental mutation testing:

```bash
# mutmut: Only test new/modified code
mutmut run --paths-to-mutate=changed_files.txt

# Stryker: Incremental mode
npx stryker run --incremental
```

## Limitations

### Performance Overhead

Full codebase analysis may take hours. Budget CI/CD time accordingly.

### Equivalent Mutants

No automated approach perfectly identifies equivalent mutants. Plan for some manual review.

### Diminishing Returns

After reaching ~70% mutation score, additional effort yields smaller improvements. Know when to stop.

### Large Codebases

Millions of lines generate millions of potential mutants. Focus on high-risk paths.

## Interpreting Results

### Good Result

```
Mutation score: 78%
Killed: 156/200
Survived: 44

Surviving mutants in:
- Logging code (22) - low priority
- Date formatting (8) - equivalent mutants
- Payment validation (14) - NEEDS ATTENTION
```

Action: Focus on the 14 payment validation survivors.

### Concerning Result

```
Mutation score: 42%
Killed: 84/200
Survived: 116
```

This suggests tests are providing false confidence. Time for a test quality audit.
