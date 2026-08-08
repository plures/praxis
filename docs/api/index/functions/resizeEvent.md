[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / resizeEvent

# Function: resizeEvent()

> **resizeEvent**(`width`, `height`): [`PraxisEvent`](../interfaces/PraxisEvent.md)

Defined in: packages/praxis-core/src/ui-rules.ts:351

Create a resize event. Used with viewport rule.

## Parameters

### width

`number`

New viewport width in pixels

### height

`number`

New viewport height in pixels

## Returns

[`PraxisEvent`](../interfaces/PraxisEvent.md)

A `ui.resize` [PraxisEvent](../interfaces/PraxisEvent.md) with `{ width, height }` as payload
