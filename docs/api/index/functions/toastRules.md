[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / toastRules

# Function: toastRules()

> **toastRules**(`config?`): [`PraxisModule`](../interfaces/PraxisModule.md)\<`ToastContext`\>

Defined in: src/factory/factory.ts:186

Create truthful toast notification rules.

Generates rules that ensure toasts only appear with meaningful content,
auto-dismiss after a timeout, and avoid duplicates.

## Parameters

### config?

[`ToastRulesConfig`](../interfaces/ToastRulesConfig.md) = `{}`

Optional toast rules configuration: requireDiff, autoDismissMs, deduplicate

## Returns

[`PraxisModule`](../interfaces/PraxisModule.md)\<`ToastContext`\>

A [PraxisModule](../interfaces/PraxisModule.md) with toast notification rules
