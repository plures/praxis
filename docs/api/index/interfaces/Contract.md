[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Contract

# Interface: Contract

Defined in: packages/praxis-core/src/decision-ledger/types.ts:56

Contract for a rule or constraint.
Documents the expected behavior, test cases, invariants, and assumptions.

## Properties

### assumptions?

> `optional` **assumptions?**: [`Assumption`](Assumption.md)[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:66

Explicit assumptions with confidence levels

***

### behavior

> **behavior**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:60

Canonical behavior description

***

### examples

> **examples**: [`Example`](Example.md)[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:62

Given/When/Then examples (become test vectors)

***

### invariants

> **invariants**: `string`[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:64

TLA+-friendly invariants or Praxis-level invariants

***

### references?

> `optional` **references?**: [`Reference`](Reference.md)[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:68

References to docs, tickets, links

***

### ruleId

> **ruleId**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:58

ID of the rule or constraint this contract applies to

***

### timestamp?

> `optional` **timestamp?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:72

Timestamp of contract creation

***

### version?

> `optional` **version?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:70

Contract version (for evolution tracking)
