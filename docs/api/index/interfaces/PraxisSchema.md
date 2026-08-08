[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisSchema

# Interface: PraxisSchema

Defined in: src/core/schema/types.ts:10

Base schema definition

## Extended by

- [`NormalizedSchema`](NormalizedSchema.md)

## Properties

### components?

> `optional` **components?**: [`ComponentDefinition`](ComponentDefinition.md)[]

Defined in: src/core/schema/types.ts:20

UI components

***

### description?

> `optional` **description?**: `string`

Defined in: src/core/schema/types.ts:16

Human-readable description

***

### logic?

> `optional` **logic?**: [`LogicDefinition`](LogicDefinition.md)[]

Defined in: src/core/schema/types.ts:22

Logic definitions

***

### metadata?

> `optional` **metadata?**: `Record`\<`string`, `unknown`\>

Defined in: src/core/schema/types.ts:26

Additional metadata

***

### models?

> `optional` **models?**: [`ModelDefinition`](ModelDefinition.md)[]

Defined in: src/core/schema/types.ts:18

Data models

***

### name

> **name**: `string`

Defined in: src/core/schema/types.ts:14

Schema name/identifier

***

### orchestration?

> `optional` **orchestration?**: [`OrchestrationDefinition`](OrchestrationDefinition.md)

Defined in: src/core/schema/types.ts:24

Orchestration configuration

***

### version

> **version**: `string`

Defined in: src/core/schema/types.ts:12

Schema version (semver)
