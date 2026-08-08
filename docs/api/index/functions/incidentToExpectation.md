[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / incidentToExpectation

# Function: incidentToExpectation()

> **incidentToExpectation**(`incident`): [`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)

Defined in: src/lifecycle/maintenance.ts:129

Convert an incident to a hotfix expectation.

## Parameters

### incident

[`Incident`](../interfaces/Incident.md)

The production incident to convert

## Returns

[`LifecycleExpectation`](../interfaces/LifecycleExpectation.md)

A [LifecycleExpectation](../interfaces/LifecycleExpectation.md) with type `'fix'` and critical priority
