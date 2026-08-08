[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createCanvasEditor

# Function: createCanvasEditor()

> **createCanvasEditor**(`config`): `object`

Defined in: src/integrations/code-canvas.ts:693

Create a CodeCanvas editor instance

Note: This is a placeholder for the visual editor integration.
The actual visual editor requires a browser environment.

## Parameters

### config

[`CanvasEditorConfig`](../interfaces/CanvasEditorConfig.md)

Editor configuration including the initial canvas document

## Returns

`object`

An editor object with methods to add/remove nodes and edges and export the canvas

### addEdge

> **addEdge**: (`edge`) => [`CanvasEdge`](../interfaces/CanvasEdge.md)

#### Parameters

##### edge

`Omit`\<[`CanvasEdge`](../interfaces/CanvasEdge.md), `"id"`\>

#### Returns

[`CanvasEdge`](../interfaces/CanvasEdge.md)

### addNode

> **addNode**: (`node`) => [`CanvasNode`](../interfaces/CanvasNode.md)

#### Parameters

##### node

`Omit`\<[`CanvasNode`](../interfaces/CanvasNode.md), `"id"`\>

#### Returns

[`CanvasNode`](../interfaces/CanvasNode.md)

### document

> **document**: [`CanvasDocument`](../interfaces/CanvasDocument.md)

### removeEdge

> **removeEdge**: (`id`) => `void`

#### Parameters

##### id

`string`

#### Returns

`void`

### removeNode

> **removeNode**: (`id`) => `void`

#### Parameters

##### id

`string`

#### Returns

`void`

### toMermaid

> **toMermaid**: () => `string`

#### Returns

`string`

### toSchema

> **toSchema**: () => `PSFSchema`

#### Returns

`PSFSchema`

### toYaml

> **toYaml**: () => `string`

#### Returns

`string`
