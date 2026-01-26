# Decision Ledger Integration - LATEST Behavior Snapshot

**Generated From**: BEHAVIOR_LEDGER.md Entry 1 (`decision-ledger-v1`)  
**Generated At**: 2025-01-26  
**Status**: Non-Authoritative (derived from ledger)

---

## Current Behavior Summary

The Decision Ledger Integration extends Praxis with contract-based rule and constraint validation, enabling teams to document, test, and enforce behavioral contracts for their logic.

### Core Capabilities

1. **Contract Definition**
   - Attach contracts to rules and constraints via the `meta.contract` field
   - Define canonical behavior, examples, invariants, assumptions, and references
   - Contracts are JSON-serializable and language-neutral

2. **Build-time Validation**
   - `praxis validate` CLI command scans registered rules and constraints
   - Reports contract coverage and identifies gaps
   - Outputs structured diagnostics (JSON, console, SARIF)

3. **Runtime Validation**
   - Optional strict mode for contract enforcement during rule registration
   - Emits `ContractMissing` facts for rules without complete contracts
   - Policy rules can enforce contract requirements

4. **Contract Gap Management**
   - Acknowledge known gaps with `ACKNOWLEDGE_CONTRACT_GAP` event
   - Track technical debt and expiration dates
   - Audit trail of contract coverage over time

### Active Assumptions

All assumptions from Entry 1 are active:
- A1: Contracts stored in `meta` field
- A2: All contract data is JSON-serializable
- A3: CLI follows Commander.js pattern
- A4: Tests use Vitest framework
- A5: Contracts are optional by default

### Quick Start Example

```typescript
import { defineRule, defineContract } from '@plures/praxis';

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
  invariants: ['Session must have unique ID']
});

// Attach contract to rule
const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => { /* ... */ },
  meta: { contract: loginContract }
});

// Validate at build time
// $ praxis validate
```

### API Reference

#### Contract Types

```typescript
interface Contract {
  ruleId: string;
  behavior: string;
  examples: Array<{
    given: string;
    when: string;
    then: string;
  }>;
  invariants: string[];
  assumptions?: Assumption[];
  references?: Reference[];
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

#### Validation API

```typescript
// CLI
praxis validate [options]
  --output <format>    Output format: json, console, sarif (default: console)
  --strict             Exit with error if contracts are missing
  --config <file>      Path to validation config file

// Programmatic
import { validateContracts } from '@plures/praxis/decision-ledger';

const report = validateContracts(registry, options);
// report.complete: Contract[]
// report.incomplete: ContractGap[]
// report.missing: string[] (rule IDs)
```

#### Facts and Events

```typescript
// ContractMissing fact
const ContractMissing = defineFact<'ContractMissing', {
  ruleId: string;
  missing: Array<'behavior' | 'examples' | 'invariants' | 'tests' | 'spec'>;
  severity: 'warning' | 'error';
}>('ContractMissing');

// ACKNOWLEDGE_CONTRACT_GAP event
const AcknowledgeContractGap = defineEvent<'ACKNOWLEDGE_CONTRACT_GAP', {
  ruleId: string;
  missing: string[];
  justification: string;
  expiresAt?: string;
}>('ACKNOWLEDGE_CONTRACT_GAP');
```

### Configuration

```typescript
// praxis.config.ts
export default {
  decisionLedger: {
    strict: false,               // Require contracts for all rules
    validateOnRegister: true,    // Validate at runtime
    outputFormat: 'console',     // 'json' | 'console' | 'sarif'
    requiredFields: [            // Required contract fields
      'behavior',
      'examples'
    ]
  }
};
```

---

**Note**: This is a non-authoritative snapshot derived from the behavior ledger. The source of truth is BEHAVIOR_LEDGER.md.
