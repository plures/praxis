[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / formRules

# Function: formRules()

> **formRules**(`config?`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`FormContext`\>

Defined in: src/factory/factory.ts:289

Create form lifecycle rules.

Generates rules for field validation on blur, submit gating,
and form state management.

## Parameters

### config?

[`FormRulesConfig`](../interfaces/FormRulesConfig.md) = `{}`

Optional form rules configuration: validateOnBlur, submitGate, formName

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`FormContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with form lifecycle rules and constraints
