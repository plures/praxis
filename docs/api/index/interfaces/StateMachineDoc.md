[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / StateMachineDoc

# Interface: StateMachineDoc

Defined in: src/integrations/state-docs.ts:69

State machine representation for documentation

## Properties

### context?

> `optional` **context?**: `string`

Defined in: src/integrations/state-docs.ts:83

Context type description

***

### description?

> `optional` **description?**: `string`

Defined in: src/integrations/state-docs.ts:75

Machine description

***

### events?

> `optional` **events?**: `string`[]

Defined in: src/integrations/state-docs.ts:85

Events that this machine handles

***

### id

> **id**: `string`

Defined in: src/integrations/state-docs.ts:71

Machine identifier

***

### initial?

> `optional` **initial?**: `string`

Defined in: src/integrations/state-docs.ts:77

Initial state

***

### name

> **name**: `string`

Defined in: src/integrations/state-docs.ts:73

Machine name

***

### states

> **states**: [`StateDoc`](StateDoc.md)[]

Defined in: src/integrations/state-docs.ts:79

All states

***

### transitions

> **transitions**: [`TransitionDoc`](TransitionDoc.md)[]

Defined in: src/integrations/state-docs.ts:81

All transitions
