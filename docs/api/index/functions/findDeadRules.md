[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / findDeadRules

# Function: findDeadRules()

> **findDeadRules**\<`TContext`\>(`registry`, `knownEventTypes`): [`DeadRule`](../interfaces/DeadRule.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer.ts:116

Find rules that can never fire given known event types.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules

### knownEventTypes

`string`[]

The complete set of event type tags the application can emit

## Returns

[`DeadRule`](../interfaces/DeadRule.md)[]

Array of [DeadRule](../interfaces/DeadRule.md) objects for rules whose required event types are not in the known set
