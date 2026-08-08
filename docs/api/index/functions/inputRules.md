[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / inputRules

# Function: inputRules()

> **inputRules**(`config?`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`InputContext`\>

Defined in: src/factory/factory.ts:57

Create input validation rules module.

Generates rules for sanitizing user input, enforcing length limits,
and requiring non-empty values.

## Parameters

### config?

[`InputRulesConfig`](../interfaces/InputRulesConfig.md) = `{}`

Optional input rules configuration: sanitization types, max length, required flag

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`InputContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with input validation rules and constraints
