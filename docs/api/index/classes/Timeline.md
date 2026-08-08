[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / Timeline

# Class: Timeline

Defined in: src/chronos/timeline.ts:50

Queryable timeline wrapping a ProjectChronicle.

All query methods return new arrays — never the internal event store.

## Constructors

### Constructor

> **new Timeline**(`chronicle`): `Timeline`

Defined in: src/chronos/timeline.ts:51

#### Parameters

##### chronicle

[`ProjectChronicle`](ProjectChronicle.md)

#### Returns

`Timeline`

## Methods

### getDelta()

> **getDelta**(`from`, `to`): [`BehavioralDelta`](../interfaces/BehavioralDelta.md)

Defined in: src/chronos/timeline.ts:76

Compute a behavioral delta between two timestamps.

#### Parameters

##### from

`number`

##### to

`number`

#### Returns

[`BehavioralDelta`](../interfaces/BehavioralDelta.md)

***

### getEventsSince()

> **getEventsSince**(`timestamp`): [`ProjectEvent`](../interfaces/ProjectEvent.md)[]

Defined in: src/chronos/timeline.ts:69

Get all events since a timestamp (inclusive).

#### Parameters

##### timestamp

`number`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)[]

***

### getHistory()

> **getHistory**(`subjectId`): [`ProjectEvent`](../interfaces/ProjectEvent.md)[]

Defined in: src/chronos/timeline.ts:85

Get full history for a specific subject (rule id, gate name, etc.).
Sorted chronologically.

#### Parameters

##### subjectId

`string`

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)[]

***

### getTimeline()

> **getTimeline**(`filter?`): [`ProjectEvent`](../interfaces/ProjectEvent.md)[]

Defined in: src/chronos/timeline.ts:59

Query events with optional filtering.
Returns matching events sorted chronologically (oldest first).

#### Parameters

##### filter?

[`TimelineFilter`](../interfaces/TimelineFilter.md)

#### Returns

[`ProjectEvent`](../interfaces/ProjectEvent.md)[]
