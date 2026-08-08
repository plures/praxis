[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineExpectation

# Function: defineExpectation()

> **defineExpectation**(`exp`): [`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)

Defined in: src/lifecycle/expectation.ts:149

Shorthand — create expectation from a plain object.

## Parameters

### exp

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)

The expectation object with required fields: `id`, `type`, `title`, `description`

## Returns

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)

A validated and normalized [LifecycleExpectation](../interfaces/LifecycleExpectation.md)

## Example

```ts
const fix = defineExpectation({
  id: 'fix-login-redirect',
  type: 'fix',
  title: 'Fix login redirect loop',
  description: 'Users get stuck in redirect loop after OAuth callback',
  priority: 'critical',
  acceptance: ['Login completes without redirect loop'],
});
```
