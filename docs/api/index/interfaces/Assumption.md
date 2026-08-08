[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Assumption

# Interface: Assumption

Defined in: packages/praxis-core/src/decision-ledger/types.ts:11

A single assumption made during contract definition.

## Properties

### confidence

> **confidence**: `number`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:17

Confidence level (0.0 to 1.0)

***

### derivedFrom?

> `optional` **derivedFrom?**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:21

What this assumption was derived from

***

### id

> **id**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:13

Stable unique identifier for the assumption

***

### impacts

> **impacts**: (`"tests"` \| `"spec"` \| `"code"`)[]

Defined in: packages/praxis-core/src/decision-ledger/types.ts:23

What artifacts this assumption impacts

***

### justification

> **justification**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:19

Justification for the assumption

***

### statement

> **statement**: `string`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:15

The assumption statement

***

### status

> **status**: `"active"` \| `"revised"` \| `"invalidated"`

Defined in: packages/praxis-core/src/decision-ledger/types.ts:25

Current status of the assumption
