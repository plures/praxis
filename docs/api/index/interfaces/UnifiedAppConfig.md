[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UnifiedAppConfig

# Interface: UnifiedAppConfig\<TContext\>

Defined in: src/integrations/unified.ts:37

Configuration for unified Praxis application

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### db?

> `optional` **db?**: [`PraxisDB`](PraxisDB.md)

Defined in: src/integrations/unified.ts:45

PluresDB instance (if not provided, creates in-memory DB)

***

### docsConfig?

> `optional` **docsConfig?**: `object`

Defined in: src/integrations/unified.ts:57

State-Docs configuration

#### projectTitle

> **projectTitle**: `string`

#### target?

> `optional` **target?**: `string`

***

### enableDocs?

> `optional` **enableDocs?**: `boolean`

Defined in: src/integrations/unified.ts:54

Enable State-Docs documentation generation

***

### enableUnum?

> `optional` **enableUnum?**: `boolean`

Defined in: src/integrations/unified.ts:48

Enable Unum for distributed communication

***

### initialContext

> **initialContext**: `TContext`

Defined in: src/integrations/unified.ts:42

Initial context for the engine

***

### registry

> **registry**: [`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

Defined in: src/integrations/unified.ts:39

Praxis registry with rules and constraints

***

### schema?

> `optional` **schema?**: [`PraxisSchema`](PraxisSchema.md)

Defined in: src/integrations/unified.ts:63

Praxis schema for CodeCanvas integration

***

### unumIdentity?

> `optional` **unumIdentity?**: `Omit`\<[`UnumIdentity`](UnumIdentity.md), `"id"` \| `"createdAt"`\>

Defined in: src/integrations/unified.ts:51

Unum identity configuration (without id and createdAt which are auto-generated)
