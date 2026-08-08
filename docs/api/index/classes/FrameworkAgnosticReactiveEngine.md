[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / FrameworkAgnosticReactiveEngine

# Class: FrameworkAgnosticReactiveEngine\<TContext\>

Defined in: packages/praxis-core/src/reactive-engine.ts:37

Framework-agnostic reactive logic engine using JavaScript Proxies

## Type Parameters

### TContext

`TContext` *extends* `object`

## Constructors

### Constructor

> **new FrameworkAgnosticReactiveEngine**\<`TContext`\>(`options`): `ReactiveLogicEngine`\<`TContext`\>

Defined in: packages/praxis-core/src/reactive-engine.ts:50

#### Parameters

##### options

[`FrameworkAgnosticReactiveEngineOptions`](../interfaces/FrameworkAgnosticReactiveEngineOptions.md)\<`TContext`\>

#### Returns

`ReactiveLogicEngine`\<`TContext`\>

## Accessors

### context

#### Get Signature

> **get** **context**(): `TContext`

Defined in: packages/praxis-core/src/reactive-engine.ts:164

Access the reactive context.
Changes to this object will trigger subscriber notifications.

##### Returns

`TContext`

***

### facts

#### Get Signature

> **get** **facts**(): `unknown`[]

Defined in: packages/praxis-core/src/reactive-engine.ts:172

Access the reactive facts list.
Changes to this array will trigger subscriber notifications.

##### Returns

`unknown`[]

***

### meta

#### Get Signature

> **get** **meta**(): `Record`\<`string`, `unknown`\>

Defined in: packages/praxis-core/src/reactive-engine.ts:180

Access the reactive metadata.
Changes to this object will trigger subscriber notifications.

##### Returns

`Record`\<`string`, `unknown`\>

***

### state

#### Get Signature

> **get** **state**(): `object`

Defined in: packages/praxis-core/src/reactive-engine.ts:152

Get the full state object

##### Returns

`object`

###### context

> **context**: `TContext`

###### facts

> **facts**: `unknown`[]

###### meta

> **meta**: `Record`\<`string`, `unknown`\>

## Methods

### $derived()

> **$derived**\<`TDerived`\>(`selector`): `object`

Defined in: packages/praxis-core/src/reactive-engine.ts:242

Create a derived/computed value from the state.
The selector function will be called whenever the state changes.

#### Type Parameters

##### TDerived

`TDerived`

#### Parameters

##### selector

(`state`) => `TDerived`

Function to extract derived value from state

#### Returns

`object`

Object with subscribe method for reactive updates

##### subscribe

> **subscribe**: (`callback`) => `UnsubscribeFn`

###### Parameters

###### callback

(`value`) => `void`

###### Returns

`UnsubscribeFn`

***

### apply()

> **apply**(`mutator`): `void`

Defined in: packages/praxis-core/src/reactive-engine.ts:191

Apply a mutation to the state.
This is the "Action" or "Rule" equivalent.
Mutations are batched - notifications only happen once per apply call.

#### Parameters

##### mutator

(`state`) => `void`

A function that receives the state and modifies it.

#### Returns

`void`

***

### subscribe()

> **subscribe**(`callback`): `UnsubscribeFn`

Defined in: packages/praxis-core/src/reactive-engine.ts:215

Subscribe to state changes.
Returns an unsubscribe function.

#### Parameters

##### callback

[`StateChangeCallback`](../type-aliases/StateChangeCallback.md)\<`TContext`\>

Function to call when state changes

#### Returns

`UnsubscribeFn`

Unsubscribe function
