[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / dataRules

# Function: dataRules()

> **dataRules**(`config?`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`DataContext`\>

Defined in: src/factory/factory.ts:510

Create data lifecycle rules.

Generates rules for optimistic updates, error rollback, and cache invalidation.

## Parameters

### config?

[`DataRulesConfig`](../interfaces/DataRulesConfig.md) = `{}`

Optional data rules configuration: optimisticUpdate, rollbackOnError, cacheInvalidation

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`DataContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with data lifecycle rules
