[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [mcp](../README.md) / PraxisMcpServerOptions

# Interface: PraxisMcpServerOptions\<TContext\>

Defined in: src/mcp/types.ts:168

Options for creating a Praxis MCP server.

## Type Parameters

### TContext

`TContext` = `unknown`

## Properties

### initialContext

> **initialContext**: `TContext`

Defined in: src/mcp/types.ts:174

Initial context for the engine

***

### initialFacts?

> `optional` **initialFacts?**: [`PraxisFact`](../../index/interfaces/PraxisFact.md)[]

Defined in: src/mcp/types.ts:178

Initial facts

***

### name?

> `optional` **name?**: `string`

Defined in: src/mcp/types.ts:170

Name for the MCP server

***

### registry

> **registry**: [`PraxisRegistry`](../../index/classes/PraxisRegistry.md)\<`TContext`\>

Defined in: src/mcp/types.ts:176

Pre-configured registry (rules + constraints already registered)

***

### version?

> `optional` **version?**: `string`

Defined in: src/mcp/types.ts:172

Version string
