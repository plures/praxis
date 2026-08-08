[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / generateTauriConfig

# Function: generateTauriConfig()

> **generateTauriConfig**(`config`): `Record`\<`string`, `unknown`\>

Defined in: src/integrations/tauri.ts:611

Generate Tauri configuration from Praxis app config

## Parameters

### config

[`TauriAppConfig`](../interfaces/TauriAppConfig.md)

Tauri application configuration including name, version, identifier, and window settings

## Returns

`Record`\<`string`, `unknown`\>

A Tauri v2 configuration object ready to be written to `tauri.conf.json`
