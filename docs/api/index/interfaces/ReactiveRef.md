[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ReactiveRef

# Interface: ReactiveRef\<T\>

Defined in: src/unified/types.ts:81

A reactive reference returned by query().
Has a Svelte-compatible subscribe() and a .current getter.

## Extends

- `Subscribable`\<`T`\>

## Type Parameters

### T

`T`

## Properties

### current

> `readonly` **current**: `T`

Defined in: src/unified/types.ts:83

Current value (synchronous read)

## Methods

### subscribe()

> **subscribe**(`cb`): () => `void`

Defined in: src/unified/types.ts:85

Svelte store contract — subscribe returns unsubscribe fn

#### Parameters

##### cb

(`value`) => `void`

#### Returns

() => `void`

#### Overrides

`Subscribable.subscribe`
