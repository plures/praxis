[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / VerificationReport

# Interface: VerificationReport

Defined in: src/expectations/types.ts:46

Full verification report for an ExpectationSet.

## Properties

### allEdgeCases

> **allEdgeCases**: `string`[]

Defined in: src/expectations/types.ts:63

All edge cases found across all expectations

***

### allMitigations

> **allMitigations**: `string`[]

Defined in: src/expectations/types.ts:65

All mitigations suggested

***

### expectations

> **expectations**: [`ExpectationResult`](ExpectationResult.md)[]

Defined in: src/expectations/types.ts:54

Per-expectation results

***

### setName

> **setName**: `string`

Defined in: src/expectations/types.ts:48

Set name

***

### status

> **status**: `"partial"` \| `"satisfied"` \| `"violated"`

Defined in: src/expectations/types.ts:52

Overall status: satisfied if ALL expectations are satisfied

***

### summary

> **summary**: `object`

Defined in: src/expectations/types.ts:56

Summary stats

#### partial

> **partial**: `number`

#### satisfied

> **satisfied**: `number`

#### total

> **total**: `number`

#### violated

> **violated**: `number`

***

### timestamp

> **timestamp**: `string`

Defined in: src/expectations/types.ts:50

Timestamp of verification
