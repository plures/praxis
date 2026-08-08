[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / maintenance

# Variable: maintenance

> `const` **maintenance**: `object`

Defined in: src/lifecycle/maintenance.ts:148

Built-in trigger actions for the maintenance lifecycle phase (vulnerability scanning, dependency updates, and incident response).

## Type Declaration

### auditDependencies()

> **auditDependencies**(): [`TriggerAction`](../interfaces/TriggerAction.md)

Scan for vulnerabilities and create expectations.

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### checkOutdated()

> **checkOutdated**(): [`TriggerAction`](../interfaces/TriggerAction.md)

Check for outdated dependencies.

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### processCustomerReport()

> **processCustomerReport**(): [`TriggerAction`](../interfaces/TriggerAction.md)

Process a customer report into the expectation pipeline.

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)

### processIncident()

> **processIncident**(): [`TriggerAction`](../interfaces/TriggerAction.md)

Process an incident into the hotfix fast-path.

#### Returns

[`TriggerAction`](../interfaces/TriggerAction.md)
