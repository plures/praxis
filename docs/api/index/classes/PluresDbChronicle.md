[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PluresDbChronicle

# Class: PluresDbChronicle

Defined in: src/core/chronicle/chronicle.ts:92

PluresDB-backed implementation of the Chronicle interface.

Stores causal graph nodes and edges in PluresDB under `/_praxis/chronos/`.
Shares the same PluresDB instance as PraxisDBStore so the JS Chronos UI
can read from the same data layer.

## Example

```typescript
const db = createInMemoryDB();
const chronicle = new PluresDbChronicle(db);

const store = createPraxisDBStore(db, registry).withChronicle(chronicle);
// All storeFact / appendEvent calls are now recorded automatically.
```

## Implements

- [`Chronicle`](../interfaces/Chronicle.md)

## Constructors

### Constructor

> **new PluresDbChronicle**(`db`): `PluresDbChronicle`

Defined in: src/core/chronicle/chronicle.ts:95

#### Parameters

##### db

[`PraxisDB`](../interfaces/PraxisDB.md)

#### Returns

`PluresDbChronicle`

## Methods

### range()

> **range**(`start`, `end`): `Promise`\<[`ChronicleNode`](../interfaces/ChronicleNode.md)[]\>

Defined in: src/core/chronicle/chronicle.ts:141

Return all Chronicle nodes recorded within a timestamp range.

#### Parameters

##### start

`number`

Inclusive start timestamp (ms)

##### end

`number`

Inclusive end timestamp (ms)

#### Returns

`Promise`\<[`ChronicleNode`](../interfaces/ChronicleNode.md)[]\>

#### Implementation of

[`Chronicle`](../interfaces/Chronicle.md).[`range`](../interfaces/Chronicle.md#range)

***

### record()

> **record**(`event`): `Promise`\<[`ChronicleNode`](../interfaces/ChronicleNode.md)\>

Defined in: src/core/chronicle/chronicle.ts:99

Record a state transition and return the created node.

#### Parameters

##### event

[`ChronicleEvent`](../interfaces/ChronicleEvent.md)

#### Returns

`Promise`\<[`ChronicleNode`](../interfaces/ChronicleNode.md)\>

#### Implementation of

[`Chronicle`](../interfaces/Chronicle.md).[`record`](../interfaces/Chronicle.md#record)

***

### subgraph()

> **subgraph**(`contextId`): `Promise`\<[`ChronicleNode`](../interfaces/ChronicleNode.md)[]\>

Defined in: src/core/chronicle/chronicle.ts:155

Return all Chronicle nodes belonging to a context (session/request).

#### Parameters

##### contextId

`string`

The context identifier

#### Returns

`Promise`\<[`ChronicleNode`](../interfaces/ChronicleNode.md)[]\>

#### Implementation of

[`Chronicle`](../interfaces/Chronicle.md).[`subgraph`](../interfaces/Chronicle.md#subgraph)

***

### trace()

> **trace**(`nodeId`, `direction`, `maxDepth`): `Promise`\<[`ChronicleNode`](../interfaces/ChronicleNode.md)[]\>

Defined in: src/core/chronicle/chronicle.ts:134

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

`Promise`\<[`ChronicleNode`](../interfaces/ChronicleNode.md)[]\>

#### Implementation of

[`Chronicle`](../interfaces/Chronicle.md).[`trace`](../interfaces/Chronicle.md#trace)
