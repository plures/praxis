[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / formatGate

# Function: formatGate()

> **formatGate**(`config?`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`GateContext`\>

Defined in: src/project/project.ts:423

Create a format gate — blocks workflow until formatting is correct.

## Parameters

### config?

[`PredefinedGateConfig`](../interfaces/PredefinedGateConfig.md) = `{}`

Optional configuration for additional expected facts and gate overrides

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`GateContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with a `gate/format` rule that enforces formatting
