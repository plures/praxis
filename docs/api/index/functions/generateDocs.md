[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / generateDocs

# Function: generateDocs()

> **generateDocs**(`schema`, `config`): [`GeneratedDoc`](../interfaces/GeneratedDoc.md)[]

Defined in: src/integrations/state-docs.ts:714

Generate documentation from a schema (convenience function)

## Parameters

### schema

[`PraxisSchema`](../interfaces/PraxisSchema.md)

The Praxis schema to generate documentation for

### config

[`StateDocsConfig`](../interfaces/StateDocsConfig.md)

Generator configuration including project title and output directory

## Returns

[`GeneratedDoc`](../interfaces/GeneratedDoc.md)[]

An array of [GeneratedDoc](../interfaces/GeneratedDoc.md) objects ready to be written to disk
