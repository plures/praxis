[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DefineContractOptions

# Interface: DefineContractOptions

Defined in: packages/praxis-core/src/decision-ledger/types.ts:109

Options for defining a contract.

## Properties

### assumptions?

> `optional` **assumptions?**: [`Assumption`](Assumption.md)[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:119

Optional assumptions

***

### behavior

> **behavior**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:113

Canonical behavior description

***

### examples

> **examples**: [`Example`](Example.md)[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:115

Given/When/Then examples

***

### invariants

> **invariants**: `string`[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:117

Invariants that must hold

***

### references?

> `optional` **references?**: [`Reference`](Reference.md)[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:121

Optional references

***

### ruleId

> **ruleId**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:111

ID of the rule or constraint

***

### version?

> `optional` **version?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:123

Optional version
