[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineUnifiedModule

# Function: defineUnifiedModule()

> **defineUnifiedModule**(`name`, `rules`): `object`

Defined in: src/unified/rules.ts:74

Compose multiple rules into a named module.

## Parameters

### name

`string`

Human-readable module name (used for logging and introspection)

### rules

[`UnifiedRule`](../interfaces/UnifiedRule.md)[]

Rules to group together in this module

## Returns

`object`

A module descriptor object with `name` and `rules`

### name

> **name**: `string`

### rules

> **rules**: [`UnifiedRule`](../interfaces/UnifiedRule.md)[]

## Example

```ts
const sprintModule = defineModule('sprint-health', [
  sprintBehindRule,
  capacityRule,
  endNearRule,
]);
```
