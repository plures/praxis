[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TauriNotification

# Interface: TauriNotification

Defined in: src/integrations/tauri.ts:211

Notification API

## Methods

### checkPermission()

> **checkPermission**(): `Promise`\<`"default"` \| `"granted"` \| `"denied"`\>

Defined in: src/integrations/tauri.ts:217

Check notification permission

#### Returns

`Promise`\<`"default"` \| `"granted"` \| `"denied"`\>

***

### requestPermission()

> **requestPermission**(): `Promise`\<`"default"` \| `"granted"` \| `"denied"`\>

Defined in: src/integrations/tauri.ts:215

Request notification permission

#### Returns

`Promise`\<`"default"` \| `"granted"` \| `"denied"`\>

***

### send()

> **send**(`options`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:213

Send a notification

#### Parameters

##### options

[`TauriNotificationOptions`](TauriNotificationOptions.md)

#### Returns

`Promise`\<`void`\>
