[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UnumAdapterConfig

# Interface: UnumAdapterConfig

Defined in: src/integrations/unum.ts:87

Unum adapter configuration

## Properties

### db

> **db**: [`PraxisDB`](PraxisDB.md)

Defined in: src/integrations/unum.ts:89

PluresDB instance to use

***

### identity?

> `optional` **identity?**: [`UnumIdentity`](UnumIdentity.md)

Defined in: src/integrations/unum.ts:91

Current user identity

***

### realtime?

> `optional` **realtime?**: `boolean`

Defined in: src/integrations/unum.ts:93

Whether to enable real-time sync

***

### syncInterval?

> `optional` **syncInterval?**: `number`

Defined in: src/integrations/unum.ts:95

Sync interval in milliseconds
