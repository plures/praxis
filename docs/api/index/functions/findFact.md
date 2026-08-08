[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / findFact

# Function: findFact()

> **findFact**\<`TTag`, `TPayload`\>(`facts`, `definition`): [`PraxisFact`](../interfaces/PraxisFact.md) & `object` \| `undefined`

Defined in: src/dsl/index.ts:261

Helper to find first fact matching definition

## Type Parameters

### TTag

`TTag` *extends* `string`

### TPayload

`TPayload`

## Parameters

### facts

[`PraxisFact`](../interfaces/PraxisFact.md)[]

Array of facts to search

### definition

[`FactDefinition`](../interfaces/FactDefinition.md)\<`TTag`, `TPayload`\>

Typed fact definition created by [defineFact](defineFact.md)

## Returns

[`PraxisFact`](../interfaces/PraxisFact.md) & `object` \| `undefined`

The first matching fact, or `undefined` if none found
