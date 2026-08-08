[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Chronicle

# Interface: Chronicle

Defined in: src/core/chronicle/chronicle.ts:36

Chronicle interface — records state transitions as a causal graph.

Automatically attached to any PraxisDBStore at runtime via `.withChronicle()`.
Records state diffs as graph nodes with causal edges.

## Methods

### range()

> **range**(`start`, `end`): `Promise`\<[`ChronicleNode`](ChronicleNode.md)[]\>

Defined in: src/core/chronicle/chronicle.ts:57

Return all Chronicle nodes recorded within a timestamp range.

#### Parameters

##### start

`number`

Inclusive start timestamp (ms)

##### end

`number`

Inclusive end timestamp (ms)

#### Returns

`Promise`\<[`ChronicleNode`](ChronicleNode.md)[]\>

***

### record()

> **record**(`event`): `Promise`\<[`ChronicleNode`](ChronicleNode.md)\>

Defined in: src/core/chronicle/chronicle.ts:40

Record a state transition and return the created node.

#### Parameters

##### event

[`ChronicleEvent`](ChronicleEvent.md)

#### Returns

`Promise`\<[`ChronicleNode`](ChronicleNode.md)\>

***

### subgraph()

> **subgraph**(`contextId`): `Promise`\<[`ChronicleNode`](ChronicleNode.md)[]\>

Defined in: src/core/chronicle/chronicle.ts:64

Return all Chronicle nodes belonging to a context (session/request).

#### Parameters

##### contextId

`string`

The context identifier

#### Returns

`Promise`\<[`ChronicleNode`](ChronicleNode.md)[]\>

***

### trace()

> **trace**(`nodeId`, `direction`, `maxDepth`): `Promise`\<[`ChronicleNode`](ChronicleNode.md)[]\>

Defined in: src/core/chronicle/chronicle.ts:49

Trace causality backward or forward from a node.

#### Parameters

##### nodeId

`string`

Starting node ID

##### direction

[`TraceDirection`](../type-aliases/TraceDirection.md)

`'backward'` follows incoming edges, `'forward'` follows outgoing edges

##### maxDepth

`number`

Maximum traversal depth (prevents cycles / infinite loops)

#### Returns

`Promise`\<[`ChronicleNode`](ChronicleNode.md)[]\>
