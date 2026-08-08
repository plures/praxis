[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TriggerAction

# Interface: TriggerAction

Defined in: src/lifecycle/types.ts:117

A trigger action — what happens when a lifecycle event fires

## Properties

### description?

> `optional` **description?**: `string`

Defined in: src/lifecycle/types.ts:121

Human-readable description

***

### execute

> **execute**: (`event`, `ctx`) => `Promise`\<[`TriggerResult`](TriggerResult.md)\>

Defined in: src/lifecycle/types.ts:123

The handler function — receives the event and returns results

#### Parameters

##### event

[`LifecycleEvent`](LifecycleEvent.md)

##### ctx

[`TriggerContext`](TriggerContext.md)

#### Returns

`Promise`\<[`TriggerResult`](TriggerResult.md)\>

***

### id

> **id**: `string`

Defined in: src/lifecycle/types.ts:119

Unique action ID
