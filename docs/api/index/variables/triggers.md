[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / triggers

# Variable: triggers

> `const` **triggers**: `object`

Defined in: src/lifecycle/triggers.ts:355

All built-in trigger adapters

## Type Declaration

### consoleLog

> **consoleLog**: (`prefix?`) => [`TriggerAction`](../interfaces/TriggerAction.md)

Log the event to console — useful for debugging and dry runs

#### Parameters

##### prefix?

`string`

Optional prefix string or emoji to prepend to each log message

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

A [TriggerAction](../interfaces/TriggerAction.md) that logs lifecycle events to the console

### custom

> **custom**: (`id`, `fn`) => [`TriggerAction`](../interfaces/TriggerAction.md)

Execute an arbitrary async function

#### Parameters

##### id

`string`

##### fn

(`event`, `ctx`) => `Promise`\<[`TriggerResult`](../interfaces/TriggerResult.md)\>

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### expectations

> **expectations**: `object`

Expectations trigger adapter for creating new lifecycle expectations derived from QA results or other sources.

#### expectations.createFromQAResults()

> **createFromQAResults**(): [`TriggerAction`](../interfaces/TriggerAction.md)

Create new expectations from QA results

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### github

> **github**: `object`

GitHub trigger adapter for creating issues, branches, and requesting reviews via the GitHub API.

#### github.createBranch()

> **createBranch**(`options`): [`TriggerAction`](../interfaces/TriggerAction.md)

Create a branch for development work

##### Parameters

###### options

`GitHubTriggerOptions` & `object`

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

#### github.createIssue()

> **createIssue**(`options`): [`TriggerAction`](../interfaces/TriggerAction.md)

Create a GitHub issue from an expectation

##### Parameters

###### options

`GitHubTriggerOptions` & `object`

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

#### github.requestReview()

> **requestReview**(`options`): [`TriggerAction`](../interfaces/TriggerAction.md)

Request a review on a PR

##### Parameters

###### options

`GitHubTriggerOptions` & `object`

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### registry

> **registry**: `object`

Registry trigger adapter for publishing prerelease and stable packages to npm or other registries.

#### registry.publishPrerelease()

> **publishPrerelease**(`options`): [`TriggerAction`](../interfaces/TriggerAction.md)

Publish to package registries

##### Parameters

###### options

`RegistryPublishOptions`

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

#### registry.publishStable()

> **publishStable**(`options`): [`TriggerAction`](../interfaces/TriggerAction.md)

Publish stable to package registries

##### Parameters

###### options

`RegistryPublishOptions`

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### release

> **release**: `object`

Release trigger adapter for creating prerelease and stable git tags and promoting releases through the pipeline.

#### release.promoteToStable()

> **promoteToStable**(): [`TriggerAction`](../interfaces/TriggerAction.md)

Promote prerelease to stable

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

#### release.tagPrerelease()

> **tagPrerelease**(`options?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Tag a prerelease

##### Parameters

###### options?

###### tag?

`string`

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### version

> **version**: `object`

Version trigger adapter for calculating semver bumps and syncing version strings across project files.

#### version.bumpSemver()

> **bumpSemver**(`options?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Calculate and bump semver based on expectations

##### Parameters

###### options?

###### strategy?

`"conventional"` \| `"expectation-driven"`

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

#### version.syncFiles()

> **syncFiles**(`files?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Sync version across multiple files

##### Parameters

###### files?

`string`[]

##### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)
