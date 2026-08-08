[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / uninstallHooks

# Function: uninstallHooks()

> **uninstallHooks**(`config?`, `options?`): `object`

Defined in: src/hooks/install.ts:152

Uninstall Praxis hooks — removes the scripts and restores backups.

## Parameters

### config?

`Partial`\<[`PraxisHooksConfig`](../interfaces/PraxisHooksConfig.md)\> = `{}`

Partial Praxis hooks configuration (merged with defaults)

### options?

Uninstall options: `repoRoot`, `verbose`

#### repoRoot?

`string`

#### verbose?

`boolean`

## Returns

`object`

Lists of `removed` and `restored` hook names

### removed

> **removed**: [`GitHookName`](../type-aliases/GitHookName.md)[]

### restored

> **restored**: [`GitHookName`](../type-aliases/GitHookName.md)[]
