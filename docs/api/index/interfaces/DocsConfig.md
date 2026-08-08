[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / DocsConfig

# Interface: DocsConfig

Defined in: src/lifecycle/docs.ts:98

Configuration for the document writer

## Properties

### docsDir

> **docsDir**: `string`

Defined in: src/lifecycle/docs.ts:100

Root directory for docs (default: 'docs/')

***

### exampleDirs

> **exampleDirs**: `string`[]

Defined in: src/lifecycle/docs.ts:104

Example directories to validate

***

### rootDocs

> **rootDocs**: `string`[]

Defined in: src/lifecycle/docs.ts:102

Additional doc paths to track (e.g., 'README.md', 'CONTRIBUTING.md')

***

### sourceDirs

> **sourceDirs**: `string`[]

Defined in: src/lifecycle/docs.ts:108

Source directories that trigger doc updates when changed

***

### templates

> **templates**: [`DocumentTemplate`](DocumentTemplate.md)[]

Defined in: src/lifecycle/docs.ts:106

Templates for consistent formatting
