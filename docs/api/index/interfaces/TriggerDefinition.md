[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TriggerDefinition

# Interface: TriggerDefinition

Defined in: src/lifecycle/types.ts:155

Trigger definition — maps an event to actions

## Properties

### actions

> **actions**: [`TriggerAction`](TriggerAction.md)[]

Defined in: src/lifecycle/types.ts:161

Actions to execute (in order)

***

### on

> **on**: [`LifecycleEventName`](../type-aliases/LifecycleEventName.md)

Defined in: src/lifecycle/types.ts:157

The lifecycle event this trigger fires on

***

### when?

> `optional` **when?**: (`event`) => `boolean`

Defined in: src/lifecycle/types.ts:159

Optional filter — only fire if condition matches

#### Parameters

##### event

[`LifecycleEvent`](LifecycleEvent.md)

#### Returns

`boolean`
