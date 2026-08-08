[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / attachTauriToEngine

# Function: attachTauriToEngine()

> **attachTauriToEngine**\<`TContext`\>(`engine`, `adapter`, `options?`): () => `void`

Defined in: src/integrations/tauri.ts:560

Attach Tauri bridge to a Praxis engine for auto-save

## Type Parameters

### TContext

`TContext`

## Parameters

### engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

### adapter

[`TauriPraxisAdapter`](../interfaces/TauriPraxisAdapter.md)\<`TContext`\>

### options?

#### autoSave?

`boolean`

#### saveInterval?

`number`

## Returns

() => `void`

## Example

```typescript
import { attachTauriToEngine } from '@plures/praxis/integrations/tauri';

const cleanup = attachTauriToEngine(engine, adapter, {
  autoSave: true,
  saveInterval: 5000,
});

// Later, cleanup subscriptions
cleanup();
```
