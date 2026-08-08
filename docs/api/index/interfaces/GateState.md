[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / GateState

# Interface: GateState

Defined in: src/project/types.ts:24

Runtime state of a gate — which expectations are satisfied or pending.

## Properties

### lastChanged

> **lastChanged**: `number`

Defined in: src/project/types.ts:32

Timestamp of last status change

***

### name

> **name**: `string`

Defined in: src/project/types.ts:25

***

### satisfied

> **satisfied**: `string`[]

Defined in: src/project/types.ts:28

Which expectations are satisfied

***

### status

> **status**: [`GateStatus`](../type-aliases/GateStatus.md)

Defined in: src/project/types.ts:26

***

### unsatisfied

> **unsatisfied**: `string`[]

Defined in: src/project/types.ts:30

Which expectations are not satisfied
