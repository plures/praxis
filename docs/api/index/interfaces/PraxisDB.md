[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisDB

# Interface: PraxisDB

Defined in: src/core/pluresdb/adapter.ts:24

Core database interface for Praxis

Provides a minimal API for get/set/watch operations.
Can be backed by in-memory storage or PluresDB.

## Methods

### get()

> **get**\<`T`\>(`key`): `Promise`\<`T` \| `undefined`\>

Defined in: src/core/pluresdb/adapter.ts:30

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

***

### set()

> **set**\<`T`\>(`key`, `value`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/adapter.ts:37

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

***

### watch()

> **watch**\<`T`\>(`key`, `callback`): [`UnsubscribeFn`](../type-aliases/UnsubscribeFn.md)

Defined in: src/core/pluresdb/adapter.ts:45

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
