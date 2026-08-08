[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisState

# Interface: PraxisState

Defined in: packages/praxis-core/src/protocol.ts:73

The state of the Praxis engine at a point in time.

## Properties

### context

> **context**: `unknown`

Defined in: packages/praxis-core/src/protocol.ts:75

Application context (domain-specific data)

***

### events?

> `optional` **events?**: [`PraxisEvent`](PraxisEvent.md)[]

Defined in: packages/praxis-core/src/protocol.ts:84

Events currently being processed in this step.
Available to rules during execution — guaranteed to contain the exact
events passed to step()/stepWithContext().
Empty outside of step execution.

***

### facts

> **facts**: [`PraxisFact`](PraxisFact.md)[]

Defined in: packages/praxis-core/src/protocol.ts:77

Current facts about the domain

***

### meta?

> `optional` **meta?**: `Record`\<`string`, `unknown`\>

Defined in: packages/praxis-core/src/protocol.ts:86

Optional metadata (timestamps, version, etc.)

***

### protocolVersion?

> `optional` **protocolVersion?**: `string`

Defined in: packages/praxis-core/src/protocol.ts:88

Protocol version (for cross-language compatibility)
