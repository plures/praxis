[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ChronosSearchParams

# Interface: ChronosSearchParams

Defined in: src/core/chronicle/mcp.ts:37

Parameters for the `chronos.search` MCP tool.

## Properties

### contextId?

> `optional` **contextId?**: `string`

Defined in: src/core/chronicle/mcp.ts:41

Optional context ID — restricts search to a single session/request subgraph

***

### limit?

> `optional` **limit?**: `number`

Defined in: src/core/chronicle/mcp.ts:47

Maximum number of results (default: no limit)

***

### query

> **query**: `string`

Defined in: src/core/chronicle/mcp.ts:39

Search query matched against node paths, metadata, and serialised payloads

***

### since?

> `optional` **since?**: `number`

Defined in: src/core/chronicle/mcp.ts:43

Inclusive start timestamp in ms (default: 0)

***

### until?

> `optional` **until?**: `number`

Defined in: src/core/chronicle/mcp.ts:45

Inclusive end timestamp in ms (default: now)
