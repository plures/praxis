[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ChronicleHandle

# Interface: ChronicleHandle

Defined in: src/chronos/hooks.ts:18

Handle returned by enableProjectChronicle for cleanup.

## Properties

### chronicle

> **chronicle**: [`ProjectChronicle`](../classes/ProjectChronicle.md)

Defined in: src/chronos/hooks.ts:20

The underlying chronicle being written to.

***

### disconnect

> **disconnect**: () => `void`

Defined in: src/chronos/hooks.ts:22

Disconnect all hooks (restores original methods).

#### Returns

`void`
