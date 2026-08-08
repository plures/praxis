[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UnifiedConstraint

# Interface: UnifiedConstraint

Defined in: src/unified/types.ts:117

A reactive constraint definition for the unified API — validates graph path values.

## Properties

### description?

> `optional` **description?**: `string`

Defined in: src/unified/types.ts:121

Human-readable description

***

### id

> **id**: `string`

Defined in: src/unified/types.ts:119

Unique constraint ID

***

### validate

> **validate**: (`values`) => `string` \| `true`

Defined in: src/unified/types.ts:125

Validation function — return true if valid, string if violated

#### Parameters

##### values

`Record`\<`string`, `unknown`\>

#### Returns

`string` \| `true`

***

### watch

> **watch**: `string`[]

Defined in: src/unified/types.ts:123

Graph paths this constraint reads
