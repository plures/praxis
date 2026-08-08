[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / EventStreamEntry

# Interface: EventStreamEntry

Defined in: src/core/pluresdb/store.ts:69

Event stream entry with timestamp

## Properties

### event

> **event**: [`PraxisEvent`](PraxisEvent.md)

Defined in: src/core/pluresdb/store.ts:71

The event data

***

### sequence?

> `optional` **sequence?**: `number`

Defined in: src/core/pluresdb/store.ts:75

Optional sequence number

***

### timestamp

> **timestamp**: `number`

Defined in: src/core/pluresdb/store.ts:73

Timestamp when the event was appended
