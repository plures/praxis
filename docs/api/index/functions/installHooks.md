[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / installHooks

# Function: installHooks()

> **installHooks**(`config?`, `options?`): `object`

Defined in: src/hooks/install.ts:89

Install Praxis hook scripts into .git/hooks/.

If existing hooks are found, they're renamed to <hook>.pre-praxis
and the Praxis hook chains to them.

## Parameters

### config?

`Partial`\<[`PraxisHooksConfig`](../interfaces/PraxisHooksConfig.md)\> = `{}`

Partial Praxis hooks configuration (merged with defaults)

### options?

Installation options: `repoRoot`, `force` (overwrite), `verbose`

#### force?

`boolean`

#### repoRoot?

`string`

#### verbose?

`boolean`

## Returns

`object`

Lists of `installed`, `skipped`, and `chained` hook names

### chained

> **chained**: [`GitHookName`](../type-aliases/GitHookName.md)[]

### installed

> **installed**: [`GitHookName`](../type-aliases/GitHookName.md)[]

### skipped

> **skipped**: [`GitHookName`](../type-aliases/GitHookName.md)[]
