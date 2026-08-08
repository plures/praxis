[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / RuleDescriptor

# Interface: RuleDescriptor\<TContext\>

Defined in: packages/praxis-core/src/rules.ts:64

Descriptor for a rule, including its ID, description, and implementation.

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### contract?

> `optional` **contract?**: [`Contract`](Contract.md)

Defined in: packages/praxis-core/src/rules.ts:84

Optional contract for rule behavior

***

### description

> **description**: `string`

Defined in: packages/praxis-core/src/rules.ts:68

Human-readable description

***

### eventTypes?

> `optional` **eventTypes?**: `string` \| `string`[]

Defined in: packages/praxis-core/src/rules.ts:82

Optional event type filter — only evaluate this rule when at least one
event in the batch has a matching `tag`. When omitted, the rule runs on
every step (catch-all).

Accepts a single tag string or an array of tags.

#### Example

```ts
{ id: 'sprint-behind', eventTypes: ['sprint.update'], impl: ... }
{ id: 'note-check', eventTypes: 'note.update', impl: ... }
```

***

### id

> **id**: `string`

Defined in: packages/praxis-core/src/rules.ts:66

Unique identifier for the rule

***

### impl

> **impl**: [`RuleFn`](../type-aliases/RuleFn.md)\<`TContext`\>

Defined in: packages/praxis-core/src/rules.ts:70

Implementation function

***

### meta?

> `optional` **meta?**: `Record`\<`string`, `unknown`\>

Defined in: packages/praxis-core/src/rules.ts:86

Optional metadata
