[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / HookAction

# Type Alias: HookAction

> **HookAction** = \{ `reason`: `string`; `type`: `"block"`; \} \| \{ `type`: `"allow"`; \} \| \{ `branch?`: `string`; `remote?`: `string`; `type`: `"push"`; \} \| \{ `message`: `string`; `type`: `"log"`; \} \| \{ `message`: `string`; `type`: `"rewrite-commit-msg"`; \}

Defined in: src/hooks/types.ts:66

An action the hooks integration should perform in response to rule evaluation.
