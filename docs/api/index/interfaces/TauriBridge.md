[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TauriBridge

# Interface: TauriBridge

Defined in: src/integrations/tauri.ts:239

Tauri bridge for Praxis integration

Provides type-safe access to Tauri APIs from Praxis applications.

## Properties

### app

> **app**: `object`

Defined in: src/integrations/tauri.ts:241

Application info

#### name

> **name**: `string`

#### tauriVersion

> **tauriVersion**: `string`

#### version

> **version**: `string`

***

### fs

> **fs**: [`TauriFS`](TauriFS.md)

Defined in: src/integrations/tauri.ts:248

File system operations

***

### notification

> **notification**: [`TauriNotification`](TauriNotification.md)

Defined in: src/integrations/tauri.ts:254

Notification operations

***

### tray

> **tray**: [`TauriTray`](TauriTray.md)

Defined in: src/integrations/tauri.ts:251

System tray operations

***

### window

> **window**: `object`

Defined in: src/integrations/tauri.ts:266

Get window operations

#### close()

> **close**(): `Promise`\<`void`\>

Close window

##### Returns

`Promise`\<`void`\>

#### focus()

> **focus**(): `Promise`\<`void`\>

Focus window

##### Returns

`Promise`\<`void`\>

#### hide()

> **hide**(): `Promise`\<`void`\>

Hide window

##### Returns

`Promise`\<`void`\>

#### maximize()

> **maximize**(): `Promise`\<`void`\>

Maximize window

##### Returns

`Promise`\<`void`\>

#### minimize()

> **minimize**(): `Promise`\<`void`\>

Minimize window

##### Returns

`Promise`\<`void`\>

#### setTitle()

> **setTitle**(`title`): `Promise`\<`void`\>

Set window title

##### Parameters

###### title

`string`

##### Returns

`Promise`\<`void`\>

#### show()

> **show**(): `Promise`\<`void`\>

Show window

##### Returns

`Promise`\<`void`\>

#### toggleFullscreen()

> **toggleFullscreen**(): `Promise`\<`void`\>

Toggle fullscreen

##### Returns

`Promise`\<`void`\>

#### unmaximize()

> **unmaximize**(): `Promise`\<`void`\>

Unmaximize window

##### Returns

`Promise`\<`void`\>

## Methods

### checkForUpdates()

> **checkForUpdates**(): `Promise`\<[`TauriUpdateInfo`](TauriUpdateInfo.md) \| `null`\>

Defined in: src/integrations/tauri.ts:288

Check for updates

#### Returns

`Promise`\<[`TauriUpdateInfo`](TauriUpdateInfo.md) \| `null`\>

***

### emit()

> **emit**(`event`, `payload?`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:263

Emit a Tauri event

#### Parameters

##### event

`string`

##### payload?

`unknown`

#### Returns

`Promise`\<`void`\>

***

### installUpdate()

> **installUpdate**(): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:291

Install update

#### Returns

`Promise`\<`void`\>

***

### invoke()

> **invoke**\<`T`\>(`cmd`, `payload?`): `Promise`\<`T`\>

Defined in: src/integrations/tauri.ts:257

Invoke a Tauri command

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### cmd

`string`

##### payload?

`unknown`

#### Returns

`Promise`\<`T`\>

***

### listen()

> **listen**\<`T`\>(`event`, `handler`): `Promise`\<() => `void`\>

Defined in: src/integrations/tauri.ts:260

Listen to a Tauri event

#### Type Parameters

##### T

`T` = `unknown`

#### Parameters

##### event

`string`

##### handler

(`event`) => `void`

#### Returns

`Promise`\<() => `void`\>
