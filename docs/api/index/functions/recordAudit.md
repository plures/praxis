[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / recordAudit

# Function: recordAudit()

> **recordAudit**(`chronicle`, `report`, `previousScore?`): `void`

Defined in: src/chronos/hooks.ts:210

Record a completeness audit result into the chronicle.

Standalone utility — call after `auditCompleteness()`.

## Parameters

### chronicle

[`ProjectChronicle`](../classes/ProjectChronicle.md)

The project chronicle to record into

### report

[`CompletenessReport`](../interfaces/CompletenessReport.md)

The completeness report from [auditCompleteness](auditCompleteness.md)

### previousScore?

`number`

Optional previous score to compute a delta for the audit event

## Returns

`void`
