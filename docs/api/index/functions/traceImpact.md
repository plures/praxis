[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / traceImpact

# Function: traceImpact()

> **traceImpact**\<`TContext`\>(`factTag`, `registry`): [`ImpactReport`](../interfaces/ImpactReport.md)

Defined in: packages/praxis-core/src/decision-ledger/derivation.ts:121

Trace the impact of removing a fact from the system.

Returns which rules would stop firing and which downstream facts
would disappear if the given fact were removed.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### factTag

`string`

The fact type tag whose removal to simulate

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules

## Returns

[`ImpactReport`](../interfaces/ImpactReport.md)

An [ImpactReport](../interfaces/ImpactReport.md) listing affected rules and downstream facts
