[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LedgerDiffEntry

# Interface: LedgerDiffEntry

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:258

A change between two analysis runs

## Properties

### category

> **category**: `"dead-rule"` \| `"gap"` \| `"contradiction"` \| `"unreachable-state"` \| `"shadowed-rule"` \| `"suggestion"`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:260

***

### description

> **description**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:261

***

### entityId

> **entityId**: `string`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:263

Entity ID (rule, state, etc.)

***

### type

> **type**: `"added"` \| `"removed"` \| `"changed"`

Defined in: packages/praxis-core/src/decision-ledger/analyzer-types.ts:259
