[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / BehaviorLedger

# Class: BehaviorLedger

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:37

Immutable, append-only behavior ledger.

## Constructors

### Constructor

> **new BehaviorLedger**(): `BehaviorLedger`

#### Returns

`BehaviorLedger`

## Methods

### append()

> **append**(`entry`): `void`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:47

Append a new entry to the ledger.

#### Parameters

##### entry

[`LedgerEntry`](../interfaces/LedgerEntry.md)

The entry to append

#### Returns

`void`

#### Throws

Error if entry ID already exists

***

### findAssumptionsByImpact()

> **findAssumptionsByImpact**(`impactType`): [`Assumption`](../interfaces/Assumption.md)[]

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:153

Find assumptions that impact a specific artifact type.

#### Parameters

##### impactType

`"tests"` \| `"spec"` \| `"code"`

The artifact type ('spec', 'tests', 'code')

#### Returns

[`Assumption`](../interfaces/Assumption.md)[]

Array of assumptions

***

### getActiveAssumptions()

> **getActiveAssumptions**(): `Map`\<`string`, [`Assumption`](../interfaces/Assumption.md)\>

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:127

Get all active assumptions across all entries.

#### Returns

`Map`\<`string`, [`Assumption`](../interfaces/Assumption.md)\>

Map of assumption ID to assumption

***

### getAllEntries()

> **getAllEntries**(): [`LedgerEntry`](../interfaces/LedgerEntry.md)[]

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:87

Get all entries (in order of append) with current status.

#### Returns

[`LedgerEntry`](../interfaces/LedgerEntry.md)[]

Array of all entries with current status from the map

***

### getEntriesForRule()

> **getEntriesForRule**(`ruleId`): [`LedgerEntry`](../interfaces/LedgerEntry.md)[]

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:98

Get entries for a specific rule ID.

#### Parameters

##### ruleId

`string`

The rule ID

#### Returns

[`LedgerEntry`](../interfaces/LedgerEntry.md)[]

Array of entries for this rule with current status

***

### getEntry()

> **getEntry**(`id`): [`LedgerEntry`](../interfaces/LedgerEntry.md) \| `undefined`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:78

Get an entry by ID.

#### Parameters

##### id

`string`

The entry ID

#### Returns

[`LedgerEntry`](../interfaces/LedgerEntry.md) \| `undefined`

The entry, or undefined if not found

***

### getLatestEntry()

> **getLatestEntry**(`ruleId`): [`LedgerEntry`](../interfaces/LedgerEntry.md) \| `undefined`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:110

Get the latest active entry for a rule.

#### Parameters

##### ruleId

`string`

The rule ID

#### Returns

[`LedgerEntry`](../interfaces/LedgerEntry.md) \| `undefined`

The latest active entry, or undefined if none

***

### getStats()

> **getStats**(): `object`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:176

Get ledger statistics.

#### Returns

`object`

##### activeEntries

> **activeEntries**: `number`

##### deprecatedEntries

> **deprecatedEntries**: `number`

##### supersededEntries

> **supersededEntries**: `number`

##### totalEntries

> **totalEntries**: `number`

##### uniqueRules

> **uniqueRules**: `number`

***

### toJSON()

> **toJSON**(): `string`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:204

Export ledger as JSON.

#### Returns

`string`

JSON string with current entry status

***

### fromJSON()

> `static` **fromJSON**(`json`): `BehaviorLedger`

Defined in: packages/praxis-core/src/decision-ledger/ledger.ts:227

Import ledger from JSON.

Note: The JSON must contain entries in the order they were originally appended.
If a superseding entry appears before the entry it supersedes, the superseding
logic will not work correctly. The toJSON method preserves this order.

#### Parameters

##### json

`string`

The JSON string

#### Returns

`BehaviorLedger`

A new BehaviorLedger instance
