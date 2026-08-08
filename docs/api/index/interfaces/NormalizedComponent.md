[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / NormalizedComponent

# Interface: NormalizedComponent

Defined in: src/core/schema/normalize.ts:43

Normalized component definition

## Extends

- [`ComponentDefinition`](ComponentDefinition.md)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: src/core/schema/types.ts:147

Component description

#### Inherited from

[`ComponentDefinition`](ComponentDefinition.md).[`description`](ComponentDefinition.md#description)

***

### events?

> `optional` **events?**: `ComponentEvent`[]

Defined in: src/core/schema/types.ts:153

Component events

#### Inherited from

[`ComponentDefinition`](ComponentDefinition.md).[`events`](ComponentDefinition.md#events)

***

### fullName

> **fullName**: `string`

Defined in: src/core/schema/normalize.ts:45

Fully qualified name

***

### layout?

> `optional` **layout?**: `LayoutDefinition`

Defined in: src/core/schema/types.ts:155

Component layout

#### Inherited from

[`ComponentDefinition`](ComponentDefinition.md).[`layout`](ComponentDefinition.md#layout)

***

### model?

> `optional` **model?**: `string`

Defined in: src/core/schema/types.ts:149

Model binding

#### Inherited from

[`ComponentDefinition`](ComponentDefinition.md).[`model`](ComponentDefinition.md#model)

***

### name

> **name**: `string`

Defined in: src/core/schema/types.ts:143

Component name

#### Inherited from

[`ComponentDefinition`](ComponentDefinition.md).[`name`](ComponentDefinition.md#name)

***

### props?

> `optional` **props?**: `ComponentProp`[]

Defined in: src/core/schema/types.ts:151

Component properties

#### Inherited from

[`ComponentDefinition`](ComponentDefinition.md).[`props`](ComponentDefinition.md#props)

***

### resolvedModel?

> `optional` **resolvedModel?**: [`NormalizedModel`](NormalizedModel.md)

Defined in: src/core/schema/normalize.ts:47

Resolved model reference

***

### styling?

> `optional` **styling?**: `StylingDefinition`

Defined in: src/core/schema/types.ts:157

Component styling

#### Inherited from

[`ComponentDefinition`](ComponentDefinition.md).[`styling`](ComponentDefinition.md#styling)

***

### type

> **type**: `"custom"` \| `"form"` \| `"display"` \| `"list"` \| `"navigation"`

Defined in: src/core/schema/types.ts:145

Component type

#### Inherited from

[`ComponentDefinition`](ComponentDefinition.md).[`type`](ComponentDefinition.md#type)
