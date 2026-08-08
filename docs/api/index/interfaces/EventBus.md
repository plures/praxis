[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / EventBus

# Interface: EventBus

Defined in: src/lifecycle/event-bus.ts:33

A reactive lifecycle event bus — events fire synchronously, triggers execute immediately.

## Properties

### addExpectation

> **addExpectation**: (`expectation`) => `void`

Defined in: src/lifecycle/event-bus.ts:41

Register an expectation

#### Parameters

##### expectation

[`LifecycleExpectation`](LifecycleExpectation.md)

#### Returns

`void`

***

### addTrigger

> **addTrigger**: (`trigger`) => `void`

Defined in: src/lifecycle/event-bus.ts:37

Register additional triggers at runtime

#### Parameters

##### trigger

[`TriggerDefinition`](TriggerDefinition.md)

#### Returns

`void`

***

### destroy

> **destroy**: () => `void`

Defined in: src/lifecycle/event-bus.ts:51

Destroy and clean up

#### Returns

`void`

***

### emit

> **emit**: (`name`, `data?`, `source?`) => `Promise`\<[`DispatchResult`](DispatchResult.md)\>

Defined in: src/lifecycle/event-bus.ts:35

Emit a lifecycle event — triggers fire synchronously

#### Parameters

##### name

[`LifecycleEventName`](../type-aliases/LifecycleEventName.md)

##### data?

`Record`\<`string`, `unknown`\>

##### source?

`string`

#### Returns

`Promise`\<[`DispatchResult`](DispatchResult.md)\>

***

### getAllExpectations

> **getAllExpectations**: () => [`LifecycleExpectation`](LifecycleExpectation.md)[]

Defined in: src/lifecycle/event-bus.ts:45

Get all expectations

#### Returns

[`LifecycleExpectation`](LifecycleExpectation.md)[]

***

### getExpectation

> **getExpectation**: (`id`) => [`LifecycleExpectation`](LifecycleExpectation.md) \| `undefined`

Defined in: src/lifecycle/event-bus.ts:43

Get an expectation by ID

#### Parameters

##### id

`string`

#### Returns

[`LifecycleExpectation`](LifecycleExpectation.md) \| `undefined`

***

### getHistory

> **getHistory**: () => readonly [`LifecycleEvent`](LifecycleEvent.md)[]

Defined in: src/lifecycle/event-bus.ts:47

Get event history

#### Returns

readonly [`LifecycleEvent`](LifecycleEvent.md)[]

***

### getTriggersFor

> **getTriggersFor**: (`name`) => readonly [`TriggerDefinition`](TriggerDefinition.md)[]

Defined in: src/lifecycle/event-bus.ts:49

Get triggers for a specific event

#### Parameters

##### name

[`LifecycleEventName`](../type-aliases/LifecycleEventName.md)

#### Returns

readonly [`TriggerDefinition`](TriggerDefinition.md)[]

***

### removeTrigger

> **removeTrigger**: (`eventName`, `actionId`) => `void`

Defined in: src/lifecycle/event-bus.ts:39

Remove a trigger by event name + action ID

#### Parameters

##### eventName

[`LifecycleEventName`](../type-aliases/LifecycleEventName.md)

##### actionId

`string`

#### Returns

`void`
