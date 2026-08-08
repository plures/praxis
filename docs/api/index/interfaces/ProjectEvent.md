[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ProjectEvent

# Interface: ProjectEvent

Defined in: src/chronos/project-chronicle.ts:32

A single project lifecycle event.

Immutable once recorded — the chronicle is append-only.

## Properties

### action

> **action**: `string`

Defined in: src/chronos/project-chronicle.ts:40

Action that occurred.
Examples: 'registered', 'modified', 'removed', 'satisfied', 'violated',
          'opened', 'closed', 'blocked', 'audit-complete', 'introduced', 'deprecated'.

***

### diff?

> `optional` **diff?**: `object`

Defined in: src/chronos/project-chronicle.ts:48

Optional before/after diff for modifications.

#### after

> **after**: `unknown`

#### before

> **before**: `unknown`

***

### kind

> **kind**: [`ProjectEventKind`](../type-aliases/ProjectEventKind.md)

Defined in: src/chronos/project-chronicle.ts:34

Event kind (rule, contract, expectation, gate, build, fact).

***

### metadata

> **metadata**: `Record`\<`string`, `unknown`\>

Defined in: src/chronos/project-chronicle.ts:46

Arbitrary metadata for this event.

***

### subject

> **subject**: `string`

Defined in: src/chronos/project-chronicle.ts:42

The subject (rule id, contract id, gate name, fact tag, etc.).

***

### timestamp

> **timestamp**: `number`

Defined in: src/chronos/project-chronicle.ts:44

Unix ms timestamp.
