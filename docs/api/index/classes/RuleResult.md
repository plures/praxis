[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / RuleResult

# Class: RuleResult

Defined in: packages/praxis-core/src/rule-result.ts:20

The result of evaluating a rule. Every rule MUST return one of:
- `RuleResult.emit(facts)` — rule produced facts
- `RuleResult.noop(reason?)` — rule evaluated but had nothing to say
- `RuleResult.skip(reason?)` — rule decided to skip (preconditions not met)
- `RuleResult.retract(tags)` — rule retracts previously emitted facts

## Properties

### facts

> `readonly` **facts**: [`PraxisFact`](../interfaces/PraxisFact.md)[]

Defined in: packages/praxis-core/src/rule-result.ts:24

Facts produced (only for 'emit')

***

### kind

> `readonly` **kind**: `"emit"` \| `"noop"` \| `"skip"` \| `"retract"`

Defined in: packages/praxis-core/src/rule-result.ts:22

The kind of result

***

### reason?

> `readonly` `optional` **reason?**: `string`

Defined in: packages/praxis-core/src/rule-result.ts:28

Optional reason (for noop/skip/retract — useful for debugging)

***

### retractTags

> `readonly` **retractTags**: `string`[]

Defined in: packages/praxis-core/src/rule-result.ts:26

Fact tags to retract (only for 'retract')

***

### ruleId?

> `optional` **ruleId?**: `string`

Defined in: packages/praxis-core/src/rule-result.ts:30

The rule ID that produced this result (set by engine)

## Accessors

### hasFacts

#### Get Signature

> **get** **hasFacts**(): `boolean`

Defined in: packages/praxis-core/src/rule-result.ts:106

Whether this result produced facts

##### Returns

`boolean`

***

### hasRetractions

#### Get Signature

> **get** **hasRetractions**(): `boolean`

Defined in: packages/praxis-core/src/rule-result.ts:111

Whether this result retracts facts

##### Returns

`boolean`

## Methods

### emit()

> `static` **emit**(`facts`): `RuleResult`

Defined in: packages/praxis-core/src/rule-result.ts:52

Rule produced facts.

#### Parameters

##### facts

[`PraxisFact`](../interfaces/PraxisFact.md)[]

#### Returns

`RuleResult`

#### Example

```ts
return RuleResult.emit([
  { tag: 'sprint.behind', payload: { deficit: 5 } }
]);
```

***

### noop()

> `static` **noop**(`reason?`): `RuleResult`

Defined in: packages/praxis-core/src/rule-result.ts:71

Rule evaluated but had nothing to report.
Unlike returning [], this is explicit and traceable.

#### Parameters

##### reason?

`string`

#### Returns

`RuleResult`

#### Example

```ts
if (ctx.completedHours >= expectedHours) {
  return RuleResult.noop('Sprint is on pace');
}
```

***

### retract()

> `static` **retract**(`tags`, `reason?`): `RuleResult`

Defined in: packages/praxis-core/src/rule-result.ts:98

Rule retracts previously emitted facts by tag.
Used when a condition that previously produced facts is no longer true.

#### Parameters

##### tags

`string`[]

##### reason?

`string`

#### Returns

`RuleResult`

#### Example

```ts
// Sprint was behind, but caught up
if (ctx.completedHours >= expectedHours) {
  return RuleResult.retract(['sprint.behind'], 'Sprint caught up');
}
```

***

### skip()

> `static` **skip**(`reason?`): `RuleResult`

Defined in: packages/praxis-core/src/rule-result.ts:84

Rule decided to skip because preconditions were not met.
Distinct from noop: skip means "I can't evaluate", noop means "I evaluated and found nothing".

#### Parameters

##### reason?

`string`

#### Returns

`RuleResult`

#### Example

```ts
if (!ctx.sprintName) {
  return RuleResult.skip('No active sprint');
}
```
