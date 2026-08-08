[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / evaluateHook

# Function: evaluateHook()

> **evaluateHook**(`context`, `config`): `Promise`\<[`HookEvalResult`](../interfaces/HookEvalResult.md)\>

Defined in: src/hooks/evaluate.ts:127

Evaluate Praxis rules against a git hook context.

This is the core function — called by hook scripts when git fires an event.
Returns actions the hook script should take (block, allow, push, etc.).

## Parameters

### context

[`GitHookContext`](../interfaces/GitHookContext.md)

The git hook context built by [buildHookContext](buildHookContext.md)

### config

[`PraxisHooksConfig`](../interfaces/PraxisHooksConfig.md)

Praxis hooks configuration loaded from `.praxis.hooks.json`

## Returns

`Promise`\<[`HookEvalResult`](../interfaces/HookEvalResult.md)\>

A [HookEvalResult](../interfaces/HookEvalResult.md) with `proceed` flag, `actions`, and an optional summary message
