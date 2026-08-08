[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / initHooksConfig

# Function: initHooksConfig()

> **initHooksConfig**(`repoRoot?`): `string`

Defined in: src/hooks/install.ts:197

Write a default .praxis.hooks.json config file.

If the file already exists it is left unchanged.

## Parameters

### repoRoot?

`string`

Optional path to the repository root (defaults to `git rev-parse --show-toplevel`)

## Returns

`string`

The absolute path to the config file (created or already-existing)
