[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineUnifiedRule

# Function: defineUnifiedRule()

> **defineUnifiedRule**(`rule`): [`UnifiedRule`](../interfaces/UnifiedRule.md)

Defined in: src/unified/rules.ts:33

Define a rule that watches graph paths and auto-evaluates.

## Parameters

### rule

[`UnifiedRule`](../interfaces/UnifiedRule.md)

The unified rule descriptor with `id`, `watch`, `description`, and `evaluate`

## Returns

[`UnifiedRule`](../interfaces/UnifiedRule.md)

The rule descriptor unchanged (identity function — used for type inference)

## Example

```ts
const sprintBehind = defineRule({
  id: 'sprint.behind',
  watch: ['sprint/current'],
  evaluate: (values) => {
    const sprint = values['sprint/current'];
    if (!sprint) return RuleResult.skip('No sprint');
    const pace = sprint.currentDay / sprint.totalDays;
    const work = sprint.completedHours / sprint.totalHours;
    if (work >= pace) return RuleResult.retract(['sprint.behind']);
    return RuleResult.emit([fact('sprint.behind', { pace, work })]);
  }
});
```
