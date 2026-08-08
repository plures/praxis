[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / defineContract

# Function: defineContract()

> **defineContract**(`options`): [`Contract`](../interfaces/Contract.md)

Defined in: packages/praxis-core/src/decision-ledger/types.ts:146

Define a contract for a rule or constraint.

## Parameters

### options

[`DefineContractOptions`](../interfaces/DefineContractOptions.md)

Contract definition options including `ruleId`, `behavior`, `examples`, and `invariants`

## Returns

[`Contract`](../interfaces/Contract.md)

A fully constructed [Contract](../interfaces/Contract.md) with a generated timestamp and default version

## Example

```ts
const loginContract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Process login events and create user session facts',
  examples: [
    {
      given: 'User provides valid credentials',
      when: 'LOGIN event is received',
      then: 'UserSessionCreated fact is emitted'
    }
  ],
  invariants: ['Session must have unique ID']
});
```
