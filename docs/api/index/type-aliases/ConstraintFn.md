[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ConstraintFn

# Type Alias: ConstraintFn\<TContext\>

> **ConstraintFn**\<`TContext`\> = (`state`) => `boolean` \| `string`

Defined in: packages/praxis-core/src/rules.ts:57

A constraint function checks that an invariant holds.
Constraints must be pure - no side effects.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### state

[`PraxisState`](../interfaces/PraxisState.md) & `object`

Current Praxis state

## Returns

`boolean` \| `string`

true if constraint is satisfied, false or error message if violated
