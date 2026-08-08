[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / QueryOptions

# Interface: QueryOptions\<T\>

Defined in: src/unified/types.ts:64

Options for filtering, mapping, and sorting query results.

## Type Parameters

### T

`T`

## Properties

### limit?

> `optional` **limit?**: `number`

Defined in: src/unified/types.ts:72

Limit results

***

### select?

> `optional` **select?**: (`item`) => `unknown`

Defined in: src/unified/types.ts:68

Select/map function

#### Parameters

##### item

`T`

#### Returns

`unknown`

***

### sort?

> `optional` **sort?**: (`a`, `b`) => `number`

Defined in: src/unified/types.ts:70

Sort comparator

#### Parameters

##### a

`unknown`

##### b

`unknown`

#### Returns

`number`

***

### where?

> `optional` **where?**: (`item`) => `boolean`

Defined in: src/unified/types.ts:66

Filter function for collections

#### Parameters

##### item

`T` *extends* `U`[] ? `U` : `T`

#### Returns

`boolean`
