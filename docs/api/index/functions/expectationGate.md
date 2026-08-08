[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / expectationGate

# Function: expectationGate()

> **expectationGate**(`config?`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`GateContext`\>

Defined in: src/project/project.ts:438

Create an expectation gate — blocks workflow until expectations are verified.

## Parameters

### config?

[`PredefinedGateConfig`](../interfaces/PredefinedGateConfig.md) = `{}`

Optional configuration for additional expected facts and gate overrides

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`GateContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with a `gate/expectations` rule that enforces expectation verification
