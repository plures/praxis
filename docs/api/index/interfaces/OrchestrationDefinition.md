[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / OrchestrationDefinition

# Interface: OrchestrationDefinition

Defined in: src/core/schema/types.ts:293

Orchestration definition

## Properties

### health?

> `optional` **health?**: `HealthDefinition`

Defined in: src/core/schema/types.ts:301

Health checks

***

### nodes?

> `optional` **nodes?**: [`NodeDefinition`](NodeDefinition.md)[]

Defined in: src/core/schema/types.ts:297

Node configurations

***

### sync?

> `optional` **sync?**: `SyncDefinition`

Defined in: src/core/schema/types.ts:299

State synchronization

***

### type

> **type**: `"dsc"` \| `"mcp"` \| `"custom"`

Defined in: src/core/schema/types.ts:295

Orchestration type
