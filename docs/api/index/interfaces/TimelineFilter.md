[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TimelineFilter

# Interface: TimelineFilter

Defined in: src/chronos/timeline.ts:13

Filter criteria for timeline queries. All fields are optional (AND logic).

## Properties

### action?

> `optional` **action?**: `string` \| `string`[]

Defined in: src/chronos/timeline.ts:17

Filter by action string(s).

***

### kind?

> `optional` **kind?**: [`ProjectEventKind`](../type-aliases/ProjectEventKind.md) \| [`ProjectEventKind`](../type-aliases/ProjectEventKind.md)[]

Defined in: src/chronos/timeline.ts:15

Filter by event kind(s).

***

### since?

> `optional` **since?**: `number`

Defined in: src/chronos/timeline.ts:21

Only events at or after this timestamp (inclusive).

***

### subject?

> `optional` **subject?**: `string` \| `string`[]

Defined in: src/chronos/timeline.ts:19

Filter by subject (exact match or array).

***

### until?

> `optional` **until?**: `number`

Defined in: src/chronos/timeline.ts:23

Only events at or before this timestamp (inclusive).
