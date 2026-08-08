[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createApp

# Function: createApp()

> **createApp**(`config`): [`PraxisApp`](../interfaces/PraxisApp.md)

Defined in: src/unified/core.ts:124

Create a Praxis application.

This is the single entry point. It creates the reactive graph,
wires rules and constraints, starts Chronos logging, and returns
query() and mutate() — the only two functions a developer needs.

## Parameters

### config

[`PraxisAppConfig`](../interfaces/PraxisAppConfig.md)

Application configuration: name, schema paths, rules, constraints, and liveness settings

## Returns

[`PraxisApp`](../interfaces/PraxisApp.md)

A live [PraxisApp](../interfaces/PraxisApp.md) instance with `query()`, `mutate()`, `batch()`, and lifecycle methods

## Example

```ts
import { createApp, definePath, defineRule } from '@plures/praxis';

const Sprint = definePath<SprintInfo | null>('sprint/current', null);
const Loading = definePath<boolean>('sprint/loading', false);

const app = createApp({
  name: 'sprint-log',
  schema: [Sprint, Loading],
  rules: [sprintBehindRule, capacityRule],
  constraints: [noCloseWithoutHoursConstraint],
});

// In a Svelte component:
const sprint = app.query<SprintInfo | null>('sprint/current');
// $sprint is reactive — updates automatically

// To write:
app.mutate('sprint/current', sprintData);
// Constraints validated, rules re-evaluated, Chronos logged — all automatic
```
