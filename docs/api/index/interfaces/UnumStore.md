[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UnumStore

# Interface: UnumStore\<T\>

Defined in: src/integrations/unum.ts:24

Unum store interface for reactive PluresDB data

## Type Parameters

### T

`T`

## Methods

### set()

> **set**(`value`): `void`

Defined in: src/integrations/unum.ts:26

#### Parameters

##### value

`T`

#### Returns

`void`

***

### subscribe()

> **subscribe**(`run`): () => `void`

Defined in: src/integrations/unum.ts:25

#### Parameters

##### run

(`value`) => `void`

#### Returns

() => `void`

***

### update()

> **update**(`updater`): `void`

Defined in: src/integrations/unum.ts:27

#### Parameters

##### updater

(`value`) => `T`

#### Returns

`void`
