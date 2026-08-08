[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / SandboxConfig

# Interface: SandboxConfig

Defined in: src/experiments/index.ts:152

Isolation and resource limits for the experiment sandbox.

## Properties

### fileSystemWrites

> **fileSystemWrites**: `boolean`

Defined in: src/experiments/index.ts:158

Allow file system writes?

***

### isolation

> **isolation**: `"none"` \| `"full"` \| `"shared-read"`

Defined in: src/experiments/index.ts:154

Isolation level

***

### maxExecutionMs

> **maxExecutionMs**: `number`

Defined in: src/experiments/index.ts:162

Max execution time (ms)

***

### maxMemoryBytes

> **maxMemoryBytes**: `number`

Defined in: src/experiments/index.ts:160

Max memory (bytes)

***

### networkAccess

> **networkAccess**: `boolean`

Defined in: src/experiments/index.ts:156

Allow network access?

***

### snapshotProductionState

> **snapshotProductionState**: `boolean`

Defined in: src/experiments/index.ts:164

Snapshot production state for the sandbox?
