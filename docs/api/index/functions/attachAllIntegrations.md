[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / attachAllIntegrations

# Function: attachAllIntegrations()

> **attachAllIntegrations**\<`TContext`\>(`engine`, `registry`, `options?`): `Promise`\<\{ `channel?`: [`UnumChannel`](../interfaces/UnumChannel.md); `dispose`: () => `void`; `docs?`: [`StateDocsGenerator`](../classes/StateDocsGenerator.md); `pluresdb`: [`PluresDBAdapter`](../interfaces/PluresDBAdapter.md)\<`TContext`\>; `unum?`: [`UnumAdapter`](../interfaces/UnumAdapter.md); \}\>

Defined in: src/integrations/unified.ts:261

Attach all available integrations to an existing Praxis engine

This is useful when you already have an engine and want to add integrations.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### engine

[`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

### registry

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`TContext`\>

### options?

#### db?

[`PraxisDB`](../interfaces/PraxisDB.md)

#### docsConfig?

\{ `projectTitle`: `string`; `target?`: `string`; \}

#### docsConfig.projectTitle

`string`

#### docsConfig.target?

`string`

#### enableDocs?

`boolean`

#### enableUnum?

`boolean`

#### unumIdentity?

`Omit`\<[`UnumIdentity`](../interfaces/UnumIdentity.md), `"id"` \| `"createdAt"`\>

## Returns

`Promise`\<\{ `channel?`: [`UnumChannel`](../interfaces/UnumChannel.md); `dispose`: () => `void`; `docs?`: [`StateDocsGenerator`](../classes/StateDocsGenerator.md); `pluresdb`: [`PluresDBAdapter`](../interfaces/PluresDBAdapter.md)\<`TContext`\>; `unum?`: [`UnumAdapter`](../interfaces/UnumAdapter.md); \}\>

## Example

```typescript
import { createPraxisEngine, attachAllIntegrations } from '@plures/praxis';

const engine = createPraxisEngine({ initialContext: {}, registry });

const integrations = await attachAllIntegrations(engine, registry, {
  enableUnum: true,
  enableDocs: true,
});

// Later cleanup
integrations.dispose();
```
