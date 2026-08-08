[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisDiagnostics

# Interface: PraxisDiagnostics

Defined in: packages/praxis-core/src/protocol.ts:94

Diagnostic information about constraint violations or rule errors.

## Properties

### data?

> `optional` **data?**: `unknown`

Defined in: packages/praxis-core/src/protocol.ts:100

Additional diagnostic data

***

### kind

> **kind**: `"constraint-violation"` \| `"rule-error"`

Defined in: packages/praxis-core/src/protocol.ts:96

Kind of diagnostic

***

### message

> **message**: `string`

Defined in: packages/praxis-core/src/protocol.ts:98

Human-readable message
