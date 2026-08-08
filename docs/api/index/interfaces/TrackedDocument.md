[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / TrackedDocument

# Interface: TrackedDocument

Defined in: src/lifecycle/docs.ts:26

A document tracked by the technical writer

## Properties

### covers

> **covers**: `string`[]

Defined in: src/lifecycle/docs.ts:32

What this document covers

***

### lastUpdated?

> `optional` **lastUpdated?**: `number`

Defined in: src/lifecycle/docs.ts:36

Last updated timestamp (from git)

***

### path

> **path**: `string`

Defined in: src/lifecycle/docs.ts:28

Path relative to repo root

***

### reason?

> `optional` **reason?**: `string`

Defined in: src/lifecycle/docs.ts:38

Reason for status

***

### status

> **status**: `"current"` \| `"stale"` \| `"missing"` \| `"orphaned"`

Defined in: src/lifecycle/docs.ts:34

Current status

***

### type

> **type**: [`DocumentType`](../type-aliases/DocumentType.md)

Defined in: src/lifecycle/docs.ts:30

Document type
