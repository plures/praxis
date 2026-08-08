[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createStateDocsGenerator

# Function: createStateDocsGenerator()

> **createStateDocsGenerator**(`config`): [`StateDocsGenerator`](../classes/StateDocsGenerator.md)

Defined in: src/integrations/state-docs.ts:703

Create a State-Docs generator instance

## Parameters

### config

[`StateDocsConfig`](../interfaces/StateDocsConfig.md)

Generator configuration including project title and output target directory

## Returns

[`StateDocsGenerator`](../classes/StateDocsGenerator.md)

A new [StateDocsGenerator](../classes/StateDocsGenerator.md) instance

## Example

```typescript
import { createStateDocsGenerator } from '@plures/praxis/integrations/state-docs';

const generator = createStateDocsGenerator({
  projectTitle: 'My Project',
  target: './docs/api',
});

const docs = generator.generateFromSchema(mySchema);
for (const doc of docs) {
  await writeFile(doc.path, doc.content);
}
```
