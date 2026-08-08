[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ChronosMcpTools

# Interface: ChronosMcpTools

Defined in: src/core/chronicle/mcp.ts:65

Chronos MCP tools bound to a Chronicle instance.

## Methods

### search()

> **search**(`params`): `Promise`\<[`McpToolResult`](McpToolResult.md)\<[`ChronicleNode`](ChronicleNode.md)[]\>\>

Defined in: src/core/chronicle/mcp.ts:74

`chronos.search` — search Chronicle nodes by path, metadata, or payload content.

#### Parameters

##### params

[`ChronosSearchParams`](ChronosSearchParams.md)

#### Returns

`Promise`\<[`McpToolResult`](McpToolResult.md)\<[`ChronicleNode`](ChronicleNode.md)[]\>\>

***

### trace()

> **trace**(`params`): `Promise`\<[`McpToolResult`](McpToolResult.md)\<[`ChronicleNode`](ChronicleNode.md)[]\>\>

Defined in: src/core/chronicle/mcp.ts:69

`chronos.trace` — trace causality backward/forward from a Chronicle node.

#### Parameters

##### params

[`ChronosTraceParams`](ChronosTraceParams.md)

#### Returns

`Promise`\<[`McpToolResult`](McpToolResult.md)\<[`ChronicleNode`](ChronicleNode.md)[]\>\>
