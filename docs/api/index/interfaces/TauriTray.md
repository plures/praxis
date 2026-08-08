[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TauriTray

# Interface: TauriTray

Defined in: src/integrations/tauri.ts:177

System tray operations

## Methods

### hide()

> **hide**(): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:187

Hide tray

#### Returns

`Promise`\<`void`\>

***

### setIcon()

> **setIcon**(`icon`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:179

Set tray icon

#### Parameters

##### icon

`string` \| `Uint8Array`\<`ArrayBufferLike`\>

#### Returns

`Promise`\<`void`\>

***

### setMenu()

> **setMenu**(`menu`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:183

Set tray menu

#### Parameters

##### menu

[`TauriMenuItem`](TauriMenuItem.md)[]

#### Returns

`Promise`\<`void`\>

***

### setTooltip()

> **setTooltip**(`tooltip`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:181

Set tray tooltip

#### Parameters

##### tooltip

`string`

#### Returns

`Promise`\<`void`\>

***

### show()

> **show**(): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:185

Show tray

#### Returns

`Promise`\<`void`\>
