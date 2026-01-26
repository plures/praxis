# Decision Ledger Integration - Behavior Ledger

**Status**: Active  
**Version**: 1.0.0  
**Created**: 2025-01-26  
**Last Updated**: 2025-01-26

---

## Entry 1: Initial Decision Ledger Integration

**ID**: `decision-ledger-v1`  
**Timestamp**: 2025-01-26T00:00:00Z  
**Status**: Active  
**Author**: System

### Canonical Behavior

The Decision Ledger Integration provides a mechanism for Praxis applications to:

1. **Define Contracts for Rules/Constraints** with:
   - Canonical behavior description
   - Given/When/Then examples that become test vectors
   - TLA+-friendly invariants or Praxis-level invariants
   - Explicit assumptions with confidence levels
   - References to documentation, tickets, and external links

2. **Validate Compliance** at build-time and runtime:
   - Build-time: `praxis validate` CLI scans registry modules
   - Runtime: Lightweight validation when registering rules
   - Structured diagnostics (JSON, console, optional SARIF)

3. **Track Missing Artifacts** as first-class facts:
   - Fact: `ContractMissing` with ruleId, missing artifacts, severity
   - Event: `ACKNOWLEDGE_CONTRACT_GAP` for explicit acknowledgment
   - Rule: Policy enforcement for contract debt

4. **Maintain Immutable History**:
   - Append-only ledger of behavior changes
   - Assumption invalidation tracking
   - Versioned behavior snapshots

### Examples (Given/When/Then)

#### Example 1: Defining a Contract for a Rule

**Given**: A rule `auth.login` that processes login events  
**When**: Developer defines the contract with behavior, examples, and invariants  
**Then**: The contract is registered and can be validated

```typescript
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
      impacts: ['spec', 'tests']
    }
  ],
  references: [
    { type: 'doc', url: 'https://docs.example.com/auth' }
  ]
});
```

#### Example 2: Build-time Validation

**Given**: A registry with rules and their contracts  
**When**: `praxis validate` command is run  
**Then**: Validation report shows contract coverage and gaps

```bash
$ praxis validate
✓ auth.login - Contract complete (behavior, examples, tests)
✗ cart.addItem - Missing: tests
✗ order.process - Missing: contract
```

#### Example 3: Runtime Validation

**Given**: A rule without a complete contract  
**When**: Rule is registered at runtime with `strictContracts: true`  
**Then**: ContractMissing fact is created and policy can enforce action

```typescript
const registry = createRegistry({ strictContracts: true });
registry.registerRule(ruleWithoutContract);
// ContractMissing fact is emitted
// Policy may warn, error, or allow based on configuration
```

#### Example 4: Contract Gap Acknowledgment

**Given**: A missing contract has been identified  
**When**: Developer acknowledges the gap with justification  
**Then**: ACKNOWLEDGE_CONTRACT_GAP event is recorded

```typescript
acknowledgeContractGap({
  ruleId: 'legacy.process',
  missing: ['spec', 'tests'],
  justification: 'Legacy rule to be deprecated in v2.0',
  expiresAt: '2025-12-31'
});
```

### Invariants

1. **Contract Immutability**: Once a contract version is published, its core behavior description cannot be changed; only new versions can be created
2. **Ledger Append-Only**: The behavior ledger is append-only; entries can be superseded but never deleted
3. **Assumption Traceability**: Every assumption must have a stable ID and impacts declaration
4. **Example Completeness**: Every contract must have at least one Given/When/Then example
5. **Validation Determinism**: Running `praxis validate` multiple times on the same codebase produces identical results

### Assumptions

#### A1: Contract Storage Location
- **ID**: `assume-contract-in-meta`
- **Statement**: Contracts are stored in the `meta` field of RuleDescriptor and ConstraintDescriptor
- **Confidence**: 0.95
- **Justification**: The existing `meta` field is designed for extensibility and already exists in the Praxis architecture
- **Derived From**: Analysis of src/core/rules.ts and src/dsl/index.ts
- **Impacts**: Implementation (contract storage), Tests (contract retrieval)
- **Status**: Active

#### A2: JSON Serialization
- **ID**: `assume-json-serializable`
- **Statement**: All contract data must be JSON-serializable for cross-language compatibility
- **Confidence**: 1.0
- **Justification**: Praxis protocol requirement for all data structures
- **Derived From**: src/core/protocol.ts PRAXIS_PROTOCOL_VERSION documentation
- **Impacts**: Spec (type definitions), Implementation (contract types)
- **Status**: Active

#### A3: CLI Extension Pattern
- **ID**: `assume-commander-pattern`
- **Statement**: New CLI commands follow the Commander.js pattern established in src/cli/index.ts
- **Confidence**: 1.0
- **Justification**: Existing CLI uses Commander.js for all commands
- **Derived From**: src/cli/index.ts lines 9-12
- **Impacts**: Implementation (validate command)
- **Status**: Active

#### A4: Test Framework
- **ID**: `assume-vitest`
- **Statement**: Tests use Vitest framework with describe/it/expect pattern
- **Confidence**: 1.0
- **Justification**: All existing tests use Vitest
- **Derived From**: src/__tests__/dsl.test.ts, package.json scripts
- **Impacts**: Tests (testing approach)
- **Status**: Active

#### A5: Contract Optional by Default
- **ID**: `assume-contract-optional`
- **Statement**: Contracts are optional by default; strict enforcement requires opt-in configuration
- **Confidence**: 0.85
- **Justification**: Backward compatibility with existing Praxis code that doesn't have contracts
- **Derived From**: User requirements for "integration" rather than breaking change
- **Impacts**: Implementation (validation logic), Tests (default behavior)
- **Status**: Active

### References

- **Design Doc**: Problem statement provided by user
- **Praxis Core**: src/core/rules.ts - Rule and Constraint descriptors
- **Praxis DSL**: src/dsl/index.ts - Helper functions for defining rules
- **Praxis Protocol**: src/core/protocol.ts - Core protocol versioning and types
- **CLI Pattern**: src/cli/index.ts - Command structure

### Changes from Previous Version

N/A - Initial version

---

## Schema

**Ledger Entry Schema**:
```typescript
interface LedgerEntry {
  id: string;
  timestamp: string;
  status: 'active' | 'superseded' | 'deprecated';
  author: string;
  behavior: {
    canonical: string;
    examples: Array<{
      given: string;
      when: string;
      then: string;
    }>;
    invariants: string[];
  };
  assumptions: Array<{
    id: string;
    statement: string;
    confidence: number;
    justification: string;
    derivedFrom: string;
    impacts: Array<'spec' | 'tests' | 'code'>;
    status: 'active' | 'revised' | 'invalidated';
  }>;
  references: Array<{
    type: string;
    url?: string;
    description?: string;
  }>;
  supersedes?: string;
}
```
