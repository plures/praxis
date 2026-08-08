[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / loadExpectations

# Function: loadExpectations()

> **loadExpectations**(`dir`): `Promise`\<[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)[]\>

Defined in: src/lifecycle/expectation.ts:266

Parse expectation files from a directory.
Expects .ts/.js files that default-export a LifecycleExpectation or array of them.

Note: In Node.js, this uses dynamic import(). In CLI context, expectations
are loaded via the config loader.

## Parameters

### dir

`string`

Directory path to scan for expectation files

## Returns

`Promise`\<[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)[]\>

Array of all valid [LifecycleExpectation](../interfaces/LifecycleExpectation.md) objects found in the directory
