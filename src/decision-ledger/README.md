# Decision Ledger Integration

The Decision Ledger Integration extends Praxis with contract-based validation and documentation for rules and constraints, enabling teams to explicitly document, test, and enforce behavioral contracts.

## Overview

Modern software systems—especially those incorporating AI-assisted logic, rules engines, and automated decision-making—lack a reliable, enforceable mechanism to explain, audit, and evolve decision logic over time. The Decision Ledger addresses this gap by providing:

1. **Contract Objects** for rules and constraints with canonical behavior, examples, invariants, assumptions, and references
2. **Compliance Pipeline** for build-time and runtime validation
3. **First-class Facts** for tracking missing artifacts
4. **Immutable Logic Ledger** with assumption invalidation and versioned snapshots

## Quick Start

### Defining a Contract

```typescript
import { defineContract, defineRule } from '@plures/praxis';

// Define a contract
const loginContract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Process login events and create user session facts',
  examples: [
    {
      given: 'User provides valid credentials',
      when: 'LOGIN event is received',
      then: 'UserSessionCreated fact is emitted'
    }
  ],
  invariants: [
    'Session must have unique ID',
    'Session must have timestamp'
  ],
  assumptions: [
    {
      id: 'assume-unique-username',
      statement: 'Usernames are unique across the system',
      confidence: 0.9,
      justification: 'Standard practice in authentication systems',
      impacts: ['spec', 'tests'],
      status: 'active'
    }
  ],
  references: [
    { type: 'doc', url: 'https://docs.example.com/auth' }
  ]
});

// Attach contract to rule
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => {
    // Implementation
    return [];
  },
  meta: { contract: loginContract }
});
```

### Build-time Validation

```bash
# Validate contracts in your registry
praxis validate

# Output as JSON
praxis validate --output json

# Output as SARIF (for CI/CD integration)
praxis validate --output sarif

# Strict mode (exit with error if contracts missing)
praxis validate --strict
```

Example output:

```
Contract Validation Report
==================================================

Total: 5
Complete: 3
Incomplete: 1
Missing: 1

✓ Complete Contracts:
  ✓ auth.login (v1.0.0)
  ✓ auth.logout (v1.0.0)
  ✓ cart.checkout (v1.0.0)

✗ Incomplete Contracts:
  ⚠ cart.addItem - Missing: tests
     Contract is incomplete: missing tests

✗ No Contract:
  ✗ order.process
```

### Runtime Validation

```typescript
import { validateContracts } from '@plures/praxis';

const registry = new PraxisRegistry();
// ... register rules with contracts

const report = validateContracts(registry, {
  strict: true,
  requiredFields: ['behavior', 'examples']
});

console.log(`Complete: ${report.complete.length}`);
console.log(`Incomplete: ${report.incomplete.length}`);
console.log(`Missing: ${report.missing.length}`);
```

### Contract Gap Acknowledgment

```typescript
import { AcknowledgeContractGap } from '@plures/praxis';

// Acknowledge a known gap with justification
const event = AcknowledgeContractGap.create({
  ruleId: 'legacy.process',
  missing: ['spec', 'tests'],
  justification: 'Legacy rule to be deprecated in v2.0',
  expiresAt: '2025-12-31'
});
```

### Behavior Ledger

```typescript
import { createBehaviorLedger, defineContract } from '@plures/praxis';

const ledger = createBehaviorLedger();

// Append a contract to the ledger
ledger.append({
  id: 'entry-1',
  timestamp: new Date().toISOString(),
  status: 'active',
  author: 'team',
  contract: loginContract
});

// Update contract (supersedes previous entry)
const updatedContract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Updated behavior description',
  examples: [...],
  invariants: [...],
  version: '2.0.0'
});

ledger.append({
  id: 'entry-2',
  timestamp: new Date().toISOString(),
  status: 'active',
  author: 'team',
  contract: updatedContract,
  supersedes: 'entry-1',
  reason: 'behavior-updated'
});

// Query ledger
const latest = ledger.getLatestEntry('auth.login');
const history = ledger.getEntriesForRule('auth.login');
const activeAssumptions = ledger.getActiveAssumptions();

// Export/import
const json = ledger.toJSON();
const restored = BehaviorLedger.fromJSON(json);
```

## API Reference

### Types

```typescript
interface Contract {
  ruleId: string;
  behavior: string;
  examples: Example[];
  invariants: string[];
  assumptions?: Assumption[];
  references?: Reference[];
  version?: string;
  timestamp?: string;
}

interface Example {
  given: string;
  when: string;
  then: string;
}

interface Assumption {
  id: string;
  statement: string;
  confidence: number; // 0.0 to 1.0
  justification: string;
  derivedFrom?: string;
  impacts: Array<'spec' | 'tests' | 'code'>;
  status: 'active' | 'revised' | 'invalidated';
}

interface Reference {
  type: string;
  url?: string;
  description?: string;
}
```

### Functions

#### `defineContract(options: DefineContractOptions): Contract`

Creates a contract for a rule or constraint.

#### `validateContracts(registry: PraxisRegistry, options?: ValidateOptions): ValidationReport`

Validates all rules and constraints in a registry.

#### `formatValidationReport(report: ValidationReport): string`

Formats a validation report as human-readable text.

#### `formatValidationReportJSON(report: ValidationReport): string`

Formats a validation report as JSON.

#### `formatValidationReportSARIF(report: ValidationReport): string`

Formats a validation report as SARIF (for CI/CD integration).

### Facts and Events

```typescript
// Fact: Contract is missing
const fact = ContractMissing.create({
  ruleId: 'test.rule',
  missing: ['behavior', 'examples'],
  severity: 'warning'
});

// Event: Acknowledge contract gap
const event = AcknowledgeContractGap.create({
  ruleId: 'legacy.rule',
  missing: ['tests'],
  justification: 'To be deprecated',
  expiresAt: '2025-12-31'
});
```

## CLI Commands

### `praxis validate`

Validates contract coverage for rules and constraints.

**Options:**
- `--output <format>` - Output format: `console` (default), `json`, or `sarif`
- `--strict` - Exit with error if contracts are missing (default: false)
- `--registry <path>` - Path to registry module (optional)

**Examples:**

```bash
# Basic validation
praxis validate

# JSON output for programmatic processing
praxis validate --output json

# SARIF output for GitHub Actions/CI integration
praxis validate --output sarif > results.sarif

# Strict mode for CI/CD pipelines
praxis validate --strict
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Validate Contracts

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - name: Validate contracts
        run: npx praxis validate --output sarif > results.sarif
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
```

## Documentation

- **Behavior Ledger**: See [docs/decision-ledger/BEHAVIOR_LEDGER.md](../../docs/decision-ledger/BEHAVIOR_LEDGER.md) for the canonical behavior specification
- **LATEST Snapshot**: See [docs/decision-ledger/LATEST.md](../../docs/decision-ledger/LATEST.md) for the current behavior summary
- **TLA+ Spec**: See [docs/decision-ledger/DecisionLedger.tla](../../docs/decision-ledger/DecisionLedger.tla) for formal specification

## Design Principles

1. **Contracts are Optional by Default**: Backward compatibility with existing Praxis code
2. **Immutable Ledger**: Append-only history; entries can be superseded but never deleted
3. **Explicit Assumptions**: All inferred requirements must be documented with confidence levels
4. **JSON Serializable**: All types are JSON-friendly for cross-language compatibility
5. **Validation is Deterministic**: Same inputs always produce same validation results

## Examples

See [src/__tests__/decision-ledger.test.ts](../__tests__/decision-ledger.test.ts) for comprehensive usage examples.

## License

MIT
