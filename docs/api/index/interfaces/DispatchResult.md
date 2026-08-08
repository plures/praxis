[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DispatchResult

# Interface: DispatchResult

Defined in: src/lifecycle/event-bus.ts:55

Result of dispatching an event through the bus

## Properties

### cascadedEvents

> **cascadedEvents**: [`LifecycleEvent`](LifecycleEvent.md)[]

Defined in: src/lifecycle/event-bus.ts:65

Events emitted by triggers (cascade)

***

### event

> **event**: [`LifecycleEvent`](LifecycleEvent.md)

Defined in: src/lifecycle/event-bus.ts:57

The event that was dispatched

***

### triggerResults

> **triggerResults**: `object`[]

Defined in: src/lifecycle/event-bus.ts:59

Results from each trigger that fired

#### actionId

> **actionId**: `string`

#### result

> **result**: [`TriggerResult`](TriggerResult.md)

#### triggerId

> **triggerId**: `string`
