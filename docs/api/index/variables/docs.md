[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / docs

# Variable: docs

> `const` **docs**: `object`

Defined in: src/lifecycle/docs.ts:437

Built-in trigger actions for the documentation lifecycle phase (auditing, updating, and validating project docs).

## Type Declaration

### audit()

> **audit**(`config`): [`TriggerAction`](../interfaces/TriggerAction.md)

Audit documentation and report status.

#### Parameters

##### config

[`DocsConfig`](../interfaces/DocsConfig.md)

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### gate()

> **gate**(): [`TriggerAction`](../interfaces/TriggerAction.md)

Gate: docs must be updated before QA can proceed.

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### plan()

> **plan**(`config`): [`TriggerAction`](../interfaces/TriggerAction.md)

Plan documentation updates based on code changes.

#### Parameters

##### config

[`DocsConfig`](../interfaces/DocsConfig.md)

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### validate()

> **validate**(`config`): [`TriggerAction`](../interfaces/TriggerAction.md)

Validate all docs against templates.

#### Parameters

##### config

[`DocsConfig`](../interfaces/DocsConfig.md)

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)
