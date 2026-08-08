[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Suggestion

# Interface: Suggestion

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:206

An actionable fix suggestion

## Properties

### action

> **action**: `"remove"` \| `"add-rule"` \| `"modify"` \| `"merge"` \| `"add-priority"` \| `"add-event-type"` \| `"add-contract"`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:214

Suggested action type

***

### entityId

> **entityId**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:210

Related entity ID

***

### findingType

> **findingType**: [`FindingType`](../type-aliases/FindingType.md)

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:208

What finding this addresses

***

### message

> **message**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:212

Human-readable suggestion

***

### priority

> **priority**: `number`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:216

Priority (higher = more important)

***

### skeleton?

> `optional` **skeleton?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:218

Optional code skeleton
