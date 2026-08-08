[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / auditDocs

# Function: auditDocs()

> **auditDocs**(`rootDir`, `config`): [`DocsAuditResult`](../interfaces/DocsAuditResult.md)

Defined in: src/lifecycle/docs.ts:216

Scan a repository and audit its documentation state.

## Parameters

### rootDir

`string`

The root directory of the repository to scan

### config

[`DocsConfig`](../interfaces/DocsConfig.md)

Documentation configuration specifying which files and templates to track

## Returns

[`DocsAuditResult`](../interfaces/DocsAuditResult.md)

A [DocsAuditResult](../interfaces/DocsAuditResult.md) with coverage scores and per-document status
