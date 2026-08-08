[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ChronosTraceParams

# Interface: ChronosTraceParams

Defined in: src/core/chronicle/mcp.ts:25

Parameters for the `chronos.trace` MCP tool.

## Properties

### direction?

> `optional` **direction?**: [`TraceDirection`](../type-aliases/TraceDirection.md)

Defined in: src/core/chronicle/mcp.ts:29

Direction to traverse the causal graph (default: `'backward'`)

***

### maxDepth?

> `optional` **maxDepth?**: `number`

Defined in: src/core/chronicle/mcp.ts:31

Maximum traversal depth (default: 10)

***

### nodeId

> **nodeId**: `string`

Defined in: src/core/chronicle/mcp.ts:27

ID of the Chronicle node to start tracing from
