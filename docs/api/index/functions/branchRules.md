[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / branchRules

# Function: branchRules()

> **branchRules**(`config`): [`PraxisModule`](../interfaces/PraxisModule.md)

Defined in: src/project/project.ts:340

Create branch management rules.

## Parameters

### config

[`BranchRulesConfig`](../interfaces/BranchRulesConfig.md)

Branch rules configuration: naming pattern and merge conditions

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)

A [PraxisModule](../interfaces/PraxisModule.md) with rules enforcing branch naming and merge preconditions

## Example

```ts
const branches = branchRules({
  naming: 'feat/{name}',
  mergeConditions: ['tests-pass', 'review-approved'],
});
```
