[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DocsUpdatePlan

# Interface: DocsUpdatePlan

Defined in: src/lifecycle/docs.ts:128

Documentation update plan

## Properties

### create

> **create**: `object`[]

Defined in: src/lifecycle/docs.ts:130

Documents to create

#### path

> **path**: `string`

#### reason

> **reason**: `string`

#### sections

> **sections**: `string`[]

#### template?

> `optional` **template?**: `string`

#### type

> **type**: [`DocumentType`](../type-aliases/DocumentType.md)

***

### remove

> **remove**: `object`[]

Defined in: src/lifecycle/docs.ts:146

Documents to remove

#### path

> **path**: `string`

#### reason

> **reason**: `string`

***

### update

> **update**: `object`[]

Defined in: src/lifecycle/docs.ts:138

Documents to update

#### changes

> **changes**: `string`[]

Specific things that changed

#### path

> **path**: `string`

#### reason

> **reason**: `string`

#### sections

> **sections**: `string`[]

***

### validateExamples

> **validateExamples**: `string`[]

Defined in: src/lifecycle/docs.ts:151

Examples to validate/update
