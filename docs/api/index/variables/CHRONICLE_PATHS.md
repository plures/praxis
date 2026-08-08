[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / CHRONICLE\_PATHS

# Variable: CHRONICLE\_PATHS

> `const` **CHRONICLE\_PATHS**: `object`

Defined in: src/core/chronicle/chronicle.ts:21

Storage path constants for Chronicle data in PluresDB.

Layout:
- `/_praxis/chronos/nodes/{nodeId}` — ChronicleNode documents
- `/_praxis/chronos/edges/out/{nodeId}` — outgoing ChronicleEdge arrays
- `/_praxis/chronos/edges/in/{nodeId}` — incoming ChronicleEdge arrays
- `/_praxis/chronos/context/{contextId}` — ordered nodeId arrays per context
- `/_praxis/chronos/index` — global ordered nodeId array (for range queries)

## Type Declaration

### BASE

> `readonly` **BASE**: `"/_praxis/chronos"` = `'/_praxis/chronos'`

### CONTEXT

> `readonly` **CONTEXT**: `"/_praxis/chronos/context"` = `'/_praxis/chronos/context'`

### EDGES\_IN

> `readonly` **EDGES\_IN**: `"/_praxis/chronos/edges/in"` = `'/_praxis/chronos/edges/in'`

### EDGES\_OUT

> `readonly` **EDGES\_OUT**: `"/_praxis/chronos/edges/out"` = `'/_praxis/chronos/edges/out'`

### INDEX

> `readonly` **INDEX**: `"/_praxis/chronos/index"` = `'/_praxis/chronos/index'`

### NODES

> `readonly` **NODES**: `"/_praxis/chronos/nodes"` = `'/_praxis/chronos/nodes'`
