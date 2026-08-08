[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / buildHookContext

# Function: buildHookContext()

> **buildHookContext**(`hook`, `args?`): [`GitHookContext`](../interfaces/GitHookContext.md)

Defined in: src/hooks/context.ts:77

Build a GitHookContext from the current git state and hook arguments.

Each hook type gathers slightly different context:
- pre-commit: staged files, diff stats
- commit-msg: staged files, commit message from file arg
- post-commit: committed files, commit SHA, commit message
- pre-push: remote info, commits being pushed
- post-merge: merged files
- post-checkout: old/new HEAD, branch switch flag

## Parameters

### hook

[`GitHookName`](../type-aliases/GitHookName.md)

The git hook name (e.g. `'pre-commit'`, `'post-commit'`)

### args?

`string`[] = `[]`

Arguments passed by git to the hook script (defaults to `[]`)

## Returns

[`GitHookContext`](../interfaces/GitHookContext.md)

A populated [GitHookContext](../interfaces/GitHookContext.md) for the given hook and git state
