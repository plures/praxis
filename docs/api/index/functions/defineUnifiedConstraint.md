[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineUnifiedConstraint

# Function: defineUnifiedConstraint()

> **defineUnifiedConstraint**(`constraint`): [`UnifiedConstraint`](../interfaces/UnifiedConstraint.md)

Defined in: src/unified/rules.ts:56

Define a constraint that validates mutations before they're applied.

## Parameters

### constraint

[`UnifiedConstraint`](../interfaces/UnifiedConstraint.md)

The constraint descriptor with `id`, `description`, `watch`, and `validate`

## Returns

[`UnifiedConstraint`](../interfaces/UnifiedConstraint.md)

The constraint descriptor unchanged (identity function — used for type inference)

## Example

```ts
const noCloseWithoutHours = defineConstraint({
  id: 'no-close-without-hours',
  description: 'Cannot close a work item with 0 completed hours',
  watch: ['sprint/items'],
  validate: (values) => {
    const items = values['sprint/items'] ?? [];
    const bad = items.find(i => i.state === 'Closed' && !i.completedWork);
    if (bad) return `Item #${bad.id} cannot be closed with 0 hours`;
    return true;
  }
});
```
