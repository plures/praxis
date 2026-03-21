# Decision Ledger Implementation Summary

This document summarizes the complete implementation of the Decision Ledger feature for Praxis, based on the behavior-ledger project principles.

## Overview

The Decision Ledger transforms Praxis rules and constraints into "contracted components" with explicit behavioral contracts, comprehensive validation, and immutable change tracking. This enables:

1. **Explicit Documentation**: Every rule/constraint documents its behavior, examples, invariants, and assumptions
2. **Automated Validation**: Build-time and runtime checks ensure contract completeness
3. **Traceable Evolution**: Immutable ledger tracks how contracts change over time
4. **Drift Detection**: Automatic identification of invalidated assumptions and behavioral changes
5. **CI/CD Integration**: SARIF output for GitHub Code Scanning, strict mode for pipelines

## Architecture

### 1. Contract Types (`src/decision-ledger/types.ts`)

```typescript
interface Contract {
  ruleId: string;
  behavior: string;                    // Canonical description
  examples: Example[];                 // Given/When/Then test vectors
  invariants: string[];                // TLA+-friendly properties
  assumptions?: Assumption[];          // Explicit inferred requirements
  references?: Reference[];            // Docs, tickets, links
  version?: string;                    // Semantic version
  timestamp?: string;                  // ISO timestamp
}

interface Assumption {
  id: string;
  statement: string;
  confidence: number;                  // 0.0 to 1.0
  justification: string;
  impacts: Array<'spec' | 'tests' | 'code'>;
  status: 'active' | 'revised' | 'invalidated';
}

interface Example {
  given: string;                       // Preconditions
  when: string;                        // Triggering event
  then: string;                        // Expected outcome
}
```

### 2. Contract Attachment (`src/core/rules.ts`)

Contracts can be attached to rules and constraints:

```typescript
interface RuleDescriptor<TContext = unknown> {
  id: RuleId;
  description: string;
  impl: RuleFn<TContext>;
  contract?: Contract;                 // Optional contract
  meta?: Record<string, unknown>;
}

interface ConstraintDescriptor<TContext = unknown> {
  id: ConstraintId;
  description: string;
  impl: ConstraintFn<TContext>;
  contract?: Contract;                 // Optional contract
  meta?: Record<string, unknown>;
}
```

### 3. Registry Validation (`src/core/rules.ts`)

The `PraxisRegistry` automatically validates contracts during registration:

```typescript
class PraxisRegistry<TContext = unknown> {
  constructor(options: PraxisRegistryOptions = {}) {
    this.compliance = {
      enabled: true,                   // Enable in dev mode
      requiredFields: ['behavior', 'examples', 'invariants'],
      missingSeverity: 'warning',
      onGap: (gap) => { /* callback */ }
    };
  }
  
  registerRule(descriptor: RuleDescriptor<TContext>): void {
    // Validates contract and emits warnings for gaps
  }
}
```

### 4. Validation Engine (`src/decision-ledger/validation.ts`)

Comprehensive validation with multiple output formats:

```typescript
validateContracts(registry, {
  strict: false,
  requiredFields: ['behavior', 'examples'],
  artifactIndex: {
    tests: new Set(['auth.login']),    // Rules with tests
    spec: new Set(['auth.login'])      // Rules with specs
  }
});
```

Output formats:
- **Console**: Human-readable with emojis and colors
- **JSON**: Structured for programmatic processing
- **SARIF**: For GitHub Code Scanning integration

### 5. Logic Ledger (`src/decision-ledger/logic-ledger.ts`)

Immutable append-only ledger with versioned snapshots:

```typescript
await writeLogicLedgerEntry(contract, {
  rootDir: './ledger',
  author: 'team-name',
  testsPresent: true,
  specPresent: false
});

// Creates:
// ledger/
//   logic-ledger/
//     index.json
//     auth-login-b5ff41/
//       v0001.json
//       LATEST.json
```

Each entry includes:
- Canonical behavior (description, examples, invariants)
- Assumptions with confidence levels
- Artifact presence (contract, tests, spec)
- Drift summary (what changed since previous version)

### 6. Behavior Ledger (`src/decision-ledger/ledger.ts`)

In-memory append-only ledger for contract evolution:

```typescript
const ledger = createBehaviorLedger();

ledger.append({
  id: 'entry-1',
  timestamp: '2026-01-28T00:00:00Z',
  status: 'active',
  author: 'team',
  contract: contract1
});

// Query ledger
ledger.getLatestEntry('auth.login');
ledger.getActiveAssumptions();
ledger.getStats();
```

### 7. Facts and Events (`src/decision-ledger/facts-events.ts`)

First-class facts for contract gaps:

```typescript
// Fact: ContractMissing
const fact = ContractMissing.create({
  ruleId: 'auth.login',
  missing: ['tests', 'spec'],
  severity: 'warning'
});

// Event: AcknowledgeContractGap
const event = AcknowledgeContractGap.create({
  ruleId: 'legacy.rule',
  missing: ['spec'],
  justification: 'To be deprecated in v2.0',
  expiresAt: '2025-12-31'
});
```

### 8. CLI Commands (`src/cli/commands/validate.ts`)

Comprehensive CLI for validation and ledger management:

```bash
# Basic validation
praxis validate --registry ./registry.js

# JSON output
praxis validate --registry ./registry.js --output json

# SARIF for CI/CD
praxis validate --registry ./registry.js --output sarif > results.sarif

# Create logic ledger
praxis validate --registry ./registry.js --ledger ./ledger --author team

# Emit contract gaps
praxis validate --registry ./registry.js --emit-facts --gap-output gaps.json

# Strict mode (fail on missing contracts)
praxis validate --registry ./registry.js --strict
```

## Usage Examples

### 1. Defining a Contract

```javascript
import { defineContract, defineRule } from '@plures/praxis';

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
      justification: 'Standard practice',
      impacts: ['spec', 'tests', 'code'],
      status: 'active'
    }
  ],
  references: [
    { type: 'doc', url: 'https://docs.example.com/auth' }
  ]
});

const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => { /* ... */ },
  contract: loginContract
});
```

### 2. Runtime Validation

```javascript
import { PraxisRegistry, validateContracts } from '@plures/praxis';

const registry = new PraxisRegistry({
  compliance: {
    enabled: true,
    requiredFields: ['behavior', 'examples'],
    missingSeverity: 'warning',
    onGap: (gap) => {
      console.warn(`Contract gap: ${gap.ruleId}`);
    }
  }
});

registry.registerRule(loginRule);

const report = validateContracts(registry);
console.log(`Complete: ${report.complete.length}`);
console.log(`Incomplete: ${report.incomplete.length}`);
```

### 3. CI/CD Integration

```yaml
# .github/workflows/validate-contracts.yml
name: Validate Contracts

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run build
      
      - name: Validate contracts
        run: npx praxis validate --registry ./registry.js --output sarif > results.sarif
      
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: results.sarif
      
      - name: Strict validation
        run: npx praxis validate --registry ./registry.js --strict
```

### 4. Drift Detection

```javascript
// First version
const v1Contract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Simple login',
  examples: [...],
  invariants: [...]
});

await writeLogicLedgerEntry(v1Contract, {
  rootDir: './ledger',
  author: 'team'
});

// Updated version
const v2Contract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Enhanced login with MFA',
  examples: [...],
  invariants: [...],
  assumptions: [
    {
      id: 'assume-mfa',
      statement: 'All users have MFA enabled',
      confidence: 0.7,
      status: 'active',
      impacts: ['spec', 'tests', 'code']
    }
  ]
});

await writeLogicLedgerEntry(v2Contract, {
  rootDir: './ledger',
  author: 'team'
});

// ledger/logic-ledger/auth-login-xxx/LATEST.json now shows:
// {
//   "version": 2,
//   "drift": {
//     "changeSummary": "updated",
//     "assumptionsInvalidated": [],
//     "assumptionsRevised": [],
//     "conflicts": ["behavior-changed"]
//   }
// }
```

## Benefits

1. **Completeness**: All rules/constraints have explicit behavioral contracts
2. **Testability**: Examples become test vectors automatically
3. **Maintainability**: Assumptions are explicit and tracked
4. **Auditability**: Immutable ledger tracks all changes
5. **Quality**: Build-time validation prevents incomplete contracts
6. **Integration**: SARIF output works with GitHub Code Scanning
7. **Flexibility**: Optional artifacts, configurable severity levels

## Files Modified/Created

### Core Implementation
- `src/decision-ledger/types.ts` - Contract types and definitions
- `src/decision-ledger/validation.ts` - Validation engine
- `src/decision-ledger/ledger.ts` - Behavior ledger
- `src/decision-ledger/logic-ledger.ts` - Logic ledger writer
- `src/decision-ledger/facts-events.ts` - Praxis facts/events
- `src/decision-ledger/index.ts` - Main export
- `src/core/rules.ts` - Enhanced with contract support

### CLI
- `src/cli/commands/validate.ts` - Validate command
- `src/cli/index.ts` - CLI entry point with validate command

### Examples & Documentation
- `examples/sample-registry.js` - Sample registry with contracts
- `examples/sample-registry.ts` - TypeScript version
- `examples/decision-ledger/README.md` - Enhanced documentation
- `src/decision-ledger/README.md` - API documentation

### Tests
- `src/__tests__/decision-ledger.test.ts` - Unit tests (17 tests)
- `src/__tests__/cli-validate.test.ts` - CLI integration tests (8 tests)

## Test Results

```
Test Files  25 passed (25)
Tests  373 passed (373)
Duration  2.69s
```

All tests pass including:
- Contract definition and validation
- Registry compliance checking
- Behavior ledger operations
- Logic ledger persistence
- CLI validation with all options
- SARIF output generation
- Drift detection
- Facts and events

## Next Steps

Potential enhancements (not required for this implementation):

1. **Test Generation**: Auto-generate test stubs from contract examples
2. **TLA+ Integration**: Import/export TLA+ specifications
3. **Assistant Integration**: LLM-powered contract generation
4. **Visual Editor**: UI for editing contracts
5. **Assumption Validation**: Runtime checking of assumptions
6. **Contract Templates**: Reusable contract patterns
7. **Multi-Language Support**: Generate contracts for C#, Go, etc.

## Conclusion

The Decision Ledger implementation provides a complete, production-ready system for treating Praxis rules and constraints as contracted components. It enables teams to:

- Document behavior explicitly
- Validate completeness automatically
- Track evolution immutably
- Detect drift systematically
- Integrate with CI/CD seamlessly

All features from the original problem statement have been implemented and tested.
