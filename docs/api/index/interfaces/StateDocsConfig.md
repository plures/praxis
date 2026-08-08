[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / StateDocsConfig

# Interface: StateDocsConfig

Defined in: src/integrations/state-docs.ts:23

State-Docs configuration

## Properties

### globs?

> `optional` **globs?**: `string`[]

Defined in: src/integrations/state-docs.ts:31

File patterns to include

***

### projectTitle

> **projectTitle**: `string`

Defined in: src/integrations/state-docs.ts:25

Project title

***

### source?

> `optional` **source?**: `string`

Defined in: src/integrations/state-docs.ts:27

Source directory containing schemas

***

### target?

> `optional` **target?**: `string`

Defined in: src/integrations/state-docs.ts:29

Target directory for generated docs

***

### template?

> `optional` **template?**: `object`

Defined in: src/integrations/state-docs.ts:42

Template settings

#### footer?

> `optional` **footer?**: `string`

Custom footer content

#### header?

> `optional` **header?**: `string`

Custom header content

#### timestamp?

> `optional` **timestamp?**: `boolean`

Include timestamp

#### toc?

> `optional` **toc?**: `boolean`

Include table of contents

***

### visualization?

> `optional` **visualization?**: `object`

Defined in: src/integrations/state-docs.ts:33

Visualization settings

#### exportPng?

> `optional` **exportPng?**: `boolean`

Export as PNG

#### format?

> `optional` **format?**: `"mermaid"` \| `"dot"`

Output format

#### theme?

> `optional` **theme?**: `"default"` \| `"dark"` \| `"forest"` \| `"neutral"`

Diagram theme
