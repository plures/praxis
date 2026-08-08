[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ConstraintDescriptor

# Interface: ConstraintDescriptor\<TContext\>

Defined in: packages/praxis-core/src/rules.ts:92

Descriptor for a constraint, including its ID, description, and implementation.

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### contract?

> `optional` **contract?**: [`Contract`](Contract.md)

Defined in: packages/praxis-core/src/rules.ts:100

Optional contract for constraint behavior

***

### description

> **description**: `string`

Defined in: packages/praxis-core/src/rules.ts:96

Human-readable description

***

### id

> **id**: `string`

Defined in: packages/praxis-core/src/rules.ts:94

Unique identifier for the constraint

***

### impl

> **impl**: [`ConstraintFn`](../type-aliases/ConstraintFn.md)\<`TContext`\>

Defined in: packages/praxis-core/src/rules.ts:98

Implementation function

***

### meta?

> `optional` **meta?**: `Record`\<`string`, `unknown`\>

Defined in: packages/praxis-core/src/rules.ts:102

Optional metadata
