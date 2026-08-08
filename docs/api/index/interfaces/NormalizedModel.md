[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / NormalizedModel

# Interface: NormalizedModel

Defined in: src/core/schema/normalize.ts:31

Normalized model definition

## Extends

- [`ModelDefinition`](ModelDefinition.md)

## Properties

### allFields

> **allFields**: `FieldDefinition`[]

Defined in: src/core/schema/normalize.ts:35

All fields including inherited ones

***

### constraints?

> `optional` **constraints?**: `ConstraintDefinition`[]

Defined in: src/core/schema/types.ts:40

Validation constraints

#### Inherited from

[`ModelDefinition`](ModelDefinition.md).[`constraints`](ModelDefinition.md#constraints)

***

### dependencies

> **dependencies**: `string`[]

Defined in: src/core/schema/normalize.ts:37

Model dependencies

***

### description?

> `optional` **description?**: `string`

Defined in: src/core/schema/types.ts:36

Model description

#### Inherited from

[`ModelDefinition`](ModelDefinition.md).[`description`](ModelDefinition.md#description)

***

### fields

> **fields**: `FieldDefinition`[]

Defined in: src/core/schema/types.ts:38

Model fields

#### Inherited from

[`ModelDefinition`](ModelDefinition.md).[`fields`](ModelDefinition.md#fields)

***

### fullName

> **fullName**: `string`

Defined in: src/core/schema/normalize.ts:33

Fully qualified name

***

### indexes?

> `optional` **indexes?**: `IndexDefinition`[]

Defined in: src/core/schema/types.ts:42

Indexes for queries

#### Inherited from

[`ModelDefinition`](ModelDefinition.md).[`indexes`](ModelDefinition.md#indexes)

***

### name

> **name**: `string`

Defined in: src/core/schema/types.ts:34

Model name

#### Inherited from

[`ModelDefinition`](ModelDefinition.md).[`name`](ModelDefinition.md#name)

***

### relationships?

> `optional` **relationships?**: `RelationshipDefinition`[]

Defined in: src/core/schema/types.ts:44

Relationships to other models

#### Inherited from

[`ModelDefinition`](ModelDefinition.md).[`relationships`](ModelDefinition.md#relationships)
