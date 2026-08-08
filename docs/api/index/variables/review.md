[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / review

# Variable: review

> `const` **review**: `object`

Defined in: src/lifecycle/review.ts:49

Built-in trigger actions for the review lifecycle phase (CI gating, requesting reviews, and re-review cycles).

## Type Declaration

### autoApplyRecommendations()

> **autoApplyRecommendations**(`opts?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Auto-apply review recommendations (via Copilot or agent).

#### Parameters

##### opts?

###### maxRounds?

`number`

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### mergeGate()

> **mergeGate**(`conditions?`): [`TriggerAction`](../interfaces/TriggerAction.md)

Merge gate — checks all conditions before allowing merge.

#### Parameters

##### conditions?

`string`[]

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### requireCI()

> **requireCI**(): [`TriggerAction`](../interfaces/TriggerAction.md)

Gate that requires all CI checks to pass before review.

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)
