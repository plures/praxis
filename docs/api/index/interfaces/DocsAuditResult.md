[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DocsAuditResult

# Interface: DocsAuditResult

Defined in: src/lifecycle/docs.ts:78

Result of a docs audit

## Properties

### documents

> **documents**: [`TrackedDocument`](TrackedDocument.md)[]

Defined in: src/lifecycle/docs.ts:80

All tracked documents

***

### needsCreation

> **needsCreation**: `object`[]

Defined in: src/lifecycle/docs.ts:84

Documents that should be created

#### reason

> **reason**: `string`

#### suggestedPath

> **suggestedPath**: `string`

#### type

> **type**: [`DocumentType`](../type-aliases/DocumentType.md)

***

### needsRemoval

> **needsRemoval**: [`TrackedDocument`](TrackedDocument.md)[]

Defined in: src/lifecycle/docs.ts:86

Documents that should be removed

***

### needsUpdate

> **needsUpdate**: [`TrackedDocument`](TrackedDocument.md)[]

Defined in: src/lifecycle/docs.ts:82

Documents that need updates

***

### summary

> **summary**: `object`

Defined in: src/lifecycle/docs.ts:88

Summary

#### current

> **current**: `number`

#### missing

> **missing**: `number`

#### orphaned

> **orphaned**: `number`

#### stale

> **stale**: `number`

#### total

> **total**: `number`
