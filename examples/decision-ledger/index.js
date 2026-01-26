/**
 * Decision Ledger Example
 *
 * Demonstrates contract definition, validation, and behavior ledger tracking.
 */

import {
  PraxisRegistry,
  defineRule,
  defineConstraint,
  defineContract,
  validateContracts,
  formatValidationReport,
  createBehaviorLedger,
} from '../../dist/node/index.js';

console.log('='.repeat(60));
console.log('Decision Ledger Example');
console.log('='.repeat(60));
console.log();

// Step 1: Define contracts for rules
console.log('Step 1: Defining Contracts');
console.log('-'.repeat(60));

const loginContract = defineContract({
  ruleId: 'auth.login',
  behavior: 'Process login events and create user session facts',
  examples: [
    {
      given: 'User provides valid credentials',
      when: 'LOGIN event is received',
      then: 'UserSessionCreated fact is emitted',
    },
    {
      given: 'User provides invalid credentials',
      when: 'LOGIN event is received',
      then: 'LoginFailed fact is emitted',
    },
  ],
  invariants: [
    'Session must have unique ID',
    'Session must have timestamp',
    'Failed login attempts must be logged',
  ],
  assumptions: [
    {
      id: 'assume-unique-username',
      statement: 'Usernames are unique across the system',
      confidence: 0.9,
      justification: 'Standard practice in authentication systems',
      impacts: ['spec', 'tests'],
      status: 'active',
    },
  ],
  references: [
    { type: 'doc', url: 'https://docs.example.com/auth', description: 'Authentication documentation' },
  ],
});

console.log(`✓ Defined contract for 'auth.login'`);
console.log(`  - Behavior: ${loginContract.behavior}`);
console.log(`  - Examples: ${loginContract.examples.length}`);
console.log(`  - Invariants: ${loginContract.invariants.length}`);
console.log(`  - Assumptions: ${loginContract.assumptions?.length || 0}`);
console.log();

const cartContract = defineContract({
  ruleId: 'cart.addItem',
  behavior: 'Add item to shopping cart with quantity validation',
  examples: [
    {
      given: 'Cart has space and item is in stock',
      when: 'ADD_TO_CART event is received',
      then: 'ItemAdded fact is emitted',
    },
  ],
  invariants: [
    'Cart cannot exceed 100 items',
    'Item quantity must be positive',
  ],
});

console.log(`✓ Defined contract for 'cart.addItem'`);
console.log();

// Step 2: Register rules with contracts
console.log('Step 2: Registering Rules');
console.log('-'.repeat(60));

const registry = new PraxisRegistry();

const loginRule = defineRule({
  id: 'auth.login',
  description: 'Process login events',
  impl: (state, events) => {
    // Simplified implementation
    return [];
  },
  meta: { contract: loginContract },
});

registry.registerRule(loginRule);
console.log(`✓ Registered rule 'auth.login' with contract`);

const cartRule = defineRule({
  id: 'cart.addItem',
  description: 'Add item to cart',
  impl: (state, events) => {
    return [];
  },
  meta: { contract: cartContract },
});

registry.registerRule(cartRule);
console.log(`✓ Registered rule 'cart.addItem' with contract`);

// Rule without contract
const legacyRule = defineRule({
  id: 'legacy.process',
  description: 'Legacy processing rule',
  impl: (state, events) => {
    return [];
  },
});

registry.registerRule(legacyRule);
console.log(`✓ Registered rule 'legacy.process' (no contract)`);
console.log();

// Step 3: Validate contracts
console.log('Step 3: Validating Contracts');
console.log('-'.repeat(60));

const report = validateContracts(registry, {
  strict: false,
  requiredFields: ['behavior', 'examples'],
});

console.log(formatValidationReport(report));
console.log();

// Step 4: Behavior Ledger
console.log('Step 4: Behavior Ledger');
console.log('-'.repeat(60));

const ledger = createBehaviorLedger();

// Initial entry
ledger.append({
  id: 'login-v1',
  timestamp: '2025-01-26T00:00:00Z',
  status: 'active',
  author: 'team',
  contract: loginContract,
  reason: 'initial',
});

console.log(`✓ Added ledger entry for 'auth.login' v1.0.0`);

// Updated contract
const loginContractV2 = defineContract({
  ruleId: 'auth.login',
  behavior: 'Enhanced login processing with MFA support',
  examples: [
    ...loginContract.examples,
    {
      given: 'User has MFA enabled',
      when: 'LOGIN event is received with valid credentials',
      then: 'MFARequired fact is emitted',
    },
  ],
  invariants: [...loginContract.invariants, 'MFA tokens must be validated'],
  assumptions: [
    {
      id: 'assume-unique-username',
      statement: 'Usernames are unique across the system',
      confidence: 0.9,
      justification: 'Standard practice in authentication systems',
      impacts: ['spec', 'tests'],
      status: 'active',
    },
    {
      id: 'assume-mfa-provider',
      statement: 'MFA provider API is available and reliable',
      confidence: 0.85,
      justification: 'Using standard TOTP implementation',
      impacts: ['spec', 'code'],
      status: 'active',
    },
  ],
  version: '2.0.0',
});

ledger.append({
  id: 'login-v2',
  timestamp: '2025-01-26T12:00:00Z',
  status: 'active',
  author: 'team',
  contract: loginContractV2,
  supersedes: 'login-v1',
  reason: 'behavior-updated',
});

console.log(`✓ Added ledger entry for 'auth.login' v2.0.0 (supersedes v1.0.0)`);
console.log();

// Step 5: Query ledger
console.log('Step 5: Querying Ledger');
console.log('-'.repeat(60));

const latest = ledger.getLatestEntry('auth.login');
console.log(`Latest contract version: ${latest?.contract.version}`);
console.log(`Contract behavior: ${latest?.contract.behavior}`);
console.log();

const stats = ledger.getStats();
console.log('Ledger Statistics:');
console.log(`  - Total entries: ${stats.totalEntries}`);
console.log(`  - Active entries: ${stats.activeEntries}`);
console.log(`  - Superseded entries: ${stats.supersededEntries}`);
console.log(`  - Unique rules: ${stats.uniqueRules}`);
console.log();

const activeAssumptions = ledger.getActiveAssumptions();
console.log(`Active Assumptions (${activeAssumptions.size}):`);
for (const [id, assumption] of activeAssumptions.entries()) {
  console.log(`  - ${id}: ${assumption.statement}`);
  console.log(`    Confidence: ${assumption.confidence * 100}%`);
  console.log(`    Impacts: ${assumption.impacts.join(', ')}`);
}
console.log();

// Step 6: Export ledger
console.log('Step 6: Exporting Ledger');
console.log('-'.repeat(60));

const json = ledger.toJSON();
console.log(`✓ Exported ledger as JSON (${json.length} bytes)`);
console.log();

console.log('='.repeat(60));
console.log('Example Complete!');
console.log('='.repeat(60));
console.log();
console.log('Key Takeaways:');
console.log('  1. Contracts document rule behavior explicitly');
console.log('  2. Validation identifies missing or incomplete contracts');
console.log('  3. Behavior ledger maintains an audit trail');
console.log('  4. Assumptions track inferred requirements');
console.log('  5. All data is JSON-serializable and portable');
console.log();
