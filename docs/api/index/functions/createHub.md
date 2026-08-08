[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createHub

# Function: createHub()

> **createHub**(`config`): [`PraxisHub`](../interfaces/PraxisHub.md)

Defined in: src/integration/hub.ts:136

Create the Praxis integration hub.

The hub connects analysis, research, experiments, uncertainty, and Chronos
into a self-improving feedback loop.

## Parameters

### config

[`HubConfig`](../interfaces/HubConfig.md)

Hub configuration: registry, engine, fact store, and feature toggles

## Returns

[`PraxisHub`](../interfaces/PraxisHub.md)

A live [PraxisHub](../interfaces/PraxisHub.md) instance with `runCycle()`, `predict()`, `health()`, and other methods
