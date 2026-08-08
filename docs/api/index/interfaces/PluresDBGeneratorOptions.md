[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PluresDBGeneratorOptions

# Interface: PluresDBGeneratorOptions

Defined in: src/core/pluresdb/generator.ts:12

PluresDB config generation options

## Properties

### autoIndex?

> `optional` **autoIndex?**: `"none"` \| `"all"` \| `"explicit"`

Defined in: src/core/pluresdb/generator.ts:24

Auto-index strategy: 'all' indexes all string/number/date fields, 'explicit' only indexes fields defined in schema, 'none' disables auto-indexing

***

### dbName?

> `optional` **dbName?**: `string`

Defined in: src/core/pluresdb/generator.ts:16

Database name

***

### dbVersion?

> `optional` **dbVersion?**: `number`

Defined in: src/core/pluresdb/generator.ts:18

Database version

***

### enableSync?

> `optional` **enableSync?**: `boolean`

Defined in: src/core/pluresdb/generator.ts:20

Enable sync

***

### outputDir

> **outputDir**: `string`

Defined in: src/core/pluresdb/generator.ts:14

Output directory

***

### syncEndpoint?

> `optional` **syncEndpoint?**: `string`

Defined in: src/core/pluresdb/generator.ts:22

Sync endpoint
