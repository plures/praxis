[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TauriFS

# Interface: TauriFS

Defined in: src/integrations/tauri.ts:135

File system operations

## Methods

### exists()

> **exists**(`path`): `Promise`\<`boolean`\>

Defined in: src/integrations/tauri.ts:145

Check if path exists

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`boolean`\>

***

### mkdir()

> **mkdir**(`path`, `options?`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:147

Create directory

#### Parameters

##### path

`string`

##### options?

###### recursive?

`boolean`

#### Returns

`Promise`\<`void`\>

***

### readDir()

> **readDir**(`path`): `Promise`\<[`TauriFileEntry`](TauriFileEntry.md)[]\>

Defined in: src/integrations/tauri.ts:153

List directory contents

#### Parameters

##### path

`string`

#### Returns

`Promise`\<[`TauriFileEntry`](TauriFileEntry.md)[]\>

***

### readFile()

> **readFile**(`path`): `Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

Defined in: src/integrations/tauri.ts:137

Read a file

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`Uint8Array`\<`ArrayBufferLike`\>\>

***

### readTextFile()

> **readTextFile**(`path`): `Promise`\<`string`\>

Defined in: src/integrations/tauri.ts:139

Read a file as text

#### Parameters

##### path

`string`

#### Returns

`Promise`\<`string`\>

***

### remove()

> **remove**(`path`, `options?`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:149

Remove file or directory

#### Parameters

##### path

`string`

##### options?

###### recursive?

`boolean`

#### Returns

`Promise`\<`void`\>

***

### rename()

> **rename**(`oldPath`, `newPath`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:151

Rename/move file

#### Parameters

##### oldPath

`string`

##### newPath

`string`

#### Returns

`Promise`\<`void`\>

***

### writeFile()

> **writeFile**(`path`, `data`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:141

Write to a file

#### Parameters

##### path

`string`

##### data

`Uint8Array`

#### Returns

`Promise`\<`void`\>

***

### writeTextFile()

> **writeTextFile**(`path`, `data`): `Promise`\<`void`\>

Defined in: src/integrations/tauri.ts:143

Write text to a file

#### Parameters

##### path

`string`

##### data

`string`

#### Returns

`Promise`\<`void`\>
