[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ReviewCycleState

# Interface: ReviewCycleState

Defined in: src/lifecycle/review.ts:38

Tracks the state of a review-implement-re-review cycle for a pull request across multiple rounds.

## Properties

### comments

> **comments**: [`ReviewComment`](ReviewComment.md)[]

Defined in: src/lifecycle/review.ts:43

***

### maxRounds

> **maxRounds**: `number`

Defined in: src/lifecycle/review.ts:41

***

### prNumber

> **prNumber**: `string` \| `number`

Defined in: src/lifecycle/review.ts:39

***

### round

> **round**: `number`

Defined in: src/lifecycle/review.ts:40

***

### status

> **status**: `"approved"` \| `"pending-review"` \| `"changes-requested"` \| `"changes-applied"` \| `"max-rounds-exceeded"`

Defined in: src/lifecycle/review.ts:42
