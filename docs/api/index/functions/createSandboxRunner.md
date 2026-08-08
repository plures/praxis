[**@plures/praxis**](../../README.md)

***

[@plures/praxis](../../README.md) / [index](../README.md) / createSandboxRunner

# Function: createSandboxRunner()

> **createSandboxRunner**(`config`): [`SandboxRunner`](../interfaces/SandboxRunner.md)

Defined in: src/experiments/index.ts:279

Create a sandbox runner with given constraints.

The runner clones the production registry and engine state into an isolated
sandbox, then executes the experiment steps (inject-facts → run-engine →
observe → assert) without touching production state.

## Parameters

### config

#### onResourceExceeded?

(`metric`, `value`, `limit`) => `void`

Optional callback fired when memory or time
                                  limits are breached.

#### productionEngine?

[`LogicEngine`](../classes/LogicEngine.md)\<`unknown`\>

Optional engine whose state (context + facts)
                                  seeds the sandbox.

#### productionFacts?

`Map`\<`string`, `unknown`\>

Legacy: Map-based fact seed (used when no
                                  productionEngine is provided).

#### productionRegistry?

[`PraxisRegistry`](../classes/PraxisRegistry.md)\<`unknown`\>

Optional registry to clone into the sandbox.

#### productionRules?

`Map`\<`string`, `unknown`\>

Legacy: Map-based rule seed (unused in current
                                  implementation, reserved for future use).

#### rulePatches?

`Map`\<`string`, [`RuleDescriptor`](../interfaces/RuleDescriptor.md)\<`unknown`\>\>

Map of ruleId → patched descriptor applied when
                                  a `modify-rule` step targets that rule.

## Returns

[`SandboxRunner`](../interfaces/SandboxRunner.md)
