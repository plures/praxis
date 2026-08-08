[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisDBStore

# Class: PraxisDBStore\<TContext\>

Defined in: src/core/pluresdb/store.ts:121

A reactive Praxis engine backed by a PluresDB store.

Subscribes to PluresDB paths, runs rules on state changes, and writes
emitted facts back to the database. Supports Chronicle causal tracking.

## Type Parameters

### TContext

`TContext` = `unknown`

## Constructors

### Constructor

> **new PraxisDBStore**\<`TContext`\>(`options`): `PraxisDBStore`\<`TContext`\>

Defined in: src/core/pluresdb/store.ts:130

#### Parameters

##### options

[`PraxisDBStoreOptions`](../interfaces/PraxisDBStoreOptions.md)\<`TContext`\> & `object`

#### Returns

`PraxisDBStore`\<`TContext`\>

## Methods

### appendEvent()

> **appendEvent**(`event`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/store.ts:287

Append an event to the event stream

Events are stored as append-only streams under `/_praxis/events/<eventTag>`

#### Parameters

##### event

[`PraxisEvent`](../interfaces/PraxisEvent.md)

The event to append

#### Returns

`Promise`\<`void`\>

***

### appendEvents()

> **appendEvents**(`events`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/store.ts:342

Append multiple events to their respective streams

#### Parameters

##### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

The events to append

#### Returns

`Promise`\<`void`\>

***

### dispose()

> **dispose**(): `void`

Defined in: src/core/pluresdb/store.ts:587

Dispose of all subscriptions

#### Returns

`void`

***

### getContext()

> **getContext**(): `TContext`

Defined in: src/core/pluresdb/store.ts:580

Get the current context

#### Returns

`TContext`

***

### getEvents()

> **getEvents**(`eventTag`, `options?`): `Promise`\<[`EventStreamEntry`](../interfaces/EventStreamEntry.md)[]\>

Defined in: src/core/pluresdb/store.ts:405

Get events from a stream

#### Parameters

##### eventTag

`string`

The event type tag

##### options?

Query options

###### limit?

`number`

###### since?

`number`

#### Returns

`Promise`\<[`EventStreamEntry`](../interfaces/EventStreamEntry.md)[]\>

Array of event stream entries

***

### getFact()

> **getFact**(`factTag`, `id`): `Promise`\<[`PraxisFact`](../interfaces/PraxisFact.md) \| `undefined`\>

Defined in: src/core/pluresdb/store.ts:275

Get a fact by tag and id

#### Parameters

##### factTag

`string`

The fact type tag

##### id

`string`

The fact id

#### Returns

`Promise`\<[`PraxisFact`](../interfaces/PraxisFact.md) \| `undefined`\>

The fact or undefined if not found

***

### storeFact()

> **storeFact**(`fact`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/store.ts:166

Store a fact in PluresDB

Facts are stored under `/_praxis/facts/<factTag>/<id>`
If no id is provided in the payload, a timestamp-based id is used.

#### Parameters

##### fact

[`PraxisFact`](../interfaces/PraxisFact.md)

The fact to store

#### Returns

`Promise`\<`void`\>

Promise that resolves when the fact is stored

***

### storeFacts()

> **storeFacts**(`facts`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/store.ts:213

Store multiple facts in PluresDB

#### Parameters

##### facts

[`PraxisFact`](../interfaces/PraxisFact.md)[]

The facts to store

#### Returns

`Promise`\<`void`\>

***

### updateContext()

> **updateContext**(`context`): `void`

Defined in: src/core/pluresdb/store.ts:573

Update the context

#### Parameters

##### context

`TContext`

#### Returns

`void`

***

### watchFacts()

> **watchFacts**(`factTag`, `callback`): [`UnsubscribeFn`](../type-aliases/UnsubscribeFn.md)

Defined in: src/core/pluresdb/store.ts:433

Watch a fact path for changes

#### Parameters

##### factTag

`string`

The fact type tag to watch

##### callback

(`facts`) => `void`

Called when facts of this type change

#### Returns

[`UnsubscribeFn`](../type-aliases/UnsubscribeFn.md)

Unsubscribe function

***

### withChronicle()

> **withChronicle**(`chronicle`): `this`

Defined in: src/core/pluresdb/store.ts:152

Attach a Chronicle observer to this store.

Every subsequent `storeFact` and `appendEvent` call will be recorded as a
causal graph node in PluresDB, enabling full observability for free.

#### Parameters

##### chronicle

[`Chronicle`](../interfaces/Chronicle.md)

Chronicle implementation to attach

#### Returns

`this`

`this` for fluent chaining

#### Example

```typescript
const store = createPraxisDBStore(db, registry)
  .withChronicle(createChronicle(db));
```
