[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / RuleFn

# Type Alias: RuleFn\<TContext\>

> **RuleFn**\<`TContext`\> = (`state`, `events`) => [`RuleResult`](../classes/RuleResult.md) \| [`PraxisFact`](../interfaces/PraxisFact.md)[]

Defined in: packages/praxis-core/src/rules.ts:45

A rule function derives new facts or transitions from context + input facts/events.
Rules must be pure - no side effects.

Returns either:
- `RuleResult` (new API — typed, traceable, supports retraction)
- `PraxisFact[]` (legacy — backward compatible, will be deprecated)

The state parameter includes `events` — the current batch being processed.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### state

[`PraxisState`](../interfaces/PraxisState.md) & `object`

Current Praxis state (includes state.events for current batch)

### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

Events to process (same as state.events, provided for convenience)

## Returns

[`RuleResult`](../classes/RuleResult.md) \| [`PraxisFact`](../interfaces/PraxisFact.md)[]

RuleResult or array of new facts
