[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / lintGate

# Function: lintGate()

> **lintGate**(`config?`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`GateContext`\>

Defined in: src/project/project.ts:408

Create a lint gate — blocks workflow until linting passes.

## Parameters

### config?

[`PredefinedGateConfig`](../interfaces/PredefinedGateConfig.md) = `{}`

Optional configuration for additional expected facts and gate overrides

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`GateContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with a `gate/lint` rule that enforces lint passing
