[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / EventBusOptions

# Interface: EventBusOptions

Defined in: src/lifecycle/event-bus.ts:21

Options for creating a lifecycle event bus.

## Properties

### config

> **config**: [`LifecycleConfig`](LifecycleConfig.md)

Defined in: src/lifecycle/event-bus.ts:23

Lifecycle configuration

***

### expectations?

> `optional` **expectations?**: [`LifecycleExpectation`](LifecycleExpectation.md)[]

Defined in: src/lifecycle/event-bus.ts:25

Initial expectations

***

### onEvent?

> `optional` **onEvent?**: (`event`) => `void`

Defined in: src/lifecycle/event-bus.ts:29

Called on any event (for logging/Chronos)

#### Parameters

##### event

[`LifecycleEvent`](LifecycleEvent.md)

#### Returns

`void`

***

### onTrigger?

> `optional` **onTrigger?**: (`event`, `triggerId`, `result`) => `void`

Defined in: src/lifecycle/event-bus.ts:27

Called when a trigger executes

#### Parameters

##### event

[`LifecycleEvent`](LifecycleEvent.md)

##### triggerId

`string`

##### result

[`TriggerResult`](TriggerResult.md)

#### Returns

`void`
