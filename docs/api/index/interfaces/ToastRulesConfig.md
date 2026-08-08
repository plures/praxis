[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ToastRulesConfig

# Interface: ToastRulesConfig

Defined in: src/factory/types.ts:27

Configuration for the pre-built toast notification rule module.

## Properties

### autoDismissMs?

> `optional` **autoDismissMs?**: `number`

Defined in: src/factory/types.ts:31

Auto-dismiss after N milliseconds (0 = no auto-dismiss)

***

### deduplicate?

> `optional` **deduplicate?**: `boolean`

Defined in: src/factory/types.ts:33

Prevent duplicate toasts with same message

***

### requireDiff?

> `optional` **requireDiff?**: `boolean`

Defined in: src/factory/types.ts:29

Only show toast if there's a meaningful diff
