[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / findUnreachableStates

# Function: findUnreachableStates()

> **findUnreachableStates**\<`TContext`\>(`registry`): [`UnreachableState`](../interfaces/UnreachableState.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer.ts:154

Find fact combinations that no rule sequence can produce.

This checks pairs of facts where each fact can be produced individually
but no single rule or chain produces both. This is conservative —
if two facts are produced by completely independent rules that never
fire together, they form an unreachable state pair.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules

## Returns

[`UnreachableState`](../interfaces/UnreachableState.md)[]

Array of [UnreachableState](../interfaces/UnreachableState.md) objects describing fact pairs that cannot co-exist
