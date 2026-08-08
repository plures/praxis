[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / navigationRules

# Function: navigationRules()

> **navigationRules**(`config?`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`NavigationContext`\>

Defined in: src/factory/factory.ts:412

Create route protection rules.

Generates rules for dirty-data navigation guards and
authentication-required route protection.

## Parameters

### config?

[`NavigationRulesConfig`](../interfaces/NavigationRulesConfig.md) = `{}`

Optional navigation rules configuration: dirtyGuard, authRequired

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`NavigationContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with navigation guard rules and constraints
