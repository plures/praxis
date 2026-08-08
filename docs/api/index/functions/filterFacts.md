[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / filterFacts

# Function: filterFacts()

> **filterFacts**\<`TTag`, `TPayload`\>(`facts`, `definition`): [`PraxisFact`](../interfaces/PraxisFact.md) & `object`[]

Defined in: src/dsl/index.ts:233

Helper to filter facts by definition

## Type Parameters

### TTag

`TTag` *extends* `string`

### TPayload

`TPayload`

## Parameters

### facts

[`PraxisFact`](../interfaces/PraxisFact.md)[]

Array of facts to filter

### definition

[`FactDefinition`](../interfaces/FactDefinition.md)\<`TTag`, `TPayload`\>

Typed fact definition created by [defineFact](defineFact.md)

## Returns

[`PraxisFact`](../interfaces/PraxisFact.md) & `object`[]

All facts in the array that match the given type definition
