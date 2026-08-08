[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ConditionResult

# Interface: ConditionResult

Defined in: src/expectations/types.ts:22

Detailed result for a single condition check.

## Properties

### condition

> **condition**: [`ExpectationCondition`](ExpectationCondition.md)

Defined in: src/expectations/types.ts:23

***

### explanation

> **explanation**: `string`

Defined in: src/expectations/types.ts:26

Explanation of how the condition was verified or why it couldn't be

***

### relatedRules

> **relatedRules**: `string`[]

Defined in: src/expectations/types.ts:28

Related rule IDs that informed this check

***

### status

> **status**: [`ConditionStatus`](../type-aliases/ConditionStatus.md)

Defined in: src/expectations/types.ts:24
