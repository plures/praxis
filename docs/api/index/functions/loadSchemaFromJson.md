[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / loadSchemaFromJson

# Function: loadSchemaFromJson()

> **loadSchemaFromJson**(`json`, `options?`): [`LoaderResult`](../interfaces/LoaderResult.md)

Defined in: src/core/schema/loader.common.ts:57

Load schema from JSON string

## Parameters

### json

`string`

The JSON string to parse as a [PraxisSchema](../interfaces/PraxisSchema.md)

### options?

[`LoaderOptions`](../interfaces/LoaderOptions.md) = `{}`

Optional loader options (validation, normalization)

## Returns

[`LoaderResult`](../interfaces/LoaderResult.md)

A [LoaderResult](../interfaces/LoaderResult.md) with the parsed schema, validation result, and any errors
