[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / findGaps

# Function: findGaps()

> **findGaps**\<`TContext`\>(`registry`, `expectations`): [`Gap`](../interfaces/Gap.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer.ts:338

Find expectations that have no covering rule or only partial coverage.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules and constraints

### expectations

`ExpectationSet`

The expectation set to check coverage against

## Returns

[`Gap`](../interfaces/Gap.md)[]

Array of [Gap](../interfaces/Gap.md) objects for expectations not fully covered by the registry
