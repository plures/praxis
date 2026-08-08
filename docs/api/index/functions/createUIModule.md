[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createUIModule

# Function: createUIModule()

> **createUIModule**\<`TContext`\>(`options`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`TContext`\>

Defined in: packages/praxis-core/src/ui-rules.ts:298

Create a customized UI module with only the rules you need.

## Type Parameters

### TContext

`TContext` *extends* [`UIContext`](../interfaces/UIContext.md)

## Parameters

### options

Selection options: which rule/constraint IDs to include, plus optional extra rules/constraints

#### constraints?

`string`[]

#### extraConstraints?

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>[]

#### extraRules?

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>[]

#### rules?

`string`[]

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`TContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with only the selected UI rules and constraints

## Example

```ts
const myUI = createUIModule({
  rules: ['ui/loading-gate', 'ui/dirty-guard'],
  constraints: ['ui/must-be-initialized'],
});
registry.registerModule(myUI);
```
