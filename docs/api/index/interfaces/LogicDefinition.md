[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LogicDefinition

# Interface: LogicDefinition

Defined in: src/core/schema/types.ts:219

Logic definition for business rules

## Extended by

- [`NormalizedLogic`](NormalizedLogic.md)

## Properties

### constraints?

> `optional` **constraints?**: `LogicConstraint`[]

Defined in: src/core/schema/types.ts:231

Constraints definitions

***

### description

> **description**: `string`

Defined in: src/core/schema/types.ts:223

Logic description

***

### events?

> `optional` **events?**: `EventDefinition`[]

Defined in: src/core/schema/types.ts:227

Events definitions

***

### facts?

> `optional` **facts?**: `FactDefinition`[]

Defined in: src/core/schema/types.ts:225

Facts definitions

***

### id

> **id**: `string`

Defined in: src/core/schema/types.ts:221

Logic identifier

***

### rules?

> `optional` **rules?**: `RuleDefinition`[]

Defined in: src/core/schema/types.ts:229

Rules definitions
