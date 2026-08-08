[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ModelDefinition

# Interface: ModelDefinition

Defined in: src/core/schema/types.ts:32

Model definition for data structures

## Extended by

- [`NormalizedModel`](NormalizedModel.md)

## Properties

### constraints?

> `optional` **constraints?**: `ConstraintDefinition`[]

Defined in: src/core/schema/types.ts:40

Validation constraints

***

### description?

> `optional` **description?**: `string`

Defined in: src/core/schema/types.ts:36

Model description

***

### fields

> **fields**: `FieldDefinition`[]

Defined in: src/core/schema/types.ts:38

Model fields

***

### indexes?

> `optional` **indexes?**: `IndexDefinition`[]

Defined in: src/core/schema/types.ts:42

Indexes for queries

***

### name

> **name**: `string`

Defined in: src/core/schema/types.ts:34

Model name

***

### relationships?

> `optional` **relationships?**: `RelationshipDefinition`[]

Defined in: src/core/schema/types.ts:44

Relationships to other models
