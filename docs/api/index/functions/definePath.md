[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / definePath

# Function: definePath()

> **definePath**\<`T`\>(`path`, `initial`, `opts?`): [`PathSchema`](../interfaces/PathSchema.md)\<`T`\>

Defined in: src/unified/types.ts:53

Define a typed graph path.
This is the primary API for declaring what data exists in your app.

## Type Parameters

### T

`T`

## Parameters

### path

`string`

The path key in the reactive graph (e.g. `'sprint/current'`)

### initial

`T`

The initial value at this path before any mutations

### opts?

`Omit`\<[`PathSchema`](../interfaces/PathSchema.md)\<`T`\>, `"path"` \| `"initial"`\>

Optional path options: `collection`, `liveness`, `description`

## Returns

[`PathSchema`](../interfaces/PathSchema.md)\<`T`\>

A [PathSchema](../interfaces/PathSchema.md) descriptor used in [PraxisAppConfig.schema](../interfaces/PraxisAppConfig.md#schema)

## Example

```ts
const Sprint = definePath<SprintInfo | null>('sprint/current', null);
const Items = definePath<WorkItem[]>('sprint/items', [], { collection: true });
const Loading = definePath<boolean>('sprint/loading', false);
```
