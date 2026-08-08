[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / expandFieldType

# Function: expandFieldType()

> **expandFieldType**(`fieldType`, `schemaPrefix?`): `string`

Defined in: src/core/schema/normalize.ts:201

Expand field type to fully qualified type string

## Parameters

### fieldType

`FieldType`

The field type to expand (string, array, object, or reference)

### schemaPrefix?

`string` = `''`

Optional prefix to qualify reference types (e.g. schema name)

## Returns

`string`

A fully qualified type string (e.g. `'string'`, `'User[]'`, `'MySchema.Address'`)
