[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineConstraint

# Function: defineConstraint()

> **defineConstraint**\<`TContext`\>(`options`): [`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>

Defined in: src/dsl/index.ts:165

Define a constraint

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### options

[`DefineConstraintOptions`](../interfaces/DefineConstraintOptions.md)\<`TContext`\>

Constraint definition options: `id`, `description`, `impl`, optional `contract` and `meta`

## Returns

[`ConstraintDescriptor`](../interfaces/ConstraintDescriptor.md)\<`TContext`\>

A fully constructed [ConstraintDescriptor](../interfaces/ConstraintDescriptor.md)

## Example

```ts
const maxCartItems = defineConstraint({
  id: "cart.maxItems",
  description: "Cart cannot exceed 100 items",
  impl: (state) => {
    const itemCount = state.context.items?.length ?? 0;
    return itemCount <= 100 || `Cart has ${itemCount} items, maximum is 100`;
  }
});
```
