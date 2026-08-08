[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TauriEvent

# Interface: TauriEvent\<T\>

Defined in: src/integrations/tauri.ts:123

IPC event from backend to frontend

## Type Parameters

### T

`T` = `unknown`

## Properties

### event

> **event**: `string`

Defined in: src/integrations/tauri.ts:125

Event name

***

### payload?

> `optional` **payload?**: `T`

Defined in: src/integrations/tauri.ts:127

Event payload

***

### windowLabel?

> `optional` **windowLabel?**: `string`

Defined in: src/integrations/tauri.ts:129

Window label that emitted the event
