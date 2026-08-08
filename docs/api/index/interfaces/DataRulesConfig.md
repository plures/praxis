[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DataRulesConfig

# Interface: DataRulesConfig

Defined in: src/factory/types.ts:61

Configuration for the pre-built data-loading and cache rule module.

## Properties

### cacheInvalidation?

> `optional` **cacheInvalidation?**: `boolean`

Defined in: src/factory/types.ts:67

Invalidate relevant caches on data change

***

### entityName?

> `optional` **entityName?**: `string`

Defined in: src/factory/types.ts:69

Custom entity name for facts

***

### optimisticUpdate?

> `optional` **optimisticUpdate?**: `boolean`

Defined in: src/factory/types.ts:63

Enable optimistic UI updates

***

### rollbackOnError?

> `optional` **rollbackOnError?**: `boolean`

Defined in: src/factory/types.ts:65

Rollback optimistic updates on error
