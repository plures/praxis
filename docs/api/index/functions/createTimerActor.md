[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createTimerActor

# Function: createTimerActor()

> **createTimerActor**\<`TContext`\>(`id`, `intervalMs`, `createEvent`): [`Actor`](../interfaces/Actor.md)\<`TContext`\>

Defined in: packages/praxis-core/src/actors.ts:188

Helper to create a simple actor that dispatches events on a timer

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### id

`string`

Unique identifier for the actor

### intervalMs

`number`

Timer interval in milliseconds

### createEvent

() => [`PraxisEvent`](../interfaces/PraxisEvent.md)

Factory function that creates the event to dispatch on each tick

## Returns

[`Actor`](../interfaces/Actor.md)\<`TContext`\>

An [Actor](../interfaces/Actor.md) that starts a timer on `onStart` and clears it on `onStop`
