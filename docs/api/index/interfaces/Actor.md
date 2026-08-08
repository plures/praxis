[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Actor

# Interface: Actor\<TContext\>

Defined in: packages/praxis-core/src/actors.ts:23

Actor interface

An actor observes state changes and can:
- React to state changes (onStateChange)
- Perform initialization (onStart)
- Perform cleanup (onStop)

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### description

> **description**: `string`

Defined in: packages/praxis-core/src/actors.ts:27

Human-readable description

***

### id

> **id**: `string`

Defined in: packages/praxis-core/src/actors.ts:25

Unique identifier for the actor

***

### onStart?

> `optional` **onStart?**: (`engine`) => `void` \| `Promise`\<`void`\>

Defined in: packages/praxis-core/src/actors.ts:29

Called when the actor is started

#### Parameters

##### engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

#### Returns

`void` \| `Promise`\<`void`\>

***

### onStateChange?

> `optional` **onStateChange?**: (`state`, `engine`) => `void` \| `Promise`\<`void`\>

Defined in: packages/praxis-core/src/actors.ts:31

Called when state changes

#### Parameters

##### state

`Readonly`\<[`PraxisState`](PraxisState.md) & `object`\>

##### engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

#### Returns

`void` \| `Promise`\<`void`\>

***

### onStop?

> `optional` **onStop?**: () => `void` \| `Promise`\<`void`\>

Defined in: packages/praxis-core/src/actors.ts:36

Called when the actor is stopped

#### Returns

`void` \| `Promise`\<`void`\>
