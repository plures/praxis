[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / McpToolResult

# Interface: McpToolResult\<T\>

Defined in: src/core/chronicle/mcp.ts:53

Uniform result envelope for MCP tool calls.

## Type Parameters

### T

`T`

## Properties

### data?

> `optional` **data?**: `T`

Defined in: src/core/chronicle/mcp.ts:57

Returned data (present on success)

***

### error?

> `optional` **error?**: `string`

Defined in: src/core/chronicle/mcp.ts:59

Error message (present on failure)

***

### success

> **success**: `boolean`

Defined in: src/core/chronicle/mcp.ts:55

Whether the tool call succeeded
