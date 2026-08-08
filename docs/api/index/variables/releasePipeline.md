[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / releasePipeline

# Variable: releasePipeline

> `const` **releasePipeline**: `object`

Defined in: src/lifecycle/release.ts:26

Built-in trigger actions for the release lifecycle phase (git tagging, QA gating, and stable promotion).

## Type Declaration

### githubRelease()

> **githubRelease**(`opts?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Create a GitHub release from a tag.

#### Parameters

##### opts?

###### draft?

`boolean`

###### prerelease?

`boolean`

###### repo?

`string`

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### gitTag()

> **gitTag**(`opts?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Create a git tag for a release.

#### Parameters

##### opts?

###### push?

`boolean`

###### sign?

`boolean`

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### notify()

> **notify**(`channel?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Notify on release (extensible — console by default).

#### Parameters

##### channel?

`string`

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### npmPublish()

> **npmPublish**(`opts?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Publish to npm registry.

#### Parameters

##### opts?

###### access?

`"public"` \| `"restricted"`

###### tag?

`string`

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### qaGate()

> **qaGate**(): [`TriggerAction`](../interfaces/TriggerAction.md)

QA gate — checks QA results before allowing stable release.

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)
