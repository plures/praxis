[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / NodeDefinition

# Interface: NodeDefinition

Defined in: src/core/schema/types.ts:307

Node definition for orchestration

## Properties

### bindings?

> `optional` **bindings?**: [`NodeBindings`](NodeBindings.md)

Defined in: src/core/schema/types.ts:320

Node bindings (connections to pluresdb paths)

***

### config

> **config**: `Record`\<`string`, `unknown`\>

Defined in: src/core/schema/types.ts:313

Node configuration

***

### id

> **id**: `string`

Defined in: src/core/schema/types.ts:309

Node identifier

***

### props?

> `optional` **props?**: `Record`\<`string`, `unknown`\>

Defined in: src/core/schema/types.ts:318

Node props (type-specific properties)

***

### type

> **type**: `string`

Defined in: src/core/schema/types.ts:311

Node type

***

### x?

> `optional` **x?**: `number`

Defined in: src/core/schema/types.ts:315

Node position (x, y coordinates for canvas)

***

### y?

> `optional` **y?**: `number`

Defined in: src/core/schema/types.ts:316
