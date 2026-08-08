[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ChronicleEvent

# Interface: ChronicleEvent

Defined in: src/core/chronicle/types.ts:24

A recorded state transition event passed to Chronicle.

## Properties

### after?

> `optional` **after?**: `unknown`

Defined in: src/core/chronicle/types.ts:30

Value after the change

***

### before?

> `optional` **before?**: `unknown`

Defined in: src/core/chronicle/types.ts:28

Value before the change (undefined for creates)

***

### cause?

> `optional` **cause?**: `string`

Defined in: src/core/chronicle/types.ts:32

Parent span/node ID that caused this change

***

### context?

> `optional` **context?**: `string`

Defined in: src/core/chronicle/types.ts:34

Session or request ID grouping related changes

***

### metadata

> **metadata**: `Record`\<`string`, `string`\>

Defined in: src/core/chronicle/types.ts:36

Additional metadata key-value pairs

***

### path

> **path**: `string`

Defined in: src/core/chronicle/types.ts:26

Path to the changed value (fact or event stream path)
