[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / findContradictions

# Function: findContradictions()

> **findContradictions**\<`TContext`\>(`registry`): [`Contradiction`](../interfaces/Contradiction.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer.ts:281

Find rules that produce facts with the same tag but potentially conflicting
payloads under the same event conditions.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules

## Returns

[`Contradiction`](../interfaces/Contradiction.md)[]

Array of [Contradiction](../interfaces/Contradiction.md) objects describing rule pairs that could conflict
