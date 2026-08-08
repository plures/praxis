[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / findEvent

# Function: findEvent()

> **findEvent**\<`TTag`, `TPayload`\>(`events`, `definition`): [`PraxisEvent`](../interfaces/PraxisEvent.md) & `object` \| `undefined`

Defined in: src/dsl/index.ts:247

Helper to find first event matching definition

## Type Parameters

### TTag

`TTag` *extends* `string`

### TPayload

`TPayload`

## Parameters

### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

Array of events to search

### definition

[`EventDefinition`](../interfaces/EventDefinition.md)\<`TTag`, `TPayload`\>

Typed event definition created by [defineEvent](defineEvent.md)

## Returns

[`PraxisEvent`](../interfaces/PraxisEvent.md) & `object` \| `undefined`

The first matching event, or `undefined` if none found
