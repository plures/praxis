[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ActivityState

# Interface: ActivityState

Defined in: src/integrations/code-canvas.ts:160

Activity tracking for current work context

## Properties

### activity

> **activity**: `"designing"` \| `"implementing"` \| `"testing"` \| `"documenting"` \| `"reviewing"`

Defined in: src/integrations/code-canvas.ts:162

Current activity type

***

### actor

> **actor**: `string`

Defined in: src/integrations/code-canvas.ts:164

Actor performing the activity

***

### allowedPaths?

> `optional` **allowedPaths?**: `string`[]

Defined in: src/integrations/code-canvas.ts:170

Allowed file patterns for this activity

***

### intent?

> `optional` **intent?**: `string`

Defined in: src/integrations/code-canvas.ts:166

Current intent/goal

***

### startedAt

> **startedAt**: `number`

Defined in: src/integrations/code-canvas.ts:168

Started timestamp
