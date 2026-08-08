[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / normalizeSchema

# Function: normalizeSchema()

> **normalizeSchema**(`schema`, `options?`): [`NormalizedSchema`](../interfaces/NormalizedSchema.md)

Defined in: src/core/schema/normalize.ts:77

Normalize a Praxis schema for code generation

## Parameters

### schema

[`PraxisSchema`](../interfaces/PraxisSchema.md)

The raw Praxis schema to normalize

### options?

[`NormalizationOptions`](../interfaces/NormalizationOptions.md) = `{}`

Optional normalization options: prefix, expand references, include metadata

## Returns

[`NormalizedSchema`](../interfaces/NormalizedSchema.md)

A [NormalizedSchema](../interfaces/NormalizedSchema.md) with fully resolved models, fields, and relationships
