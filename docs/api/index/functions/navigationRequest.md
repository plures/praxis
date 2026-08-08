[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / navigationRequest

# Function: navigationRequest()

> **navigationRequest**(`to`): [`PraxisEvent`](../interfaces/PraxisEvent.md)

Defined in: packages/praxis-core/src/ui-rules.ts:340

Create a navigation request event. Used with dirty guard.

## Parameters

### to

`string`

The destination route or URL the user wants to navigate to

## Returns

[`PraxisEvent`](../interfaces/PraxisEvent.md)

A `navigation.request` [PraxisEvent](../interfaces/PraxisEvent.md) with `to` as payload
