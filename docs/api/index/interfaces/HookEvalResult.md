[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / HookEvalResult

# Interface: HookEvalResult

Defined in: src/hooks/types.ts:76

Result of evaluating Praxis rules against a hook event.

## Properties

### actions

> **actions**: [`HookAction`](../type-aliases/HookAction.md)[]

Defined in: src/hooks/types.ts:80

Actions to take

***

### facts

> **facts**: `object`[]

Defined in: src/hooks/types.ts:82

Facts emitted by rules

#### payload

> **payload**: `unknown`

#### tag

> **tag**: `string`

***

### gates

> **gates**: `Record`\<`string`, \{ `status`: `string`; `unsatisfied`: `string`[]; \}\>

Defined in: src/hooks/types.ts:84

Gate states after evaluation

***

### proceed

> **proceed**: `boolean`

Defined in: src/hooks/types.ts:78

Whether the hook should proceed (true) or block (false)

***

### summary

> **summary**: `string`

Defined in: src/hooks/types.ts:86

Human-readable summary
