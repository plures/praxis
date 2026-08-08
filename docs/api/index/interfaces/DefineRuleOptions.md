[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DefineRuleOptions

# Interface: DefineRuleOptions\<TContext\>

Defined in: src/dsl/index.ts:90

Options for defining a rule

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### contract?

> `optional` **contract?**: `Contract`

Defined in: src/dsl/index.ts:99

***

### description

> **description**: `string`

Defined in: src/dsl/index.ts:92

***

### eventTypes?

> `optional` **eventTypes?**: `string` \| `string`[]

Defined in: src/dsl/index.ts:98

Optional event type filter — only evaluate this rule when at least one
event in the batch has a matching `tag`. Accepts a single tag or array.

***

### id

> **id**: `string`

Defined in: src/dsl/index.ts:91

***

### impl

> **impl**: [`RuleFn`](../type-aliases/RuleFn.md)\<`TContext`\>

Defined in: src/dsl/index.ts:93

***

### meta?

> `optional` **meta?**: `Record`\<`string`, `unknown`\>

Defined in: src/dsl/index.ts:100
