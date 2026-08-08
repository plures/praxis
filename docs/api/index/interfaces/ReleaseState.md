[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ReleaseState

# Interface: ReleaseState

Defined in: src/lifecycle/release.ts:14

Current state of a release as it moves through the prerelease → QA → stable → published pipeline.

## Properties

### phase

> **phase**: `"prerelease"` \| `"qa"` \| `"stable"` \| `"published"`

Defined in: src/lifecycle/release.ts:16

***

### prereleaseTag?

> `optional` **prereleaseTag?**: `string`

Defined in: src/lifecycle/release.ts:17

***

### publishedTo

> **publishedTo**: `string`[]

Defined in: src/lifecycle/release.ts:19

***

### qaResult?

> `optional` **qaResult?**: `"pending"` \| `"failed"` \| `"passed"`

Defined in: src/lifecycle/release.ts:18

***

### timestamp

> **timestamp**: `number`

Defined in: src/lifecycle/release.ts:20

***

### version

> **version**: `string`

Defined in: src/lifecycle/release.ts:15
