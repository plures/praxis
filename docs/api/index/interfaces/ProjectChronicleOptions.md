[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ProjectChronicleOptions

# Interface: ProjectChronicleOptions

Defined in: src/chronos/project-chronicle.ts:52

Options for creating a ProjectChronicle.

## Properties

### maxEvents?

> `optional` **maxEvents?**: `number`

Defined in: src/chronos/project-chronicle.ts:54

Maximum events to retain (0 = unlimited, default 10_000).

***

### now?

> `optional` **now?**: () => `number`

Defined in: src/chronos/project-chronicle.ts:56

Optional clock function (for testing).

#### Returns

`number`
