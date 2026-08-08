[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Candidate

# Interface: Candidate

Defined in: src/conversations/types.ts:73

A candidate work item (issue, PR, doc update) derived from a conversation.

## Properties

### body

> **body**: `string`

Defined in: src/conversations/types.ts:78

***

### conversationId

> **conversationId**: `string`

Defined in: src/conversations/types.ts:75

***

### emissionResult?

> `optional` **emissionResult?**: `EmissionResult`

Defined in: src/conversations/types.ts:82

***

### emitted?

> `optional` **emitted?**: `boolean`

Defined in: src/conversations/types.ts:81

***

### gateStatus?

> `optional` **gateStatus?**: `GateStatus`

Defined in: src/conversations/types.ts:80

***

### id

> **id**: `string`

Defined in: src/conversations/types.ts:74

***

### metadata

> **metadata**: `CandidateMetadata`

Defined in: src/conversations/types.ts:79

***

### title

> **title**: `string`

Defined in: src/conversations/types.ts:77

***

### type

> **type**: `"github-issue"` \| `"github-pr"` \| `"documentation"` \| `"feature-request"` \| `"bug-report"`

Defined in: src/conversations/types.ts:76
