[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / CausalChainLink

# Interface: CausalChainLink

Defined in: src/integration/hub.ts:94

A single link in a causal chain tracing a fact back to its evidence.

## Properties

### confidence?

> `optional` **confidence?**: `number`

Defined in: src/integration/hub.ts:104

Confidence score (only present for fact links).

***

### description

> **description**: `string`

Defined in: src/integration/hub.ts:100

Human-readable description.

***

### id

> **id**: `string`

Defined in: src/integration/hub.ts:98

Identifier for this item.

***

### kind

> **kind**: `"fact"` \| `"experiment"` \| `"observation"`

Defined in: src/integration/hub.ts:96

Whether this link represents a fact, an experiment, or an observation.

***

### timestamp

> **timestamp**: `string`

Defined in: src/integration/hub.ts:102

ISO timestamp.
