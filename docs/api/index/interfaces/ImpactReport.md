[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ImpactReport

# Interface: ImpactReport

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:125

Impact of removing a fact

## Properties

### affectedFacts

> **affectedFacts**: `string`[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:131

Facts that would disappear (transitively)

***

### affectedRules

> **affectedRules**: `string`[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:129

Rules that would stop firing

***

### depth

> **depth**: `number`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:133

Total downstream impact depth

***

### factTag

> **factTag**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:127

The fact being analyzed
