[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createUnifiedApp

# Function: createUnifiedApp()

> **createUnifiedApp**\<`TContext`\>(`config`): `Promise`\<[`UnifiedApp`](../interfaces/UnifiedApp.md)\<`TContext`\>\>

Defined in: src/integrations/unified.ts:134

Create a unified Praxis application with all integrations

This is a convenience function that sets up:
- Praxis logic engine
- PluresDB for persistence (auto-attaches to engine)
- Unum for distributed communication (optional)
- State-Docs for documentation generation (optional)
- CodeCanvas for visual schema editing (optional)

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### config

[`UnifiedAppConfig`](../interfaces/UnifiedAppConfig.md)\<`TContext`\>

## Returns

`Promise`\<[`UnifiedApp`](../interfaces/UnifiedApp.md)\<`TContext`\>\>

## Example

```typescript
import { createUnifiedApp } from '@plures/praxis';

const app = await createUnifiedApp({
  registry: myRegistry,
  initialContext: { count: 0 },
  enableUnum: true,
  unumIdentity: { name: 'node-1' },
  enableDocs: true,
  docsConfig: { projectTitle: 'My App' },
  schema: mySchema,
});

// Use the engine
app.engine.step([myEvent]);

// Broadcast to other nodes
if (app.channel) {
  await app.unum?.broadcastEvent(app.channel.id, myEvent);
}

// Generate documentation
const docs = app.generateDocs?.();

// Cleanup
app.dispose();
```
