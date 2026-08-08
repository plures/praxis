[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ActorManager

# Class: ActorManager\<TContext\>

Defined in: packages/praxis-core/src/actors.ts:44

Actor manager

Manages the lifecycle of actors and coordinates their interaction with the engine.

## Type Parameters

### TContext

`TContext` = `unknown`

## Constructors

### Constructor

> **new ActorManager**\<`TContext`\>(): `ActorManager`\<`TContext`\>

#### Returns

`ActorManager`\<`TContext`\>

## Methods

### attachEngine()

> **attachEngine**(`engine`): `void`

Defined in: packages/praxis-core/src/actors.ts:72

Attach the actor manager to an engine

#### Parameters

##### engine

[`LogicEngine`](LogicEngine.md)\<`TContext`\>

#### Returns

`void`

***

### getActiveActorIds()

> **getActiveActorIds**(): `string`[]

Defined in: packages/praxis-core/src/actors.ts:168

Get all active actor IDs

#### Returns

`string`[]

***

### getActorIds()

> **getActorIds**(): `string`[]

Defined in: packages/praxis-core/src/actors.ts:161

Get all registered actor IDs

#### Returns

`string`[]

***

### isActive()

> **isActive**(`actorId`): `boolean`

Defined in: packages/praxis-core/src/actors.ts:175

Check if an actor is active

#### Parameters

##### actorId

`string`

#### Returns

`boolean`

***

### notifyStateChange()

> **notifyStateChange**(`state`): `Promise`\<`void`\>

Defined in: packages/praxis-core/src/actors.ts:140

Notify active actors of a state change

#### Parameters

##### state

`Readonly`\<[`PraxisState`](../interfaces/PraxisState.md) & `object`\>

#### Returns

`Promise`\<`void`\>

***

### register()

> **register**(`actor`): `void`

Defined in: packages/praxis-core/src/actors.ts:52

Register an actor

#### Parameters

##### actor

[`Actor`](../interfaces/Actor.md)\<`TContext`\>

#### Returns

`void`

***

### start()

> **start**(`actorId`): `Promise`\<`void`\>

Defined in: packages/praxis-core/src/actors.ts:79

Start an actor

#### Parameters

##### actorId

`string`

#### Returns

`Promise`\<`void`\>

***

### startAll()

> **startAll**(): `Promise`\<`void`\>

Defined in: packages/praxis-core/src/actors.ts:118

Start all registered actors

#### Returns

`Promise`\<`void`\>

***

### stop()

> **stop**(`actorId`): `Promise`\<`void`\>

Defined in: packages/praxis-core/src/actors.ts:100

Stop an actor

#### Parameters

##### actorId

`string`

#### Returns

`Promise`\<`void`\>

***

### stopAll()

> **stopAll**(): `Promise`\<`void`\>

Defined in: packages/praxis-core/src/actors.ts:130

Stop all active actors

#### Returns

`Promise`\<`void`\>

***

### unregister()

> **unregister**(`actorId`): `void`

Defined in: packages/praxis-core/src/actors.ts:62

Unregister an actor

#### Parameters

##### actorId

`string`

#### Returns

`void`
