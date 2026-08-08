[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ChronicleNode

# Interface: ChronicleNode

Defined in: src/core/chronicle/types.ts:42

A Chronicle node representing a single recorded state transition.

## Properties

### event

> **event**: [`ChronicleEvent`](ChronicleEvent.md)

Defined in: src/core/chronicle/types.ts:48

The recorded state transition

***

### id

> **id**: `string`

Defined in: src/core/chronicle/types.ts:44

Unique node ID: `chronos:{timestamp}-{counter}`

***

### timestamp

> **timestamp**: `number`

Defined in: src/core/chronicle/types.ts:46

Timestamp (ms since epoch) when this node was recorded
