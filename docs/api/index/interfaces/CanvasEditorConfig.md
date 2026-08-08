[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / CanvasEditorConfig

# Interface: CanvasEditorConfig

Defined in: src/integrations/code-canvas.ts:176

Canvas editor configuration

## Properties

### document?

> `optional` **document?**: [`CanvasDocument`](CanvasDocument.md)

Defined in: src/integrations/code-canvas.ts:178

Canvas document to edit

***

### edgeStyles?

> `optional` **edgeStyles?**: `Record`\<`string`, [`CanvasEdgeStyle`](CanvasEdgeStyle.md)\>

Defined in: src/integrations/code-canvas.ts:186

Custom edge styles by type

***

### enableFSM?

> `optional` **enableFSM?**: `boolean`

Defined in: src/integrations/code-canvas.ts:182

Enable FSM validation

***

### layout?

> `optional` **layout?**: `"hierarchical"` \| `"force"` \| `"grid"` \| `"circular"`

Defined in: src/integrations/code-canvas.ts:188

Auto-layout algorithm

***

### nodeStyles?

> `optional` **nodeStyles?**: `Record`\<`string`, [`CanvasNodeStyle`](CanvasNodeStyle.md)\>

Defined in: src/integrations/code-canvas.ts:184

Custom node styles by type

***

### schema?

> `optional` **schema?**: `PSFSchema`

Defined in: src/integrations/code-canvas.ts:180

Schema to visualize
