[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / InputRulesConfig

# Interface: InputRulesConfig

Defined in: src/factory/types.ts:13

Configuration for the pre-built input validation rule module.

## Properties

### fieldName?

> `optional` **fieldName?**: `string`

Defined in: src/factory/types.ts:21

Custom field name for facts/events (default: 'input')

***

### maxLength?

> `optional` **maxLength?**: `number`

Defined in: src/factory/types.ts:17

Maximum input length (0 = unlimited)

***

### required?

> `optional` **required?**: `boolean`

Defined in: src/factory/types.ts:19

Whether the input is required (non-empty)

***

### sanitize?

> `optional` **sanitize?**: [`SanitizationType`](../type-aliases/SanitizationType.md)[]

Defined in: src/factory/types.ts:15

Sanitization checks to apply
