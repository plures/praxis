[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PathSchema

# Interface: PathSchema\<T\>

Defined in: src/unified/types.ts:28

Schema definition for a graph path

## Type Parameters

### T

`T` = `unknown`

## Properties

### collection?

> `optional` **collection?**: `boolean`

Defined in: src/unified/types.ts:36

Whether this path is a collection (maps over children)

***

### initial

> **initial**: `T`

Defined in: src/unified/types.ts:32

Default/initial value

***

### path

> **path**: `string`

Defined in: src/unified/types.ts:30

The graph path (e.g., 'sprint/current')

***

### staleTtl?

> `optional` **staleTtl?**: `number`

Defined in: src/unified/types.ts:34

Optional TTL for staleness detection (ms)
