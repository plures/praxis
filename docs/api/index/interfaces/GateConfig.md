[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / GateConfig

# Interface: GateConfig

Defined in: src/project/types.ts:14

Configuration for a project gate — what expectations must be met.

## Properties

### expects

> **expects**: `string`[]

Defined in: src/project/types.ts:16

Expectations that must be satisfied for the gate to open

***

### onSatisfied?

> `optional` **onSatisfied?**: `string`

Defined in: src/project/types.ts:18

Action when gate is satisfied

***

### onViolation?

> `optional` **onViolation?**: `string`

Defined in: src/project/types.ts:20

Action when gate is violated
