[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TauriPraxisAdapter

# Interface: TauriPraxisAdapter\<TContext\>

Defined in: src/integrations/tauri.ts:311

Praxis-Tauri adapter for engine persistence

## Type Parameters

### TContext

`TContext` = `unknown`

## Methods

### getEventsPath()

> **getEventsPath**(): `string`

Defined in: src/integrations/tauri.ts:331

Get events file path

#### Returns

`string`

***

### getStatePath()

> **getStatePath**(): `string`

Defined in: src/integrations/tauri.ts:328

Get state file path

#### Returns

`string`

***

### loadEvents()

> **loadEvents**(): `Promise`\<[`PraxisEvent`](PraxisEvent.md)[]\>

Defined in: src/integrations/tauri.ts:322

Load events from file

#### Returns

`Promise`\<[`PraxisEvent`](PraxisEvent.md)[]\>

***

### loadState()

> **loadState**(): `Promise`\<`TContext` \| `null`\>

Defined in: src/integrations/tauri.ts:316

Load engine state from file

#### Returns

`Promise`\<`TContext` \| `null`\>

***

### saveEvents()

> **saveEvents**(`events`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:319

Save events to file

#### Parameters

##### events

[`PraxisEvent`](PraxisEvent.md)[]

#### Returns

`Promise`\<`void`\>

***

### saveState()

> **saveState**(`state`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:313

Save engine state to file

#### Parameters

##### state

`TContext`

#### Returns

`Promise`\<`void`\>

***

### watchStateFile()

> **watchStateFile**(`handler`): `Promise`\<() => `void`\>

Defined in: src/integrations/tauri.ts:325

Watch for file changes

#### Parameters

##### handler

(`state`) => `void`

#### Returns

`Promise`\<() => `void`\>
