[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / filterEvents

# Function: filterEvents()

> **filterEvents**\<`TTag`, `TPayload`\>(`events`, `definition`): [`PraxisEvent`](../interfaces/PraxisEvent.md) & `object`[]

Defined in: src/dsl/index.ts:219

Helper to filter events by definition

## Type Parameters

### TTag

`TTag` *extends* `string`

### TPayload

`TPayload`

## Parameters

### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

Array of events to filter

### definition

[`EventDefinition`](../interfaces/EventDefinition.md)\<`TTag`, `TPayload`\>

Typed event definition created by [defineEvent](defineEvent.md)

## Returns

[`PraxisEvent`](../interfaces/PraxisEvent.md) & `object`[]

All events in the array that match the given type definition
