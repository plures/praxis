[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisHooksConfig

# Interface: PraxisHooksConfig

Defined in: src/hooks/types.ts:92

Configuration for the Praxis git hooks integration.

## Properties

### autoPush?

> `optional` **autoPush?**: `boolean`

Defined in: src/hooks/types.ts:98

Auto-push after commit

***

### autoPushRemote?

> `optional` **autoPushRemote?**: `string`

Defined in: src/hooks/types.ts:100

Auto-push remote (default: 'origin')

***

### branchPattern?

> `optional` **branchPattern?**: `string`

Defined in: src/hooks/types.ts:104

Branch naming pattern

***

### commitPattern?

> `optional` **commitPattern?**: `string`

Defined in: src/hooks/types.ts:102

Commit message validation pattern

***

### hooks

> **hooks**: [`GitHookName`](../type-aliases/GitHookName.md)[]

Defined in: src/hooks/types.ts:94

Which hooks to install

***

### meaningfulPaths?

> `optional` **meaningfulPaths?**: `string`[]

Defined in: src/hooks/types.ts:106

Paths that trigger "meaningful work" detection

***

### meaningfulThreshold?

> `optional` **meaningfulThreshold?**: `number`

Defined in: src/hooks/types.ts:108

Minimum lines changed to count as "meaningful"

***

### rules?

> `optional` **rules?**: `string`[]

Defined in: src/hooks/types.ts:96

Rules to evaluate (loaded from config)
