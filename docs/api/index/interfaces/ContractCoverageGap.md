[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ContractCoverageGap

# Interface: ContractCoverageGap

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:180

Contract gap finding (deeper than registration-time)

## Properties

### description

> **description**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:183

What's not covered

***

### ruleId

> **ruleId**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:181

***

### type

> **type**: `"missing-edge-case"` \| `"missing-error-path"` \| `"missing-boundary"` \| `"cross-reference-broken"`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:185

Type of gap
