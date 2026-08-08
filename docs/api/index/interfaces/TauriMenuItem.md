[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TauriMenuItem

# Interface: TauriMenuItem

Defined in: src/integrations/tauri.ts:193

Tray menu item

## Properties

### checked?

> `optional` **checked?**: `boolean`

Defined in: src/integrations/tauri.ts:201

Is item checked (for checkboxes)

***

### enabled?

> `optional` **enabled?**: `boolean`

Defined in: src/integrations/tauri.ts:199

Is item enabled

***

### id

> **id**: `string`

Defined in: src/integrations/tauri.ts:195

Item ID

***

### label

> **label**: `string`

Defined in: src/integrations/tauri.ts:197

Item label

***

### onClick?

> `optional` **onClick?**: () => `void`

Defined in: src/integrations/tauri.ts:205

Click handler

#### Returns

`void`

***

### submenu?

> `optional` **submenu?**: `TauriMenuItem`[]

Defined in: src/integrations/tauri.ts:203

Submenu items
