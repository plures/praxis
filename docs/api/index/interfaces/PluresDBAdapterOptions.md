[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PluresDBAdapterOptions

# Interface: PluresDBAdapterOptions\<TContext\>

Defined in: src/integrations/pluresdb.ts:129

Options for creating a PluresDB adapter

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### db

> **db**: [`PraxisDB`](PraxisDB.md)

Defined in: src/integrations/pluresdb.ts:131

The PraxisDB instance to use

***

### initialContext?

> `optional` **initialContext?**: `TContext`

Defined in: src/integrations/pluresdb.ts:135

Initial context

***

### registry

> **registry**: [`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

Defined in: src/integrations/pluresdb.ts:133

The PraxisRegistry for rules and constraints
