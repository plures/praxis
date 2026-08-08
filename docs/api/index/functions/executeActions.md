[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / executeActions

# Function: executeActions()

> **executeActions**(`result`): `void`

Defined in: src/hooks/evaluate.ts:234

Execute the actions returned by evaluateHook.
Called by the hook handler after evaluation.

## Parameters

### result

[`HookEvalResult`](../interfaces/HookEvalResult.md)

The hook evaluation result from [evaluateHook](evaluateHook.md)

## Returns

`void`

void — side effects (push, etc.) are executed synchronously
