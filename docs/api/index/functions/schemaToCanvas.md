[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / schemaToCanvas

# Function: schemaToCanvas()

> **schemaToCanvas**(`schema`, `_options?`): [`CanvasDocument`](../interfaces/CanvasDocument.md)

Defined in: src/integrations/code-canvas.ts:252

Create a canvas document from a Praxis schema

## Parameters

### schema

`PSFSchema`

### \_options?

#### layout?

`"hierarchical"` \| `"force"` \| `"grid"` \| `"circular"`

## Returns

[`CanvasDocument`](../interfaces/CanvasDocument.md)

## Example

```typescript
import { schemaToCanvas } from '@plures/praxis/integrations/code-canvas';

const canvas = schemaToCanvas(mySchema, {
  layout: 'hierarchical',
});

// Export to YAML
const yaml = canvasToYaml(canvas);
```
