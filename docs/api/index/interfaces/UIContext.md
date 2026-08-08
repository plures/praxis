[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / UIContext

# Interface: UIContext

Defined in: packages/praxis-core/src/ui-rules.ts:26

Standard UI state fields that UI rules can read from context.
Apps extend their context with these fields to enable UI rules.

## Properties

### activePanel?

> `optional` **activePanel?**: `string` \| `null`

Defined in: packages/praxis-core/src/ui-rules.ts:44

Active panel/tab name

***

### dirty?

> `optional` **dirty?**: `boolean`

Defined in: packages/praxis-core/src/ui-rules.ts:34

Whether there are unsaved changes

***

### error?

> `optional` **error?**: `string` \| `null`

Defined in: packages/praxis-core/src/ui-rules.ts:30

Current error message, if any

***

### initialized?

> `optional` **initialized?**: `boolean`

Defined in: packages/praxis-core/src/ui-rules.ts:38

Whether the app has completed initialization

***

### loading?

> `optional` **loading?**: `boolean`

Defined in: packages/praxis-core/src/ui-rules.ts:28

Whether the app is currently loading data

***

### modalOpen?

> `optional` **modalOpen?**: `boolean`

Defined in: packages/praxis-core/src/ui-rules.ts:42

Whether a modal/dialog is currently open

***

### offline?

> `optional` **offline?**: `boolean`

Defined in: packages/praxis-core/src/ui-rules.ts:32

Whether the app is in offline mode

***

### route?

> `optional` **route?**: `string`

Defined in: packages/praxis-core/src/ui-rules.ts:36

Current route/view name

***

### viewport?

> `optional` **viewport?**: `"mobile"` \| `"tablet"` \| `"desktop"`

Defined in: packages/praxis-core/src/ui-rules.ts:40

Screen width category: 'mobile' | 'tablet' | 'desktop'
