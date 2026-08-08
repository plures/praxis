[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / CanvasEdge

# Interface: CanvasEdge

Defined in: src/integrations/code-canvas.ts:57

Canvas edge representing a connection between nodes

## Properties

### id

> **id**: `string`

Defined in: src/integrations/code-canvas.ts:59

Unique edge identifier

***

### label?

> `optional` **label?**: `string`

Defined in: src/integrations/code-canvas.ts:65

Edge label

***

### source

> **source**: `string`

Defined in: src/integrations/code-canvas.ts:61

Source node ID

***

### style?

> `optional` **style?**: [`CanvasEdgeStyle`](CanvasEdgeStyle.md)

Defined in: src/integrations/code-canvas.ts:69

Edge style

***

### target

> **target**: `string`

Defined in: src/integrations/code-canvas.ts:63

Target node ID

***

### type?

> `optional` **type?**: `"event"` \| `"reference"` \| `"transition"` \| `"dependency"` \| `"trigger"`

Defined in: src/integrations/code-canvas.ts:67

Edge type
