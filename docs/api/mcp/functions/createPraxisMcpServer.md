[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [mcp](../README.md) / createPraxisMcpServer

# Function: createPraxisMcpServer()

> **createPraxisMcpServer**\<`TContext`\>(`options`): `object`

Defined in: src/mcp/server.ts:60

Create a Praxis MCP server with all tools registered.

## Type Parameters

### TContext

`TContext` = `unknown`

## Parameters

### options

[`PraxisMcpServerOptions`](../interfaces/PraxisMcpServerOptions.md)\<`TContext`\>

## Returns

### engine

> **engine**: [`LogicEngine`](../../index/classes/LogicEngine.md)\<`TContext`\>

The underlying Praxis engine

### mcpServer

> **mcpServer**: `McpServer` = `server`

The underlying MCP server instance

### start()

> **start**(): `Promise`\<`void`\>

Start the server on stdio transport

#### Returns

`Promise`\<`void`\>

## Example

```ts
import { createPraxisMcpServer } from '@plures/praxis/mcp';
import { PraxisRegistry } from '@plures/praxis';

const registry = new PraxisRegistry();
// ... register rules ...

const server = createPraxisMcpServer({
  initialContext: {},
  registry,
});

// Start via stdio for CLI usage
await server.start();

// Or use the McpServer instance directly
const mcpServer = server.mcpServer;
```
