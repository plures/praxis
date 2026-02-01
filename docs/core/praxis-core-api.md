# Praxis-Core API Documentation

**Version:** 1.0.0  
**Status:** Stable  
**Last Updated:** 2026-02-01

## Overview

Praxis-Core is the canonical logic layer of the Praxis framework. It provides the foundational primitives for building functional, declarative applications with contracts, rules, constraints, and decision ledger capabilities.

This document defines the **stable API surface** and **stability guarantees** for praxis-core.

## What is Praxis-Core?

Praxis-Core consists of the following source modules under `src/`:

### Core Modules (Stable)

1. **`src/core/protocol.ts`** - Language-neutral protocol types
2. **`src/core/rules.ts`** - Registry system for rules and constraints
3. **`src/core/engine.ts`** - Logic engine execution
4. **`src/core/actors.ts`** - Actor system for side effects
5. **`src/core/introspection.ts`** - Registry introspection and analysis
6. **`src/core/reactive-engine.ts`** - Framework-agnostic reactive engine
7. **`src/core/reactive-engine.svelte.ts`** - Svelte 5 reactive engine
8. **`src/dsl/`** - DSL helpers for defining facts, events, rules
9. **`src/decision-ledger/`** - Contract-based validation and behavior tracking

### Supporting Core Modules

10. **`src/core/schema/`** - Schema types, validation, and loading
11. **`src/core/component/`** - Component generation from schemas
12. **`src/core/logic/`** - Logic generation utilities
13. **`src/core/pluresdb/`** - PluresDB integration primitives

All modules above are considered part of the **praxis-core** stable API surface.

### Non-Core Modules

The following are **not** part of praxis-core but build on top of it:

- `src/integrations/` - Third-party integrations (PluresDB, Unum, Tauri, etc.)
- `src/cli/` - Command-line interface
- `src/cloud/` - Cloud synchronization
- `src/components/` - UI components
- `src/runtime/` - Runtime adapters
- `src/adapters/` - External adapters

## Core Modules

Praxis-Core consists of the following stable modules:

### 1. Protocol (`src/core/protocol.ts`)

The language-neutral, JSON-friendly protocol that forms the foundation of Praxis.

**Stability: STABLE** - These types will not change in backward-incompatible ways within the same major version.

#### Exported Types

- `PraxisFact` - A typed proposition about the domain
- `PraxisEvent` - A temporally ordered fact meant to drive change
- `PraxisState` - The state of the Praxis engine at a point in time
- `PraxisDiagnostics` - Diagnostic information about violations or errors
- `PraxisStepConfig` - Configuration for step execution
- `PraxisStepResult` - Result of a step execution
- `PraxisStepFn` - The core step function signature

#### Exported Constants

- `PRAXIS_PROTOCOL_VERSION` - Current protocol version (follows semver)

#### Stability Guarantees

1. **Core Types Stability**: All protocol types maintain backward compatibility within major versions
2. **JSON Compatibility**: All types remain JSON-serializable
3. **Cross-Language Compatibility**: Changes coordinated across TypeScript, C#, and PowerShell implementations
4. **Migration Path**: Major version changes include migration guides and deprecation warnings

### 2. Rules & Constraints (`src/core/rules.ts`)

The registry system for rules and constraints with contract compliance support.

**Stability: STABLE**

#### Exported Types

- `RuleId` - Unique identifier for a rule
- `ConstraintId` - Unique identifier for a constraint
- `RuleFn<TContext>` - Rule function signature (pure, no side effects)
- `ConstraintFn<TContext>` - Constraint function signature (pure, no side effects)
- `RuleDescriptor<TContext>` - Complete rule definition with metadata
- `ConstraintDescriptor<TContext>` - Complete constraint definition with metadata
- `PraxisModule<TContext>` - Bundle of rules and constraints
- `RegistryComplianceOptions` - Contract compliance configuration
- `PraxisRegistryOptions` - Registry configuration options

#### Exported Classes

- `PraxisRegistry<TContext>` - Central registry for rules and constraints

##### Registry Methods (Public API)

```typescript
class PraxisRegistry<TContext> {
  // Registration
  registerRule(descriptor: RuleDescriptor<TContext>): void
  registerConstraint(descriptor: ConstraintDescriptor<TContext>): void
  registerModule(module: PraxisModule<TContext>): void
  
  // Lookup
  getRule(id: RuleId): RuleDescriptor<TContext> | undefined
  getConstraint(id: ConstraintId): ConstraintDescriptor<TContext> | undefined
  getRuleIds(): RuleId[]
  getConstraintIds(): ConstraintId[]
  getAllRules(): RuleDescriptor<TContext>[]
  getAllConstraints(): ConstraintDescriptor<TContext>[]
  
  // Contract Compliance
  getContractGaps(): ContractGap[]
  clearContractGaps(): void
}
```

#### Stability Guarantees

1. **ID Stability**: Rule and constraint IDs are permanent identifiers
2. **Function Signatures**: `RuleFn` and `ConstraintFn` signatures will not change
3. **Registry API**: Public methods will maintain backward compatibility
4. **Compliance Optional**: Contract compliance checks can be disabled in production

### 3. Logic Engine (`src/core/engine.ts`)

The core execution engine that processes events through rules and checks constraints.

**Stability: STABLE**

#### Exported Types

- `PraxisEngineOptions<TContext>` - Configuration for engine creation

#### Exported Classes

- `LogicEngine<TContext>` - The main logic engine

##### Engine Methods (Public API)

```typescript
class LogicEngine<TContext> {
  // State Access
  getState(): Readonly<PraxisState & { context: TContext }>
  getContext(): TContext
  getFacts(): PraxisFact[]
  
  // Execution
  step(events: PraxisEvent[]): PraxisStepResult
  stepWithConfig(events: PraxisEvent[], config: PraxisStepConfig): PraxisStepResult
  
  // Direct Manipulation (exceptional cases)
  updateContext(updater: (context: TContext) => TContext): void
  addFacts(facts: PraxisFact[]): void
  clearFacts(): void
  reset(options: PraxisEngineOptions<TContext>): void
}
```

#### Exported Functions

- `createPraxisEngine<TContext>(options: PraxisEngineOptions<TContext>): LogicEngine<TContext>`

#### Stability Guarantees

1. **Immutability**: All state returns are immutable copies
2. **Purity**: Rule and constraint functions must be pure
3. **Determinism**: Same inputs always produce same outputs
4. **Error Handling**: Errors captured in diagnostics, never thrown during step

### 4. DSL Helpers (`src/dsl/index.ts`)

Ergonomic TypeScript helpers for defining typed facts, events, rules, and constraints.

**Stability: STABLE**

#### Exported Types

- `FactDefinition<TTag, TPayload>` - Typed fact definition
- `EventDefinition<TTag, TPayload>` - Typed event definition
- `DefineRuleOptions<TContext>` - Options for defining rules
- `DefineConstraintOptions<TContext>` - Options for defining constraints
- `DefineModuleOptions<TContext>` - Options for defining modules

#### Exported Functions

```typescript
// Factory Functions
defineFact<TTag, TPayload>(tag: TTag): FactDefinition<TTag, TPayload>
defineEvent<TTag, TPayload>(tag: TTag): EventDefinition<TTag, TPayload>
defineRule<TContext>(options: DefineRuleOptions<TContext>): RuleDescriptor<TContext>
defineConstraint<TContext>(options: DefineConstraintOptions<TContext>): ConstraintDescriptor<TContext>
defineModule<TContext>(options: DefineModuleOptions<TContext>): PraxisModule<TContext>

// Helper Functions
filterEvents<T extends PraxisEvent>(events: PraxisEvent[], predicate: (e: PraxisEvent) => e is T): T[]
filterFacts<T extends PraxisFact>(facts: PraxisFact[], predicate: (f: PraxisFact) => f is T): T[]
findEvent<T extends PraxisEvent>(events: PraxisEvent[], predicate: (e: PraxisEvent) => e is T): T | undefined
findFact<T extends PraxisFact>(facts: PraxisFact[], predicate: (f: PraxisFact) => f is T): T | undefined
```

#### Stability Guarantees

1. **Type Safety**: All definitions provide compile-time type safety
2. **Runtime Safety**: Type guards validate structure at runtime
3. **Serialization**: All definitions produce JSON-serializable output
4. **Composability**: Definitions can be freely composed and reused

### 5. Decision Ledger (`src/decision-ledger/`)

Contract-based validation and behavior tracking for rules and constraints.

**Stability: STABLE**

#### Exported Types

- `Contract` - Contract definition for rules/constraints
- `Example` - Given/When/Then test example
- `Assumption` - Explicit assumption with confidence level
- `Reference` - External reference (docs, tickets, etc.)
- `ContractGap` - Information about missing contract elements
- `MissingArtifact` - Type of missing contract artifact
- `Severity` - Severity level for validation issues
- `ValidationReport` - Report of contract validation
- `ValidateOptions` - Options for contract validation
- `LedgerEntry` - Immutable snapshot of rule behavior
- `LedgerEntryStatus` - Status of ledger entry

#### Exported Functions

```typescript
// Contract Definition
defineContract(options: DefineContractOptions): Contract
getContract(descriptor: RuleDescriptor | ConstraintDescriptor): Contract | undefined
isContract(obj: unknown): obj is Contract

// Validation
validateContracts(registry: PraxisRegistry, options?: ValidateOptions): ValidationReport
formatValidationReport(report: ValidationReport): string
formatValidationReportJSON(report: ValidationReport): string
formatValidationReportSARIF(report: ValidationReport): string

// Ledger
createBehaviorLedger(basePath: string): BehaviorLedger
```

#### Exported Events/Facts

- `ContractMissing` - Fact emitted when contract is missing
- `ContractValidated` - Fact emitted when contract is validated
- `ContractGapAcknowledged` - Fact emitted when gap is acknowledged
- `ContractAdded` - Event for adding a contract
- `ContractUpdated` - Event for updating a contract
- `AcknowledgeContractGap` - Event to acknowledge a gap
- `ValidateContracts` - Event to trigger validation

#### Exported Classes

- `BehaviorLedger` - Immutable ledger for tracking behavior changes

#### Stability Guarantees

1. **Contract Schema**: Contract structure remains backward compatible
2. **Validation API**: Validation functions maintain signatures
3. **Ledger Immutability**: Ledger entries are append-only, never modified
4. **Output Formats**: SARIF and JSON output formats remain stable

## API Stability Levels

### Stable

APIs marked as **STABLE** follow semantic versioning:

- **Patch** (1.0.x): Bug fixes, documentation, no API changes
- **Minor** (1.x.0): New features, backward-compatible additions
- **Major** (x.0.0): Breaking changes (with migration guide)

Stable APIs will:
- Not remove exported functions, classes, or types
- Not change function signatures in breaking ways
- Provide deprecation warnings before removal
- Include migration guides for breaking changes

### Experimental

APIs marked as **EXPERIMENTAL** may change without notice. Use with caution in production.

Currently, no core APIs are experimental. All extensions and integrations may have their own stability levels.

## Versioning

Praxis-Core follows [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes to the core API
- **MINOR**: New features, backward-compatible additions
- **PATCH**: Bug fixes, documentation updates

### Version Compatibility

| Praxis Version | Protocol Version | Min Node.js | Min Deno |
|----------------|------------------|-------------|----------|
| 1.x.x          | 1.0.0            | 18.0.0      | 1.37.0   |

### Deprecation Policy

1. **Announcement**: Deprecations announced at least one minor version in advance
2. **Warnings**: Deprecated APIs emit runtime warnings in development mode
3. **Documentation**: Deprecated APIs marked clearly in docs with alternatives
4. **Removal**: Deprecated APIs removed only in next major version

## Non-Breaking Changes

The following changes are considered non-breaking:

- Adding new optional parameters with defaults
- Adding new methods to classes
- Adding new exported functions or types
- Adding new fields to options objects (as optional)
- Performance improvements
- Bug fixes that restore documented behavior
- Internal refactoring without API changes

## Breaking Changes

The following changes are considered breaking:

- Removing exported functions, classes, or types
- Changing function signatures (parameters or return types)
- Changing behavior in incompatible ways
- Renaming exports without aliases
- Making optional parameters required
- Changing TypeScript compiler requirements

## Cross-Language Compatibility

Praxis-Core maintains implementations in:

- **TypeScript** (reference implementation)
- **C#** (.NET)
- **PowerShell**

All core types and protocol definitions are coordinated across implementations to ensure:

1. **Data Portability**: State, facts, and events can be serialized and shared
2. **Behavior Consistency**: Same rules produce same results
3. **Version Synchronization**: Major versions released in lockstep

## Testing Guarantees

Praxis-Core maintains:

1. **Unit Tests**: All public APIs have unit test coverage
2. **Integration Tests**: Cross-module integration tested
3. **Contract Tests**: All core rules/constraints have contracts
4. **Cross-Language Tests**: Protocol compatibility verified across implementations
5. **Performance Tests**: No performance regressions in stable APIs

## Support

- **Documentation**: Full API documentation at [docs/core/](.)
- **Examples**: Reference examples in [examples/](../../examples/)
- **Issues**: Bug reports at [GitHub Issues](https://github.com/plures/praxis/issues)
- **Discussions**: Questions at [GitHub Discussions](https://github.com/plures/praxis/discussions)

## References

- [Extending Praxis-Core](./extending-praxis-core.md)
- [Decision Ledger Dogfooding](../decision-ledger/DOGFOODING.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Protocol Versioning](../../PROTOCOL_VERSIONING.md)

---

**Next:** [Extending Praxis-Core](./extending-praxis-core.md)
