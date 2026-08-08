[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PluresDBPraxisAdapter

# Class: PluresDBPraxisAdapter

Defined in: src/core/pluresdb/adapter.ts:151

PluresDB-backed implementation of PraxisDB

Wraps the official PluresDB package from NPM to provide
the PraxisDB interface for production use.

## Implements

- [`PraxisDB`](../interfaces/PraxisDB.md)

## Constructors

### Constructor

> **new PluresDBPraxisAdapter**(`config`): `PluresDBPraxisAdapter`

Defined in: src/core/pluresdb/adapter.ts:158

#### Parameters

##### config

[`PluresDBInstance`](../type-aliases/PluresDBInstance.md) \| [`PluresDBAdapterConfig`](../interfaces/PluresDBAdapterConfig.md)

#### Returns

`PluresDBPraxisAdapter`

## Methods

### dispose()

> **dispose**(): `void`

Defined in: src/core/pluresdb/adapter.ts:248

Clean up all resources

#### Returns

`void`

***

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `undefined`\>

Defined in: src/core/pluresdb/adapter.ts:169

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

### set()

> **set**\<`T`\>(`key`, `value`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/adapter.ts:179

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

Defined in: src/core/pluresdb/adapter.ts:194

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
