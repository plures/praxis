[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / LifecycleExpectation

# Interface: LifecycleExpectation

Defined in: src/lifecycle/types.ts:24

Lifecycle expectation — the single entry point for all work

## Properties

### acceptance

> **acceptance**: `string`[]

Defined in: src/lifecycle/types.ts:36

Acceptance criteria — Given/When/Then or plain strings

***

### breaking?

> `optional` **breaking?**: `boolean`

Defined in: src/lifecycle/types.ts:38

Breaking change? Forces major version bump

***

### description

> **description**: `string`

Defined in: src/lifecycle/types.ts:32

Detailed description

***

### id

> **id**: `string`

Defined in: src/lifecycle/types.ts:26

Unique ID (e.g., 'user-auth-flow')

***

### labels?

> `optional` **labels?**: `string`[]

Defined in: src/lifecycle/types.ts:40

Labels for categorization

***

### meta?

> `optional` **meta?**: `Record`\<`string`, `unknown`\>

Defined in: src/lifecycle/types.ts:44

Metadata (extensible)

***

### priority

> **priority**: [`ExpectationPriority`](../type-aliases/ExpectationPriority.md)

Defined in: src/lifecycle/types.ts:34

Priority

***

### related?

> `optional` **related?**: `string`[]

Defined in: src/lifecycle/types.ts:42

Related expectation IDs

***

### title

> **title**: `string`

Defined in: src/lifecycle/types.ts:30

Human-readable title

***

### type

> **type**: [`ExpectationType`](../type-aliases/ExpectationType.md)

Defined in: src/lifecycle/types.ts:28

What kind of work this is
