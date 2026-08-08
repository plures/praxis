[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / PraxisLocalFirstOptions

# Interface: PraxisLocalFirstOptions

Defined in: src/core/pluresdb/adapter.ts:296

Options for creating a local-first PluresDB adapter using the unified API

## Extends

- `LocalFirstOptions`

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### mode?

> `optional` **mode?**: `string`

Defined in: src/core/pluresdb/adapter.ts:11

#### Inherited from

`LocalFirstOptions.mode`

***

### pollInterval?

> `optional` **pollInterval?**: `number`

Defined in: src/core/pluresdb/adapter.ts:298

Optional polling interval override for watch semantics (ms). Defaults to 1000ms.
