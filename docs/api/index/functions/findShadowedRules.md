[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / findShadowedRules

# Function: findShadowedRules()

> **findShadowedRules**\<`TContext`\>(`registry`): [`ShadowedRule`](../interfaces/ShadowedRule.md)[]

Defined in: packages/praxis-core/src/decision-ledger/analyzer.ts:230

Find rules where another rule with same event types always produces
a superset of the facts.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

The Praxis registry containing all rules

## Returns

[`ShadowedRule`](../interfaces/ShadowedRule.md)[]

Array of [ShadowedRule](../interfaces/ShadowedRule.md) objects describing rules made redundant by others
