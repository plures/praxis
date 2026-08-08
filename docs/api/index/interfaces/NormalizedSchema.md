[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / NormalizedSchema

# Interface: NormalizedSchema

Defined in: src/core/schema/normalize.ts:19

Normalized schema with expanded and validated definitions

## Extends

- [`PraxisSchema`](PraxisSchema.md)

## Properties

### components

> **components**: [`NormalizedComponent`](NormalizedComponent.md)[]

Defined in: src/core/schema/normalize.ts:23

Normalized components

#### Overrides

[`PraxisSchema`](PraxisSchema.md).[`components`](PraxisSchema.md#components)

***

### description?

> `optional` **description?**: `string`

Defined in: src/core/schema/types.ts:16

Human-readable description

#### Inherited from

[`PraxisSchema`](PraxisSchema.md).[`description`](PraxisSchema.md#description)

***

### logic

> **logic**: [`NormalizedLogic`](NormalizedLogic.md)[]

Defined in: src/core/schema/normalize.ts:25

Normalized logic

#### Overrides

[`PraxisSchema`](PraxisSchema.md).[`logic`](PraxisSchema.md#logic)

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: src/core/schema/types.ts:26

Additional metadata

#### Inherited from

[`PraxisSchema`](PraxisSchema.md).[`metadata`](PraxisSchema.md#metadata)

***

### models

> **models**: [`NormalizedModel`](NormalizedModel.md)[]

Defined in: src/core/schema/normalize.ts:21

Normalized models with expanded references

#### Overrides

[`PraxisSchema`](PraxisSchema.md).[`models`](PraxisSchema.md#models)

***

### name

> **name**: `string`

Defined in: src/core/schema/types.ts:14

Schema name/identifier

#### Inherited from

[`PraxisSchema`](PraxisSchema.md).[`name`](PraxisSchema.md#name)

***

### orchestration?

> `optional` **orchestration?**: [`OrchestrationDefinition`](OrchestrationDefinition.md)

Defined in: src/core/schema/types.ts:24

Orchestration configuration

#### Inherited from

[`PraxisSchema`](PraxisSchema.md).[`orchestration`](PraxisSchema.md#orchestration)

***

### version

> **version**: `string`

Defined in: src/core/schema/types.ts:12

Schema version (semver)

#### Inherited from

[`PraxisSchema`](PraxisSchema.md).[`version`](PraxisSchema.md#version)
