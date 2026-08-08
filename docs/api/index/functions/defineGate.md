[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineGate

# Function: defineGate()

> **defineGate**(`name`, `config`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`GateContext`\>

Defined in: src/project/project.ts:64

Define a feature gate — a condition that must be satisfied before
proceeding with a workflow step (deploy, merge, release, etc.).

## Parameters

### name

`string`

Gate name (used as part of the rule ID `gate/<name>`)

### config

[`GateConfig`](../interfaces/GateConfig.md)

Gate configuration: expected fact IDs, and satisfied/violation event names

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`GateContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) containing the gate rule and constraint

## Example

```ts
const testGate = defineGate('test', {
  expects: ['all-tests-pass', 'no-type-errors'],
  onSatisfied: 'deploy-allowed',
  onViolation: 'deploy-blocked',
});
registry.registerModule(testGate);
```
