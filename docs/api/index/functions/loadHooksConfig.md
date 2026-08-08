[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / loadHooksConfig

# Function: loadHooksConfig()

> **loadHooksConfig**(`repoRoot?`): [`PraxisHooksConfig`](../interfaces/PraxisHooksConfig.md)

Defined in: src/hooks/install.ts:227

Load config from .praxis.hooks.json (or return defaults).

## Parameters

### repoRoot?

`string`

Optional path to the repository root (defaults to `git rev-parse --show-toplevel`)

## Returns

[`PraxisHooksConfig`](../interfaces/PraxisHooksConfig.md)

The loaded [PraxisHooksConfig](../interfaces/PraxisHooksConfig.md), or the default config if no file exists
