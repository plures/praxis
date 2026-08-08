[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineRule

# Function: defineRule()

> **defineRule**\<`TContext`\>(`options`): [`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>

Defined in: src/dsl/index.ts:122

Define a rule

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### options

[`DefineRuleOptions`](../interfaces/DefineRuleOptions.md)\<`TContext`\>

Rule definition options: `id`, `description`, `impl`, optional `eventTypes`, `contract`, and `meta`

## Returns

[`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`TContext`\>

A fully constructed [RuleDescriptor](../interfaces/RuleDescriptor.md)

## Example

```ts
const loginRule = defineRule({
  id: "auth.login",
  description: "Process login event",
  impl: (state, events) => {
    const loginEvent = events.find(Login.is);
    if (loginEvent) {
      return [UserLoggedIn.create({ userId: loginEvent.payload.username })];
    }
    return [];
  }
});
```
