[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / ComponentDefinition

# Interface: ComponentDefinition

Defined in: src/core/schema/types.ts:141

Component definition for UI

## Extended by

- [`NormalizedComponent`](NormalizedComponent.md)

## Properties

### description?

> `optional` **description?**: `string`

Defined in: src/core/schema/types.ts:147

Component description

***

### events?

> `optional` **events?**: `ComponentEvent`[]

Defined in: src/core/schema/types.ts:153

Component events

***

### layout?

> `optional` **layout?**: `LayoutDefinition`

Defined in: src/core/schema/types.ts:155

Component layout

***

### model?

> `optional` **model?**: `string`

Defined in: src/core/schema/types.ts:149

Model binding

***

### name

> **name**: `string`

Defined in: src/core/schema/types.ts:143

Component name

***

### props?

> `optional` **props?**: `ComponentProp`[]

Defined in: src/core/schema/types.ts:151

Component properties

***

### styling?

> `optional` **styling?**: `StylingDefinition`

Defined in: src/core/schema/types.ts:157

Component styling

***

### type

> **type**: `"custom"` \| `"form"` \| `"display"` \| `"list"` \| `"navigation"`

Defined in: src/core/schema/types.ts:145

Component type
