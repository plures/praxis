[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UnifiedApp

# Interface: UnifiedApp\<TContext\>

Defined in: src/integrations/unified.ts:69

Unified application instance with all integrations

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### canvas?

> `optional` **canvas?**: [`CanvasDocument`](CanvasDocument.md)

Defined in: src/integrations/unified.ts:86

CodeCanvas document (if schema provided)

***

### channel?

> `optional` **channel?**: [`UnumChannel`](UnumChannel.md)

Defined in: src/integrations/unified.ts:80

Default Unum channel (if Unum enabled)

***

### dispose

> **dispose**: () => `void`

Defined in: src/integrations/unified.ts:92

Cleanup function to dispose all integrations

#### Returns

`void`

***

### docs?

> `optional` **docs?**: [`StateDocsGenerator`](../classes/StateDocsGenerator.md)

Defined in: src/integrations/unified.ts:83

State-Docs generator (if enabled)

***

### engine

> **engine**: [`LogicEngine`](../classes/LogicEngine.md)\<`TContext`\>

Defined in: src/integrations/unified.ts:71

Praxis logic engine

***

### generateDocs?

> `optional` **generateDocs?**: () => [`GeneratedDoc`](GeneratedDoc.md)[]

Defined in: src/integrations/unified.ts:89

Generate documentation from current state

#### Returns

[`GeneratedDoc`](GeneratedDoc.md)[]

***

### pluresdb

> **pluresdb**: [`PluresDBAdapter`](PluresDBAdapter.md)\<`TContext`\>

Defined in: src/integrations/unified.ts:74

PluresDB adapter for persistence

***

### unum?

> `optional` **unum?**: [`UnumAdapter`](UnumAdapter.md)

Defined in: src/integrations/unified.ts:77

Unum adapter for distributed communication (if enabled)
