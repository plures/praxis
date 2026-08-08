[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LifecycleEvent

# Interface: LifecycleEvent

Defined in: src/lifecycle/types.ts:101

Lifecycle event payload

## Properties

### data

> **data**: `Record`\<`string`, `unknown`\>

Defined in: src/lifecycle/types.ts:109

Arbitrary payload

***

### expectationId?

> `optional` **expectationId?**: `string`

Defined in: src/lifecycle/types.ts:105

The expectation this event relates to (if any)

***

### name

> **name**: [`LifecycleEventName`](../type-aliases/LifecycleEventName.md)

Defined in: src/lifecycle/types.ts:103

Event name from the taxonomy

***

### source

> **source**: `string`

Defined in: src/lifecycle/types.ts:111

Source of the event (e.g., 'git-hook', 'ci', 'manual')

***

### timestamp

> **timestamp**: `number`

Defined in: src/lifecycle/types.ts:107

Timestamp
