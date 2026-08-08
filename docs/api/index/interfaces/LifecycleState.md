[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LifecycleState

# Interface: LifecycleState

Defined in: src/integrations/code-canvas.ts:138

FSM lifecycle state

## Properties

### description?

> `optional` **description?**: `string`

Defined in: src/integrations/code-canvas.ts:144

State description

***

### final?

> `optional` **final?**: `boolean`

Defined in: src/integrations/code-canvas.ts:154

Is this a final state

***

### id

> **id**: `string`

Defined in: src/integrations/code-canvas.ts:140

State identifier

***

### initial?

> `optional` **initial?**: `boolean`

Defined in: src/integrations/code-canvas.ts:152

Is this an initial state

***

### name

> **name**: `string`

Defined in: src/integrations/code-canvas.ts:142

State name

***

### onEntry?

> `optional` **onEntry?**: `string`[]

Defined in: src/integrations/code-canvas.ts:148

Entry actions

***

### onExit?

> `optional` **onExit?**: `string`[]

Defined in: src/integrations/code-canvas.ts:150

Exit actions

***

### transitions

> **transitions**: `string`[]

Defined in: src/integrations/code-canvas.ts:146

Allowed transitions from this state
