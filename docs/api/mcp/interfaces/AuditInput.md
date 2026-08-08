[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [mcp](../README.md) / AuditInput

# Interface: AuditInput

Defined in: src/mcp/types.ts:31

Input for the `audit` MCP tool — check completeness against a manifest.

## Properties

### manifest

> **manifest**: `object`

Defined in: src/mcp/types.ts:33

Completeness manifest

#### branches

> **branches**: [`LogicBranch`](../../index/interfaces/LogicBranch.md)[]

#### rulesNeedingContracts

> **rulesNeedingContracts**: `string`[]

#### stateFields

> **stateFields**: [`StateField`](../../index/interfaces/StateField.md)[]

#### transitions

> **transitions**: [`StateTransition`](../../index/interfaces/StateTransition.md)[]

***

### threshold?

> `optional` **threshold?**: `number`

Defined in: src/mcp/types.ts:40

Minimum passing score (default: 90)
