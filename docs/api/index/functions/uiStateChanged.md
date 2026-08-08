[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / uiStateChanged

# Function: uiStateChanged()

> **uiStateChanged**(`changes?`): [`PraxisEvent`](../interfaces/PraxisEvent.md)

Defined in: packages/praxis-core/src/ui-rules.ts:330

Create a UI state change event. Fire this when UIContext fields change.

## Parameters

### changes?

`Record`\<`string`, `unknown`\>

Optional map of changed fields (can be any UIContext subset)

## Returns

[`PraxisEvent`](../interfaces/PraxisEvent.md)

A `ui.state-change` [PraxisEvent](../interfaces/PraxisEvent.md) with the changed fields as payload
