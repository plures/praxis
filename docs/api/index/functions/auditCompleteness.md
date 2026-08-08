[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / auditCompleteness

# Function: auditCompleteness()

> **auditCompleteness**(`manifest`, `registryRuleIds`, `registryConstraintIds`, `rulesWithContracts`, `config?`): [`CompletenessReport`](../interfaces/CompletenessReport.md)

Defined in: packages/praxis-core/src/completeness.ts:168

Run a completeness audit against a Praxis registry and app manifest.

The manifest is a developer-authored declaration of all logic branches,
state fields, and state transitions in the app. The auditor checks which
ones are covered by Praxis.

## Parameters

### manifest

Developer-authored manifest listing all logic branches, state fields, and transitions

#### branches

[`LogicBranch`](../interfaces/LogicBranch.md)[]

#### rulesNeedingContracts

`string`[]

#### stateFields

[`StateField`](../interfaces/StateField.md)[]

#### transitions

[`StateTransition`](../interfaces/StateTransition.md)[]

### registryRuleIds

`string`[]

IDs of rules currently registered in the engine

### registryConstraintIds

`string`[]

IDs of constraints currently registered in the engine

### rulesWithContracts

`string`[]

IDs of rules that have Decision Ledger contracts attached

### config?

[`CompletenessConfig`](../interfaces/CompletenessConfig.md)

Optional audit configuration (threshold, strict mode)

## Returns

[`CompletenessReport`](../interfaces/CompletenessReport.md)

A [CompletenessReport](../interfaces/CompletenessReport.md) with a numeric score and per-dimension coverage details
