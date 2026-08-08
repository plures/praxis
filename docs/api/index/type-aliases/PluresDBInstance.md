[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PluresDBInstance

# Type Alias: PluresDBInstance

> **PluresDBInstance** = `object`

Defined in: src/core/pluresdb/adapter.ts:127

PluresDB instance type - represents either PluresNode or SQLiteCompatibleAPI

## Methods

### close()?

> `optional` **close**(): `Promise`\<`void`\>

Defined in: src/core/pluresdb/adapter.ts:132

#### Returns

`Promise`\<`void`\>

***

### delete()?

> `optional` **delete**(`key`): `Promise`\<`void`\>

Defined in: src/core/pluresdb/adapter.ts:130

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`void`\>

***

### get()

> **get**(`key`): `Promise`\<`unknown`\>

Defined in: src/core/pluresdb/adapter.ts:128

#### Parameters

##### key

`string`

#### Returns

`Promise`\<`unknown`\>

***

### list()?

> `optional` **list**(): `Promise`\<`unknown`[]\>

Defined in: src/core/pluresdb/adapter.ts:131

#### Returns

`Promise`\<`unknown`[]\>

***

### put()

> **put**(`key`, `value`): `Promise`\<`unknown`\>

Defined in: src/core/pluresdb/adapter.ts:129

#### Parameters

##### key

`string`

##### value

`unknown`

#### Returns

`Promise`\<`unknown`\>
