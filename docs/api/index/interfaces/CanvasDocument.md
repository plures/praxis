[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / CanvasDocument

# Interface: CanvasDocument

Defined in: src/integrations/code-canvas.ts:107

Canvas document containing nodes and edges

## Properties

### edges

> **edges**: [`CanvasEdge`](CanvasEdge.md)[]

Defined in: src/integrations/code-canvas.ts:117

All edges in the canvas

***

### flows?

> `optional` **flows?**: `PSFFlow`[]

Defined in: src/integrations/code-canvas.ts:119

Logic flows

***

### id

> **id**: `string`

Defined in: src/integrations/code-canvas.ts:109

Document identifier

***

### metadata?

> `optional` **metadata?**: `object`

Defined in: src/integrations/code-canvas.ts:121

Document metadata

#### author?

> `optional` **author?**: `string`

#### created

> **created**: `number`

#### description?

> `optional` **description?**: `string`

#### modified

> **modified**: `number`

***

### name

> **name**: `string`

Defined in: src/integrations/code-canvas.ts:111

Document name

***

### nodes

> **nodes**: [`CanvasNode`](CanvasNode.md)[]

Defined in: src/integrations/code-canvas.ts:115

All nodes in the canvas

***

### version

> **version**: `string`

Defined in: src/integrations/code-canvas.ts:113

Document version

***

### viewport?

> `optional` **viewport?**: `object`

Defined in: src/integrations/code-canvas.ts:128

Viewport settings

#### x

> **x**: `number`

#### y

> **y**: `number`

#### zoom

> **zoom**: `number`
