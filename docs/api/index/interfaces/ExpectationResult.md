[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ExpectationResult

# Interface: ExpectationResult

Defined in: src/expectations/types.ts:32

Verification result for a single Expectation.

## Properties

### conditions

> **conditions**: [`ConditionResult`](ConditionResult.md)[]

Defined in: src/expectations/types.ts:38

Per-condition results

***

### edgeCases

> **edgeCases**: `string`[]

Defined in: src/expectations/types.ts:40

Edge cases discovered

***

### mitigations

> **mitigations**: `string`[]

Defined in: src/expectations/types.ts:42

Suggested mitigations for violated/partial expectations

***

### name

> **name**: `string`

Defined in: src/expectations/types.ts:34

The expectation name/ID

***

### status

> **status**: `"partial"` \| `"satisfied"` \| `"violated"`

Defined in: src/expectations/types.ts:36

Overall status: satisfied if ALL conditions pass
