[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ChronicleContext

# Class: ChronicleContext

Defined in: src/core/chronicle/context.ts:32

Stack-based synchronous causal context propagation.

Uses a call-stack approach for environments without AsyncLocalStorage.
Works correctly for synchronous and sequentially-awaited async code.
For concurrent async flows, use `runAsync` per logical operation.

## Constructors

### Constructor

> **new ChronicleContext**(): `ChronicleContext`

#### Returns

`ChronicleContext`

## Accessors

### current

#### Get Signature

> **get** `static` **current**(): [`ChronicleSpan`](../interfaces/ChronicleSpan.md) \| `undefined`

Defined in: src/core/chronicle/context.ts:38

Get the current active span, if any.

##### Returns

[`ChronicleSpan`](../interfaces/ChronicleSpan.md) \| `undefined`

## Methods

### childSpan()

> `static` **childSpan**(`spanId`): [`ChronicleSpan`](../interfaces/ChronicleSpan.md)

Defined in: src/core/chronicle/context.ts:74

Create a child span that inherits the current contextId.

#### Parameters

##### spanId

`string`

ID for the new span

#### Returns

[`ChronicleSpan`](../interfaces/ChronicleSpan.md)

A new ChronicleSpan with the current contextId

***

### run()

> `static` **run**\<`T`\>(`span`, `fn`): `T`

Defined in: src/core/chronicle/context.ts:46

Run a synchronous function within a causal span.
The span is automatically popped when the function returns.

#### Type Parameters

##### T

`T`

#### Parameters

##### span

[`ChronicleSpan`](../interfaces/ChronicleSpan.md)

##### fn

() => `T`

#### Returns

`T`

***

### runAsync()

> `static` **runAsync**\<`T`\>(`span`, `fn`): `Promise`\<`T`\>

Defined in: src/core/chronicle/context.ts:59

Run an async function within a causal span.
The span is popped after the promise settles.

#### Type Parameters

##### T

`T`

#### Parameters

##### span

[`ChronicleSpan`](../interfaces/ChronicleSpan.md)

##### fn

() => `Promise`\<`T`\>

#### Returns

`Promise`\<`T`\>
