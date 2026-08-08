[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / BehavioralDelta

# Interface: BehavioralDelta

Defined in: src/chronos/timeline.ts:27

Summary of changes between two points in time.

## Properties

### added

> **added**: `string`[]

Defined in: src/chronos/timeline.ts:36

Subjects that were added (first 'registered' / 'added' / 'introduced').

***

### events

> **events**: [`ProjectEvent`](ProjectEvent.md)[]

Defined in: src/chronos/timeline.ts:32

Events within the range.

***

### from

> **from**: `number`

Defined in: src/chronos/timeline.ts:29

Time range of this delta.

***

### modified

> **modified**: `string`[]

Defined in: src/chronos/timeline.ts:40

Subjects that were modified.

***

### removed

> **removed**: `string`[]

Defined in: src/chronos/timeline.ts:38

Subjects that were removed ('removed' / 'deprecated').

***

### summary

> **summary**: `Record`\<[`ProjectEventKind`](../type-aliases/ProjectEventKind.md), `number`\>

Defined in: src/chronos/timeline.ts:34

Summary counts by kind.

***

### to

> **to**: `number`

Defined in: src/chronos/timeline.ts:30
