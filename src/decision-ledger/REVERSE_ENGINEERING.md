# Decision Ledger - Reverse Engineering Guide

This guide explains how to use Praxis's decision ledger reverse engineering capabilities to scan existing codebases and automatically generate contracts for rules and constraints.

## Overview

The reverse engineering feature helps teams adopt decision ledgers for existing Praxis applications by:

1. **Scanning repositories** to discover existing rules and constraints
2. **Inferring contracts** from code, comments, and tests
3. **Generating contracts** with AI assistance or heuristic analysis
4. **Creating migration paths** for legacy codebases

## Quick Start

### Basic Usage

Scan your codebase and generate contracts:

```bash
# Basic scan (non-AI, heuristic-based)
praxis reverse

# Specify a directory
praxis reverse --dir ./src

# Save contracts to a specific directory
praxis reverse --output ./contracts

# Write to logic ledger
praxis reverse --ledger --output ./contracts
```

### Interactive Mode

Review each contract before generating:

```bash
praxis reverse --interactive
```

Example session:
```
🔍 Scanning repository for rules and constraints...
   Directory: /home/user/myproject
   AI Provider: none

✅ Scan complete in 342ms
   Files scanned: 156
   Rules found: 12
   Constraints found: 5
   Test files: 8 mapped
   Spec files: 2 mapped

🤖 Generating contracts for 17 items...

📝 Processing rule: auth.login
   Generate contract for auth.login? (y/n) y
   ✅ Generated (heuristic, confidence: 0.70)
   ⚠️  Warnings:
      - No test files found - using default example
   📋 Contract summary:
      Behavior: Process login events and create user sessions
      Examples: 1
      Invariants: 1
```

### AI-Powered Generation

Use AI to improve contract quality (requires API keys):

```bash
# Using OpenAI
export OPENAI_API_KEY="your-key-here"
praxis reverse --ai openai

# Using GitHub Copilot
export GITHUB_TOKEN="your-token-here"
praxis reverse --ai github-copilot

# Auto-select (tries GitHub Copilot first, then OpenAI)
praxis reverse --ai auto
```

### Dry Run Mode

Preview what would be generated without writing files:

```bash
praxis reverse --dry-run
```

## Advanced Options

### Filtering and Limits

```bash
# Process only the first 10 rules
praxis reverse --limit 10

# Set confidence threshold (0.0-1.0)
praxis reverse --confidence 0.8

# Specify author for ledger entries
praxis reverse --author "engineering-team"
```

### Output Formats

```bash
# JSON format (default)
praxis reverse --format json

# YAML format
praxis reverse --format yaml
```

### Integration with Validation

Generate contracts and validate immediately:

```bash
# Generate contracts
praxis reverse --output ./contracts --ledger

# Validate the contracts
praxis validate --output console
```

## How It Works

### 1. Repository Scanning

The scanner traverses your codebase and:

- **Finds rule definitions**: Searches for `defineRule()` calls
- **Finds constraint definitions**: Searches for `defineConstraint()` calls
- **Maps test files**: Links test files to rules by ID references
- **Maps spec files**: Links specification files (TLA+, markdown)

Example:
```typescript
// This will be discovered:
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => { /* ... */ }
});
```

### 2. Contract Inference

For each discovered rule, the system infers:

**Behavior Description**:
- From JSDoc comments above the rule
- From the `description` field
- Fallback: derived from rule ID

**Examples**:
- Extracted from test descriptions
- Parsed as Given/When/Then
- Default example if no tests found

**Invariants**:
- Extracted from assertions in code
- Inferred from constraint definitions
- Default invariants generated

**Assumptions**:
- Generated based on common patterns
- Includes confidence scores
- Tracks what artifacts they impact

### 3. AI Enhancement (Optional)

When AI is enabled:

1. **Builds contextual prompt** with rule info, tests, and specs
2. **Requests contract** from AI provider
3. **Validates response** against schema
4. **Falls back to heuristics** if confidence is too low

### 4. Output Generation

Contracts are written to:

- **JSON/YAML files**: One file per rule in output directory
- **Logic ledger**: Immutable append-only ledger with versioning
- **Console**: Summary report of what was generated

## Configuration

### Project Configuration

Create a `.praxisrc.json` file in your project root:

```json
{
  "reverse": {
    "aiProvider": "none",
    "confidenceThreshold": 0.7,
    "includeAssumptions": true,
    "outputDir": "./contracts",
    "author": "team"
  }
}
```

### Environment Variables

```bash
# AI providers
export OPENAI_API_KEY="sk-..."
export GITHUB_TOKEN="ghp_..."

# Default author
export PRAXIS_AUTHOR="engineering-team"
```

## Migration Workflow

### Step 1: Initial Scan

Get an overview of your codebase:

```bash
praxis reverse --dry-run
```

Review the output to understand:
- How many rules/constraints exist
- Which ones have tests/specs
- Expected contract quality

### Step 2: Generate Contracts

Generate contracts with iterative refinement:

```bash
# First pass: high-confidence items only
praxis reverse --confidence 0.8 --output ./contracts

# Second pass: review lower-confidence items interactively
praxis reverse --confidence 0.5 --interactive
```

### Step 3: Validate and Refine

```bash
# Validate generated contracts
praxis validate --output console

# Review incomplete contracts
praxis validate --output json | jq '.incomplete'
```

### Step 4: Manual Refinement

Review and improve generated contracts:

1. **Add missing examples** from documentation
2. **Refine invariants** based on domain knowledge
3. **Update assumptions** with team input
4. **Add references** to tickets, docs, specs

### Step 5: Commit to Ledger

Once satisfied, commit to the logic ledger:

```bash
praxis reverse --ledger --author "migration-2024"
```

## Best Practices

### 1. Incremental Migration

Don't try to migrate everything at once:

```bash
# Migrate high-priority modules first
praxis reverse --dir ./src/core --ledger

# Then expand
praxis reverse --dir ./src/features --ledger
```

### 2. Test Coverage First

Ensure tests exist before reverse engineering:

```bash
# Generate contracts for rules with tests
praxis reverse --confidence 0.8

# Flag rules without tests for manual work
```

### 3. Review AI Output

Always review AI-generated contracts:

- Check behavior descriptions make sense
- Verify examples match actual behavior
- Validate invariants are correct
- Update assumptions with team knowledge

### 4. Use Version Control

Track contract evolution:

```bash
# Generate initial contracts
praxis reverse --output ./contracts

# Commit to version control
git add contracts/
git commit -m "Initial contract generation"

# Iterate and improve
# ... manual edits ...
git commit -m "Refine auth.login contract"
```

## Troubleshooting

### No Rules Found

If the scanner doesn't find rules:

1. **Check file patterns**: Ensure `defineRule` is used
2. **Verify paths**: Make sure you're scanning the right directory
3. **Check exclusions**: node_modules and dist are excluded by default

### Low Confidence Scores

If contracts have low confidence:

1. **Add tests**: Tests significantly increase confidence
2. **Add JSDoc comments**: Better descriptions improve quality
3. **Use AI**: AI can infer better contracts from limited info

### AI Integration Issues

If AI integration fails:

1. **Check API keys**: Ensure they're valid and have permissions
2. **Review quotas**: Ensure you haven't hit rate limits
3. **Fallback**: System falls back to heuristics automatically

## Examples

### Example 1: Simple Rule

Input code:
```typescript
/**
 * Increments the counter when INCREMENT event is received
 */
const incrementRule = defineRule({
  id: 'counter.increment',
  description: 'Increment counter',
  impl: (state, events) => {
    const increments = events.filter(e => e.tag === 'INCREMENT');
    return increments.map(() => ({
      tag: 'COUNTER_UPDATED',
      payload: { value: state.context.count + 1 }
    }));
  }
});
```

Generated contract:
```json
{
  "ruleId": "counter.increment",
  "behavior": "Increments the counter when INCREMENT event is received",
  "examples": [
    {
      "given": "Counter is at 0",
      "when": "INCREMENT event is received",
      "then": "COUNTER_UPDATED fact with value 1 is emitted"
    }
  ],
  "invariants": [
    "Counter value always increases by 1",
    "COUNTER_UPDATED fact is always emitted for INCREMENT event"
  ],
  "assumptions": [
    {
      "id": "counter.increment-assumption-1",
      "statement": "Input data is valid and well-formed",
      "confidence": 0.8,
      "justification": "Standard assumption for rule processing",
      "impacts": ["tests", "code"],
      "status": "active"
    }
  ],
  "version": "1.0.0",
  "timestamp": "2024-01-28T07:00:00.000Z"
}
```

### Example 2: Rule with Tests

Input code + tests:
```typescript
// rule.ts
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => { /* ... */ }
});

// rule.test.ts
describe('auth.login', () => {
  it('should create session when valid credentials provided', () => {
    // test implementation
  });
  
  it('should reject invalid credentials', () => {
    // test implementation
  });
});
```

Generated contract:
```json
{
  "ruleId": "auth.login",
  "behavior": "Process login events",
  "examples": [
    {
      "given": "Valid credentials provided",
      "when": "Login event is received",
      "then": "Session is created"
    },
    {
      "given": "Invalid credentials",
      "when": "Login event is received",
      "then": "Login is rejected"
    }
  ],
  "invariants": [
    "Sessions have unique IDs",
    "Only one session per user"
  ],
  "assumptions": [
    {
      "id": "auth.login-assumption-1",
      "statement": "Credentials are validated before login",
      "confidence": 0.9,
      "justification": "Inferred from test cases",
      "impacts": ["spec", "tests", "code"],
      "status": "active"
    }
  ],
  "references": [
    {
      "type": "test",
      "url": "file://./src/__tests__/rule.test.ts",
      "description": "Tests for auth.login"
    }
  ],
  "version": "1.0.0",
  "timestamp": "2024-01-28T07:00:00.000Z"
}
```

## Next Steps

After reverse engineering:

1. **Review contracts**: Manually verify and improve
2. **Add to build**: Run `praxis validate` in CI
3. **Track evolution**: Use logic ledger for history
4. **Iterate**: Continuously improve contracts

## See Also

- [Decision Ledger README](./README.md)
- [Contract Validation Guide](./VALIDATION.md)
- [CLI Reference](../../docs/cli.md)
