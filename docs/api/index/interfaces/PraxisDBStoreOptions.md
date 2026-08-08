[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisDBStoreOptions

# Interface: PraxisDBStoreOptions\<TContext\>

Defined in: src/core/pluresdb/store.ts:81

Options for creating a PraxisDBStore

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### db

> **db**: [`PraxisDB`](PraxisDB.md)

Defined in: src/core/pluresdb/store.ts:83

The PraxisDB instance to use

***

### initialContext?

> `optional` **initialContext?**: `TContext`

Defined in: src/core/pluresdb/store.ts:87

Initial context for rule evaluation

***

### registry

> **registry**: [`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

Defined in: src/core/pluresdb/store.ts:85

The PraxisRegistry for rules and constraints
