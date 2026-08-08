[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineModule

# Function: defineModule()

> **defineModule**\<`TContext`\>(`options`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`TContext`\>

Defined in: src/dsl/index.ts:202

Define a module (bundle of rules and constraints)

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### options

[`DefineModuleOptions`](../interfaces/DefineModuleOptions.md)\<`TContext`\>

Module options: optional `rules`, `constraints`, and `meta`

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`TContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with the given rules and constraints

## Example

```ts
const authModule = defineModule({
  rules: [loginRule, logoutRule],
  constraints: [maxSessionsConstraint],
  meta: { version: "1.0.0" }
});
```
