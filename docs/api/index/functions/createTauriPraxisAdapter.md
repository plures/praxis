[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createTauriPraxisAdapter

# Function: createTauriPraxisAdapter()

> **createTauriPraxisAdapter**\<`TContext`\>(`options`): [`TauriPraxisAdapter`](../interfaces/TauriPraxisAdapter.md)\<`TContext`\>

Defined in: src/integrations/tauri.ts:485

Create a Tauri-Praxis adapter for engine persistence

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### options

#### bridge

[`TauriBridge`](../interfaces/TauriBridge.md)

#### eventsPath?

`string`

#### statePath?

`string`

## Returns

[`TauriPraxisAdapter`](../interfaces/TauriPraxisAdapter.md)\<`TContext`\>

## Example

```typescript
import { createTauriPraxisAdapter } from '@plures/praxis/integrations/tauri';

const adapter = createTauriPraxisAdapter({
  bridge: tauriBridge,
  statePath: 'app-state.json',
  eventsPath: 'app-events.json',
});

// Save state
await adapter.saveState(engine.getContext());

// Load state
const savedState = await adapter.loadState();
```
