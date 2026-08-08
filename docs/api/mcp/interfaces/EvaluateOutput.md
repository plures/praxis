[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [mcp](../README.md) / EvaluateOutput

# Interface: EvaluateOutput

Defined in: src/mcp/types.ts:109

Output of the `evaluate` MCP tool — result of running a single rule.

## Properties

### diagnostics

> **diagnostics**: [`PraxisDiagnostics`](../../index/interfaces/PraxisDiagnostics.md)[]

Defined in: src/mcp/types.ts:115

***

### facts

> **facts**: [`PraxisFact`](../../index/interfaces/PraxisFact.md)[]

Defined in: src/mcp/types.ts:112

***

### reason?

> `optional` **reason?**: `string`

Defined in: src/mcp/types.ts:114

***

### resultKind

> **resultKind**: `"emit"` \| `"noop"` \| `"skip"` \| `"retract"`

Defined in: src/mcp/types.ts:111

***

### retractedTags

> **retractedTags**: `string`[]

Defined in: src/mcp/types.ts:113

***

### ruleId

> **ruleId**: `string`

Defined in: src/mcp/types.ts:110
