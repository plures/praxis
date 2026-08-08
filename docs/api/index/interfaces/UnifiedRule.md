[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UnifiedRule

# Interface: UnifiedRule

Defined in: src/unified/types.ts:103

A reactive rule definition for the unified API — watches graph paths and emits facts.

## Properties

### description?

> `optional` **description?**: `string`

Defined in: src/unified/types.ts:107

Human-readable description

***

### evaluate

> **evaluate**: (`values`, `facts`) => [`RuleResult`](../classes/RuleResult.md)

Defined in: src/unified/types.ts:111

Rule evaluation function — receives watched values by path

#### Parameters

##### values

`Record`\<`string`, `unknown`\>

##### facts

[`PraxisFact`](PraxisFact.md)[]

#### Returns

[`RuleResult`](../classes/RuleResult.md)

***

### id

> **id**: `string`

Defined in: src/unified/types.ts:105

Unique rule ID

***

### watch

> **watch**: `string`[]

Defined in: src/unified/types.ts:109

Graph paths this rule watches — auto-subscribed
