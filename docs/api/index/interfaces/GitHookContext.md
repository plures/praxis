[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / GitHookContext

# Interface: GitHookContext

Defined in: src/hooks/types.ts:23

Context gathered from git state when a hook fires.
This is the "event" that Praxis reacts to.

## Properties

### branch

> **branch**: `string`

Defined in: src/hooks/types.ts:27

Current branch name

***

### commitMessage?

> `optional` **commitMessage?**: `string`

Defined in: src/hooks/types.ts:37

Commit message (for commit-msg, post-commit)

***

### commitSha?

> `optional` **commitSha?**: `string`

Defined in: src/hooks/types.ts:39

Commit SHA (for post-commit)

***

### diffStats

> **diffStats**: [`DiffStat`](DiffStat.md)[]

Defined in: src/hooks/types.ts:31

Changed files with diff stats

***

### hook

> **hook**: [`GitHookName`](../type-aliases/GitHookName.md)

Defined in: src/hooks/types.ts:25

Which hook fired

***

### isBranchSwitch?

> `optional` **isBranchSwitch?**: `boolean`

Defined in: src/hooks/types.ts:49

Whether checkout was branch switch (for post-checkout)

***

### linesAdded

> **linesAdded**: `number`

Defined in: src/hooks/types.ts:33

Total lines added

***

### linesRemoved

> **linesRemoved**: `number`

Defined in: src/hooks/types.ts:35

Total lines removed

***

### newHead?

> `optional` **newHead?**: `string`

Defined in: src/hooks/types.ts:47

New HEAD (for post-checkout)

***

### previousHead?

> `optional` **previousHead?**: `string`

Defined in: src/hooks/types.ts:45

Previous HEAD (for post-checkout, post-merge)

***

### remote?

> `optional` **remote?**: `string`

Defined in: src/hooks/types.ts:41

Remote name (for pre-push)

***

### remoteUrl?

> `optional` **remoteUrl?**: `string`

Defined in: src/hooks/types.ts:43

Remote URL (for pre-push)

***

### repoRoot

> **repoRoot**: `string`

Defined in: src/hooks/types.ts:51

Repository root path

***

### stagedFiles

> **stagedFiles**: `string`[]

Defined in: src/hooks/types.ts:29

Staged files (for pre-commit)

***

### timestamp

> **timestamp**: `number`

Defined in: src/hooks/types.ts:53

Timestamp when hook fired
