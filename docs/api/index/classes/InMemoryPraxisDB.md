[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / InMemoryPraxisDB

# Class: InMemoryPraxisDB

Defined in: src/core/pluresdb/adapter.ts:54

In-memory implementation of PraxisDB

Provides a simple in-memory store for development and testing.
Suitable for proxying to PluresDB later.

## Implements

- [`PraxisDB`](../interfaces/PraxisDB.md)

## Constructors

### Constructor

> **new InMemoryPraxisDB**(): `InMemoryPraxisDB`

#### Returns

`InMemoryPraxisDB`

## Methods

### clear()

> **clear**(): `void`

Defined in: src/core/pluresdb/adapter.ts:102

Clear all data (for testing)

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `undefined`\>

Defined in: src/core/pluresdb/adapter.ts:58

Get a value by key

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

The key to retrieve

#### Returns

`Promise`\<`T` \| `undefined`\>

The value or undefined if not found

#### Implementation of

[`PraxisDB`](../interfaces/PraxisDB.md).[`get`](../interfaces/PraxisDB.md#get)

***

### keys()

> **keys**(): `string`[]

Defined in: src/core/pluresdb/adapter.ts:95

Get all keys (for testing/debugging)

#### Returns

`string`[]

***

### set()

> **set**\<`T`\>(`key`, `value`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/adapter.ts:62

Set a value by key

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

The key to set

##### value

`T`

The value to store

#### Returns

`Promise`\<`void`\>

#### Implementation of

[`PraxisDB`](../interfaces/PraxisDB.md).[`set`](../interfaces/PraxisDB.md#set)

***

### watch()

> **watch**\<`T`\>(`key`, `callback`): [`UnsubscribeFn`](../type-aliases/UnsubscribeFn.md)

Defined in: src/core/pluresdb/adapter.ts:74

Watch a key for changes

#### Type Parameters

##### T

`T`

#### Parameters

##### key

`string`

The key to watch

##### callback

(`val`) => `void`

Called when the value changes

#### Returns

[`UnsubscribeFn`](../type-aliases/UnsubscribeFn.md)

Function to unsubscribe from updates

#### Implementation of

[`PraxisDB`](../interfaces/PraxisDB.md).[`watch`](../interfaces/PraxisDB.md#watch)
