[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / GuardianResult

# Interface: GuardianResult

Defined in: src/integrations/code-canvas.ts:194

Guardian validation result

## Properties

### activity?

> `optional` **activity?**: [`ActivityState`](ActivityState.md)

Defined in: src/integrations/code-canvas.ts:204

Current activity state

***

### errors

> **errors**: [`GuardianError`](GuardianError.md)[]

Defined in: src/integrations/code-canvas.ts:198

Validation errors

***

### filesChecked

> **filesChecked**: `string`[]

Defined in: src/integrations/code-canvas.ts:202

Files validated

***

### valid

> **valid**: `boolean`

Defined in: src/integrations/code-canvas.ts:196

Whether validation passed

***

### warnings

> **warnings**: [`GuardianWarning`](GuardianWarning.md)[]

Defined in: src/integrations/code-canvas.ts:200

Validation warnings
