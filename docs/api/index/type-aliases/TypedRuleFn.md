[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TypedRuleFn

# Type Alias: TypedRuleFn\<TContext\>

> **TypedRuleFn**\<`TContext`\> = (`state`, `events`) => [`RuleResult`](../classes/RuleResult.md)

Defined in: packages/praxis-core/src/rule-result.ts:120

A rule function that returns a typed RuleResult.
New API — replaces the old PraxisFact[] return type.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### state

[`PraxisState`](../interfaces/PraxisState.md) & `object`

### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

## Returns

[`RuleResult`](../classes/RuleResult.md)
