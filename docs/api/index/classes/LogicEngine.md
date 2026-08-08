[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LogicEngine

# Class: LogicEngine\<TContext\>

Defined in: packages/praxis-core/src/engine.ts:96

The Praxis Logic Engine

Manages application logic through facts, events, rules, and constraints.
The engine is strongly typed and functional - all state updates are immutable.

## Type Parameters

### TContext

`TContext` = `unknown`

## Constructors

### Constructor

> **new LogicEngine**\<`TContext`\>(`options`): `LogicEngine`\<`TContext`\>

Defined in: packages/praxis-core/src/engine.ts:103

#### Parameters

##### options

[`PraxisEngineOptions`](../interfaces/PraxisEngineOptions.md)\<`TContext`\>

#### Returns

`LogicEngine`\<`TContext`\>

## Methods

### addFacts()

> **addFacts**(`facts`): `void`

Defined in: packages/praxis-core/src/engine.ts:380

Add facts directly (for exceptional cases).
Generally, facts should be added through rules.

#### Parameters

##### facts

[`PraxisFact`](../interfaces/PraxisFact.md)[]

Facts to add

#### Returns

`void`

***

### checkConstraints()

> **checkConstraints**(): [`PraxisDiagnostics`](../interfaces/PraxisDiagnostics.md)[]

Defined in: packages/praxis-core/src/engine.ts:396

Check all constraints without processing any events.

Useful for validation-only scenarios (e.g., form validation,
pre-save checks) where you want constraint diagnostics without
triggering any rules.

#### Returns

[`PraxisDiagnostics`](../interfaces/PraxisDiagnostics.md)[]

Array of constraint violation diagnostics (empty = all passing)

***

### clearFacts()

> **clearFacts**(): `void`

Defined in: packages/praxis-core/src/engine.ts:406

Clear all facts

#### Returns

`void`

***

### getContext()

> **getContext**(): `TContext`

Defined in: packages/praxis-core/src/engine.ts:131

Get the current context

#### Returns

`TContext`

***

### getFacts()

> **getFacts**(): [`PraxisFact`](../interfaces/PraxisFact.md)[]

Defined in: packages/praxis-core/src/engine.ts:138

Get current facts

#### Returns

[`PraxisFact`](../interfaces/PraxisFact.md)[]

***

### getState()

> **getState**(): `Readonly`\<[`PraxisState`](../interfaces/PraxisState.md) & `object`\>

Defined in: packages/praxis-core/src/engine.ts:119

Get the current state (immutable copy)

#### Returns

`Readonly`\<[`PraxisState`](../interfaces/PraxisState.md) & `object`\>

***

### reset()

> **reset**(`options`): `void`

Defined in: packages/praxis-core/src/engine.ts:416

Reset the engine to initial state

#### Parameters

##### options

[`PraxisEngineOptions`](../interfaces/PraxisEngineOptions.md)\<`TContext`\>

#### Returns

`void`

***

### step()

> **step**(`events`): [`PraxisStepResult`](../interfaces/PraxisStepResult.md)

Defined in: packages/praxis-core/src/engine.ts:149

Process events through the engine.
Applies all registered rules and checks all registered constraints.

#### Parameters

##### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

Events to process

#### Returns

[`PraxisStepResult`](../interfaces/PraxisStepResult.md)

Result with new state and diagnostics

***

### stepWithConfig()

> **stepWithConfig**(`events`, `config`): [`PraxisStepResult`](../interfaces/PraxisStepResult.md)

Defined in: packages/praxis-core/src/engine.ts:164

Process events with specific rule and constraint configuration.

#### Parameters

##### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

Events to process

##### config

[`PraxisStepConfig`](../interfaces/PraxisStepConfig.md)

Step configuration

#### Returns

[`PraxisStepResult`](../interfaces/PraxisStepResult.md)

Result with new state and diagnostics

***

### stepWithContext()

> **stepWithContext**(`updater`, `events`): [`PraxisStepResult`](../interfaces/PraxisStepResult.md)

Defined in: packages/praxis-core/src/engine.ts:361

Atomically update context AND process events in a single call.

This avoids the fragile pattern of calling updateContext() then step()
separately, where rules could see stale context if the ordering is wrong.

#### Parameters

##### updater

(`context`) => `TContext`

Function that produces new context from old context

##### events

[`PraxisEvent`](../interfaces/PraxisEvent.md)[]

Events to process after context is updated

#### Returns

[`PraxisStepResult`](../interfaces/PraxisStepResult.md)

Result with new state and diagnostics

#### Example

```ts
engine.stepWithContext(
  ctx => ({ ...ctx, sprintName: sprint.name, items: sprint.items }),
  [{ tag: 'sprint.update', payload: { name: sprint.name } }]
);
```

***

### updateContext()

> **updateContext**(`updater`): `void`

Defined in: packages/praxis-core/src/engine.ts:338

Update the context directly (for exceptional cases).
Generally, context should be updated through rules.

#### Parameters

##### updater

(`context`) => `TContext`

Function that produces new context from old context

#### Returns

`void`
