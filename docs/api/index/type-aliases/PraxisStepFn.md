[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisStepFn

# Type Alias: PraxisStepFn

> **PraxisStepFn** = (`state`, `events`, `config`) => [`PraxisStepResult`](../interfaces/PraxisStepResult.md)

Defined in: packages/praxis-core/src/protocol.ts:135

The core step function of the Praxis engine.

This is the conceptual heart of the engine:
- Takes current state, events, and configuration
- Applies rules and checks constraints
- Returns new state and diagnostics

Pure, deterministic, data in → data out.
No side effects, no global state.

## Parameters

### state

[`PraxisState`](../interfaces/PraxisState.md)

### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

### config

[`PraxisStepConfig`](../interfaces/PraxisStepConfig.md)

## Returns

[`PraxisStepResult`](../interfaces/PraxisStepResult.md)
