[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PluresDBAdapter

# Interface: PluresDBAdapter\<TContext\>

Defined in: src/integrations/pluresdb.ts:91

PluresDB adapter interface for engine integration

Provides:
- Event sourcing (persist events to pluresdb)
- State snapshots (persist state to pluresdb)
- Event replay (rebuild state from events)
- Reactive queries (subscribe to state changes)

## Type Parameters

### TContext

`TContext` = `unknown`

## Methods

### attachEngine()

> **attachEngine**(`engine`): `void`

Defined in: src/integrations/pluresdb.ts:118

Attach the adapter to an engine

#### Parameters

##### engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

#### Returns

`void`

***

### dispose()

> **dispose**(): `void`

Defined in: src/integrations/pluresdb.ts:123

Dispose of resources

#### Returns

`void`

***

### loadEvents()

> **loadEvents**(`query?`): `Promise`\<[`PraxisEvent`](PraxisEvent.md)[]\>

Defined in: src/integrations/pluresdb.ts:105

Load events from pluresdb

#### Parameters

##### query?

`unknown`

#### Returns

`Promise`\<[`PraxisEvent`](PraxisEvent.md)[]\>

***

### persistEvents()

> **persistEvents**(`events`): `Promise`\<`void`\>

Defined in: src/integrations/pluresdb.ts:95

Persist events to pluresdb

#### Parameters

##### events

[`PraxisEvent`](PraxisEvent.md)[]

#### Returns

`Promise`\<`void`\>

***

### persistFacts()

> **persistFacts**(`facts`): `Promise`\<`void`\>

Defined in: src/integrations/pluresdb.ts:100

Persist facts to pluresdb

#### Parameters

##### facts

[`PraxisFact`](PraxisFact.md)[]

#### Returns

`Promise`\<`void`\>

***

### subscribeToEvents()

> **subscribeToEvents**(`callback`, `query?`): () => `void`

Defined in: src/integrations/pluresdb.ts:113

Subscribe to changes for a given tag

Note: This watches for derived facts that are created when events are processed.
The callback receives the new facts as event-like objects for convenience.

#### Parameters

##### callback

(`events`) => `void`

##### query?

`unknown`

#### Returns

() => `void`
