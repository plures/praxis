[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / EdgeType

# Type Alias: EdgeType

> **EdgeType** = `"causes"` \| `"context"` \| `"follows"`

Defined in: src/core/chronicle/types.ts:19

Causal relationship type between Chronicle nodes.
- `causes`: node A caused node B (explicit causal link)
- `context`: node B belongs to the same session/request as node A
- `follows`: node B happened after node A in the same context
