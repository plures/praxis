[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ClassificationResult

# Interface: ClassificationResult

Defined in: src/lifecycle/types.ts:205

Result of classifying an expectation

## Properties

### confidence

> **confidence**: `number`

Defined in: src/lifecycle/types.ts:209

Confidence (0-1)

***

### reason

> **reason**: `string`

Defined in: src/lifecycle/types.ts:211

Reasoning

***

### suggestedLabels?

> `optional` **suggestedLabels?**: `string`[]

Defined in: src/lifecycle/types.ts:215

Suggested labels

***

### suggestedPriority?

> `optional` **suggestedPriority?**: [`ExpectationPriority`](../type-aliases/ExpectationPriority.md)

Defined in: src/lifecycle/types.ts:213

Suggested priority adjustment

***

### type

> **type**: [`ExpectationType`](../type-aliases/ExpectationType.md)

Defined in: src/lifecycle/types.ts:207

Determined type
